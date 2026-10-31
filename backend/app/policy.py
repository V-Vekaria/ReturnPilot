from datetime import date

POLICY_VERSION = "demo-v1"


def evaluate(order: dict, issue_type: str) -> dict:
    """Apply fictional merchant demo rules. This is not legal advice."""
    age = (date.today() - date.fromisoformat(order["delivered_at"])).days if order["delivered_at"] else None
    if issue_type == "damaged_item":
        if age is not None and age <= 30:
            return {"recommendation": "refund", "proposed_amount_pence": order["amount_pence"], "reason": "Demo policy: reported damage within 30 days of recorded delivery; staff must review evidence and approve."}
        return {"recommendation": "investigate", "proposed_amount_pence": 0, "reason": "Delivery timing or damage evidence needs staff review."}
    if issue_type == "disputed_delivery":
        return {"recommendation": "investigate", "proposed_amount_pence": 0, "reason": "Delivery status alone does not settle a dispute; check recipient proof and contact the carrier."}
    if issue_type == "change_of_mind":
        if age is not None and age <= 14:
            return {"recommendation": "return_for_review", "proposed_amount_pence": 0, "reason": "Demo policy: request is within 14 days; confirm item condition before any refund."}
        return {"recommendation": "investigate", "proposed_amount_pence": 0, "reason": "Return timing or item condition needs staff review."}
    raise ValueError("Unsupported issue type")
