from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.app.db import connection, log_event, now, row_dict

router = APIRouter()


class CaseCreate(BaseModel):
    order_id: str
    issue_type: Literal["damaged_item", "disputed_delivery", "change_of_mind"]
    description: str = Field(min_length=10, max_length=2000)


class Decision(BaseModel):
    decision: Literal["approve", "reject", "escalate"]
    note: str = Field(min_length=10, max_length=500)


@router.get("/api/orders")
def list_orders():
    with connection() as db:
        rows = db.execute("SELECT * FROM orders ORDER BY id").fetchall()
    return [row_dict(row) for row in rows]


@router.post("/api/cases", status_code=201)
def create_case(body: CaseCreate):
    with connection() as db:
        order_exists = db.execute(
            "SELECT 1 FROM orders WHERE id=?", (body.order_id,)
        ).fetchone()
        if not order_exists:
            raise HTTPException(status_code=404, detail="Order not found")

        count = db.execute("SELECT COUNT(*) FROM cases").fetchone()[0]
        case_id = f"RP-{count + 1:04d}"
        timestamp = now()
        db.execute(
            """INSERT INTO cases(
                id, order_id, issue_type, description, status, created_at, updated_at
            ) VALUES(?, ?, ?, ?, ?, ?, ?)""",
            (
                case_id,
                body.order_id,
                body.issue_type,
                body.description,
                "submitted",
                timestamp,
                timestamp,
            ),
        )
        log_event(db, case_id, "customer", "case_created", "Case submitted")
        return row_dict(
            db.execute("SELECT * FROM cases WHERE id=?", (case_id,)).fetchone()
        )


@router.get("/api/cases")
def list_cases(status: str | None = None):
    with connection() as db:
        if status is None:
            rows = db.execute(
                "SELECT * FROM cases ORDER BY created_at DESC, id DESC"
            ).fetchall()
        else:
            rows = db.execute(
                "SELECT * FROM cases WHERE status=? ORDER BY created_at DESC, id DESC",
                (status,),
            ).fetchall()
    items = [row_dict(row) for row in rows]
    return {"items": items, "total": len(items)}


@router.get("/api/customer/cases/{case_id}")
def get_customer_case(case_id: str):
    messages = {
        "submitted": "We have received your complaint",
        "investigating": "We are investigating your complaint",
        "awaiting_review": "Your complaint is awaiting review",
        "resolved": "Resolution completed",
        "escalated": "Our team needs to investigate further",
        "rejected": "Your complaint has been reviewed",
    }
    with connection() as db:
        case = row_dict(
            db.execute("SELECT * FROM cases WHERE id=?", (case_id,)).fetchone()
        )
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    return {
        "id": case["id"],
        "order_id": case["order_id"],
        "issue_type": case["issue_type"],
        "status": case["status"],
        "created_at": case["created_at"],
        "updated_at": case["updated_at"],
        "message": messages.get(case["status"], "Your complaint is being reviewed"),
    }


@router.get("/api/cases/{case_id}/audit")
def get_case_audit(case_id: str):
    with connection() as db:
        if not db.execute("SELECT 1 FROM cases WHERE id=?", (case_id,)).fetchone():
            raise HTTPException(status_code=404, detail="Case not found")
        rows = db.execute(
            "SELECT * FROM events WHERE case_id=? ORDER BY id", (case_id,)
        ).fetchall()
    return {"items": [row_dict(row) for row in rows]}


@router.get("/api/cases/{case_id}")
def get_case(case_id: str):
    with connection() as db:
        case = row_dict(
            db.execute("SELECT * FROM cases WHERE id=?", (case_id,)).fetchone()
        )
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@router.post("/api/cases/{case_id}/decision")
def decide_case(case_id: str, body: Decision):
    with connection() as db:
        case = row_dict(
            db.execute("SELECT * FROM cases WHERE id=?", (case_id,)).fetchone()
        )
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")
        if body.decision == "approve" and (
            case["recommendation"] != "refund" or not case["proposed_amount_pence"]
        ):
            raise HTTPException(
                status_code=409,
                detail="No refund proposal to approve; escalate or reject instead",
            )

        new_status = {
            "approve": "resolved",
            "reject": "rejected",
            "escalate": "escalated",
        }[body.decision]
        timestamp = now()
        cursor = db.execute(
            """UPDATE cases
               SET status=?, decision_note=?, updated_at=?
               WHERE id=? AND status='awaiting_review'""",
            (new_status, body.note, timestamp, case_id),
        )
        if cursor.rowcount == 0:
            raise HTTPException(status_code=409, detail="Case is not awaiting review")

        if body.decision == "approve":
            db.execute(
                "INSERT INTO resolutions VALUES(?,?,?,?)",
                (
                    case_id,
                    case["proposed_amount_pence"],
                    f"MOCK-REF-{case_id}",
                    timestamp,
                ),
            )

        log_event(db, case_id, "retailer", f"decision_{body.decision}", body.note)
        return row_dict(
            db.execute("SELECT * FROM cases WHERE id=?", (case_id,)).fetchone()
        )