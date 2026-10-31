import json
import secrets
import uuid
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from . import config
from .db import audit, connection, initialize, now, row_dict
from .policy import POLICY_VERSION, evaluate
from .schemas import ApprovalRequest, ComplaintCreate


@asynccontextmanager
async def lifespan(app: FastAPI):
    initialize()
    yield


app = FastAPI(title="ReturnPilot demo API", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=[config.FRONTEND_ORIGIN], allow_credentials=False, allow_methods=["GET", "POST"], allow_headers=["Authorization", "Content-Type"])


def role(authorization: str | None = Header(default=None)) -> str:
    token = authorization.removeprefix("Bearer ") if authorization else ""
    if secrets.compare_digest(token, config.CUSTOMER_TOKEN):
        return "customer"
    if secrets.compare_digest(token, config.RETAILER_TOKEN):
        return "retailer"
    raise HTTPException(401, "Invalid demo token")


def retailer(user_role: str = Depends(role)):
    if user_role != "retailer":
        raise HTTPException(403, "Retailer access required")
    return user_role


def visible_case(db, case_id: str, user_role: str):
    case = row_dict(db.execute("SELECT * FROM cases WHERE id=?", (case_id,)).fetchone())
    if not case or (user_role == "customer" and case["customer_id"] != "demo-customer"):
        raise HTTPException(404, "Case not found")
    return case


@app.get("/health")
def health():
    return {"status": "ok", "investigation_mode": config.INVESTIGATION_MODE}


@app.get("/api/orders")
def orders(user_role: str = Depends(role)):
    if user_role != "customer":
        raise HTTPException(403, "Customer access required")
    with connection() as db:
        return [dict(r) for r in db.execute("SELECT * FROM orders WHERE customer_id=? ORDER BY id", ("demo-customer",))]


@app.post("/api/cases", status_code=201)
async def create_case(body: ComplaintCreate, user_role: str = Depends(role)):
    if user_role != "customer":
        raise HTTPException(403, "Customer access required")
    with connection() as db:
        order = row_dict(db.execute("SELECT * FROM orders WHERE id=? AND customer_id=?", (body.order_id, "demo-customer")).fetchone())
    if not order:
        raise HTTPException(404, "Order not found")
    policy = evaluate(order, body.issue_type)
    from agents.investigate import investigate
    try:
        investigation = await investigate(order, body.issue_type, body.description, policy)
    except Exception as exc:
        raise HTTPException(503, f"Investigation unavailable: {type(exc).__name__}") from exc
    case_id = "CASE-" + uuid.uuid4().hex[:10].upper()
    with connection() as db:
        db.execute("""INSERT INTO cases VALUES (?,?,?,?,?,?,?,?,?,?,?)""", (
            case_id, order["id"], "demo-customer", body.issue_type, body.description,
            policy["recommendation"], policy["proposed_amount_pence"], policy["reason"],
            investigation, "pending_review", now(),
        ))
        audit(db, case_id, "complaint_submitted", "demo-customer", {"order_id": order["id"], "issue_type": body.issue_type})
        audit(db, case_id, "investigation_completed", "system", {"mode": config.INVESTIGATION_MODE, "policy_version": POLICY_VERSION, "recommendation": policy["recommendation"]})
        return visible_case(db, case_id, user_role)


@app.get("/api/cases")
def cases(_user_role: str = Depends(retailer)):
    with connection() as db:
        return [dict(r) for r in db.execute("SELECT * FROM cases ORDER BY created_at DESC")]


@app.get("/api/cases/{case_id}")
def get_case(case_id: str, user_role: str = Depends(role)):
    with connection() as db:
        return visible_case(db, case_id, user_role)


@app.get("/api/cases/{case_id}/audit")
def get_audit(case_id: str, _user_role: str = Depends(retailer)):
    with connection() as db:
        visible_case(db, case_id, "retailer")
        return [{**dict(r), "details": json.loads(r["details"])} for r in db.execute("SELECT * FROM audit_events WHERE case_id=? ORDER BY id", (case_id,))]


@app.post("/api/cases/{case_id}/approve")
def approve(case_id: str, body: ApprovalRequest, _user_role: str = Depends(retailer)):
    with connection() as db:
        case = visible_case(db, case_id, "retailer")
        if case["status"] != "pending_review":
            raise HTTPException(409, "Case already reviewed")
        if body.decision == "reject":
            db.execute("UPDATE cases SET status='rejected' WHERE id=?", (case_id,))
            audit(db, case_id, "recommendation_rejected", "demo-retailer", {"note": body.note})
        else:
            order = row_dict(db.execute("SELECT * FROM orders WHERE id=?", (case["order_id"],)).fetchone())
            if case["recommendation"] == "refund":
                amount = case["proposed_amount_pence"]
                if amount <= 0 or amount > order["amount_pence"]:
                    raise HTTPException(409, "Invalid refund amount")
            db.execute("UPDATE cases SET status='approved' WHERE id=?", (case_id,))
            audit(db, case_id, "recommendation_approved", "demo-retailer", {"note": body.note})
            if case["recommendation"] == "refund":
                db.execute("INSERT INTO simulated_refunds VALUES (?,?,?,?)", (case_id, case["order_id"], amount, now()))
                audit(db, case_id, "simulated_refund_recorded", "system", {"amount_pence": amount, "payment_processed": False})
        return visible_case(db, case_id, "retailer")
