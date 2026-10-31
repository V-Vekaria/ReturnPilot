from fastapi import APIRouter, HTTPException

from agents.investigate import investigate
from backend.app import policy
from backend.app.db import connection, log_event, now, row_dict

router = APIRouter()


@router.post("/api/cases/{case_id}/investigate")
async def investigate_case(case_id: str):
    # 1. claim the case atomically; a second concurrent/duplicate call gets 409
    with connection() as db:
        cur = db.execute("UPDATE cases SET status='investigating', updated_at=? WHERE id=? AND status='submitted'",
                         (now(), case_id))
        if cur.rowcount == 0:
            exists = db.execute("SELECT 1 FROM cases WHERE id=?", (case_id,)).fetchone()
            raise HTTPException(409 if exists else 404, "Case already investigated" if exists else "Case not found")
        log_event(db, case_id, "system", "investigation_started", "Investigation started")
        case = row_dict(db.execute("SELECT * FROM cases WHERE id=?", (case_id,)).fetchone())
        order = row_dict(db.execute("SELECT * FROM orders WHERE id=?", (case["order_id"],)).fetchone())

    # 2. run policy + summary OUTSIDE the db context (the LLM call can be slow)
    try:
        if order is None:
            raise LookupError("order_not_found")
        result = policy.evaluate(order, case["issue_type"])
        summary = await investigate(order, case["issue_type"], case["description"], result)
    except Exception as exc:
        with connection() as db:  # roll back to submitted so staff can retry; no invented findings
            db.execute("UPDATE cases SET status='submitted', updated_at=? WHERE id=?", (now(), case_id))
            log_event(db, case_id, "system", "investigation_failed", f"Investigation failed: {type(exc).__name__}")
        raise HTTPException(503, "Investigation service unavailable; case left open")

    # 3. amount comes from the stored order, only for a refund recommendation; never from the description
    amount = order["amount_pence"] if result["recommendation"] == "refund" else None
    with connection() as db:
        db.execute("""UPDATE cases SET status='awaiting_review', recommendation=?, proposed_amount_pence=?,
                      investigation_summary=?, policy_reason=?, updated_at=? WHERE id=?""",
                   (result["recommendation"], amount, summary,
                    f"{result['rule_id']}@{policy.POLICY_VERSION}: {result['reason']}", now(), case_id))
        log_event(db, case_id, "system", "proposal_created", f"Recommendation: {result['recommendation']}")
        return row_dict(db.execute("SELECT * FROM cases WHERE id=?", (case_id,)).fetchone())
