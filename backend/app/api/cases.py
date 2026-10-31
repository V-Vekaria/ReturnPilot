import json
from typing import Literal, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, field_validator

from backend.app.db import connection, log_event, now, row_dict

router = APIRouter()

IssueType = Literal["damaged_item", "disputed_delivery", "change_of_mind"]

CUSTOMER_MESSAGES = {
    "submitted": "We have received your complaint and will investigate it shortly.",
    "investigating": "We are checking your complaint against your order records.",
    "awaiting_review": "Our team is reviewing the findings. No outcome has been authorised yet.",
    "resolved": "Your case has been resolved. This is a demo: no real money has moved.",
    "escalated": "Our team needs to investigate further. We will update this page.",
    "rejected": "We were unable to approve this complaint.",
}

# Event types the customer may see, with customer-safe wording (never the internal message)
PUBLIC_EVENTS = {
    "case_created": "Complaint submitted",
    "investigation_started": "Investigation started",
    "proposal_created": "Investigation complete; awaiting team review",
    "decision_approve": "Resolution approved",
    "decision_reject": "Complaint reviewed: not approved",
    "decision_escalate": "Escalated for further review",
}


class CaseDetails(BaseModel):
    """Customer-supplied context. Stored as given; never used for policy or amounts."""
    customer_name: Optional[str] = Field(None, max_length=200)
    customer_email: Optional[str] = Field(None, max_length=200)
    customer_phone: Optional[str] = Field(None, max_length=50)
    title: Optional[str] = Field(None, max_length=200)
    product_name: Optional[str] = Field(None, max_length=200)
    product_category: Optional[str] = Field(None, max_length=100)
    purchase_date: Optional[str] = Field(None, max_length=20)
    issue_date: Optional[str] = Field(None, max_length=20)
    requested_resolution: Optional[str] = Field(None, max_length=50)
    evidence_files: list[str] = Field(default_factory=list, max_length=20)


class CreateCase(BaseModel):
    order_id: str = Field(min_length=3, max_length=40)
    issue_type: IssueType
    description: str = Field(min_length=10, max_length=2000)
    details: CaseDetails = Field(default_factory=CaseDetails)

    @field_validator("order_id", "description", mode="before")
    @classmethod
    def strip(cls, v):
        return v.strip().upper() if isinstance(v, str) and len(v) <= 40 else (v.strip() if isinstance(v, str) else v)


class Decision(BaseModel):
    decision: Literal["approve", "reject", "escalate"]
    note: str = Field(min_length=10, max_length=500)
    customer_message: Optional[str] = Field(None, max_length=1000)


def _load_case(db, case_id):
    case = row_dict(db.execute("SELECT * FROM cases WHERE id=?", (case_id,)).fetchone())
    if not case:
        raise HTTPException(404, "Case not found")
    return case


def _staff_view(db, case):
    case = dict(case)
    case["details"] = json.loads(case["details"] or "{}")
    case["order"] = row_dict(db.execute("SELECT * FROM orders WHERE id=?", (case["order_id"],)).fetchone())
    case["resolution"] = row_dict(db.execute("SELECT * FROM resolutions WHERE case_id=?", (case["id"],)).fetchone())
    return case


@router.get("/api/orders")
def list_orders():
    with connection() as db:
        return {"items": [row_dict(r) for r in db.execute("SELECT * FROM orders ORDER BY id")]}


@router.post("/api/cases", status_code=201)
def create_case(body: CreateCase):
    with connection() as db:
        if not db.execute("SELECT 1 FROM orders WHERE id=?", (body.order_id,)).fetchone():
            raise HTTPException(404, "Order not found. Demo orders: NT-1042, NT-1050, NT-1060")
        count = db.execute("SELECT COUNT(*) FROM cases").fetchone()[0]
        case_id = f"RP-{count + 1:04d}"
        ts = now()
        db.execute("INSERT INTO cases(id, order_id, issue_type, description, status, details, created_at, updated_at) "
                   "VALUES(?,?,?,?,'submitted',?,?,?)",
                   (case_id, body.order_id, body.issue_type, body.description, body.details.model_dump_json(), ts, ts))
        log_event(db, case_id, "customer", "case_created", "Complaint submitted")
        return _staff_view(db, _load_case(db, case_id))


@router.get("/api/cases")
def list_cases(status: Optional[str] = None):
    with connection() as db:
        sql, args = "SELECT * FROM cases", ()
        if status:
            sql, args = sql + " WHERE status=?", (status,)
        items = [_staff_view(db, row_dict(r)) for r in db.execute(sql + " ORDER BY created_at DESC", args)]
        return {"items": items, "total": len(items)}


@router.get("/api/cases/{case_id}")
def get_case(case_id: str):
    with connection() as db:
        return _staff_view(db, _load_case(db, case_id))


@router.get("/api/cases/{case_id}/audit")
def get_audit(case_id: str):
    with connection() as db:
        _load_case(db, case_id)
        return {"items": [row_dict(r) for r in db.execute("SELECT * FROM events WHERE case_id=? ORDER BY id", (case_id,))]}


@router.get("/api/customer/cases/{case_id}")
def get_customer_case(case_id: str, email: Optional[str] = None):
    """Customer-safe projection. Excludes investigation summary, recommendation, policy and staff notes."""
    with connection() as db:
        case = row_dict(db.execute("SELECT * FROM cases WHERE id=?", (case_id.strip().upper(),)).fetchone())
        details = json.loads(case["details"] or "{}") if case else {}
        stored_email = (details.get("customer_email") or "").strip().lower()
        # Same 404 for unknown case and wrong email, so a guessed reference reveals nothing
        if not case or (stored_email and (email or "").strip().lower() != stored_email):
            raise HTTPException(404, "Case not found")
        events = [row_dict(r) for r in db.execute("SELECT * FROM events WHERE case_id=? ORDER BY id", (case["id"],))]
        resolution = row_dict(db.execute("SELECT amount_pence, ref FROM resolutions WHERE case_id=?", (case["id"],)).fetchone())
        return {
            "id": case["id"], "order_id": case["order_id"], "issue_type": case["issue_type"],
            "description": case["description"], "status": case["status"],
            "message": case["customer_message"] or CUSTOMER_MESSAGES.get(case["status"], ""),
            "created_at": case["created_at"], "updated_at": case["updated_at"],
            "title": details.get("title"), "product_name": details.get("product_name"),
            "requested_resolution": details.get("requested_resolution"),
            "public_events": [{"id": e["id"], "at": e["at"], "actor": e["actor"], "message": PUBLIC_EVENTS[e["type"]]}
                              for e in events if e["type"] in PUBLIC_EVENTS],
            "resolution": resolution,
        }


@router.post("/api/cases/{case_id}/decision")
def decide(case_id: str, body: Decision):
    with connection() as db:
        case = _load_case(db, case_id)
        if body.decision == "approve" and (case["recommendation"] != "refund" or not case["proposed_amount_pence"]):
            raise HTTPException(409, "No refund proposal to approve; escalate or reject instead")
        new_status = {"approve": "resolved", "reject": "rejected", "escalate": "escalated"}[body.decision]
        # atomic guard: only one request can move the case out of awaiting_review
        cur = db.execute("UPDATE cases SET status=?, decision_note=?, customer_message=?, updated_at=? "
                         "WHERE id=? AND status='awaiting_review'",
                         (new_status, body.note, body.customer_message, now(), case_id))
        if cur.rowcount == 0:
            raise HTTPException(409, "Case is not awaiting review")
        if body.decision == "approve":
            # amount always from the stored proposal; resolutions.case_id is the PK, so no second refund
            db.execute("INSERT INTO resolutions VALUES(?,?,?,?)",
                       (case_id, case["proposed_amount_pence"], f"MOCK-REF-{case_id}", now()))
        log_event(db, case_id, "retailer", f"decision_{body.decision}", body.note)
        return _staff_view(db, _load_case(db, case_id))
