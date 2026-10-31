from datetime import date

from backend.app import config

POLICY_VERSION = "1"
RETURN_WINDOW_DAYS = 14  # fictional demo window, not a legal entitlement


def evaluate(order: dict, issue_type: str) -> dict:
    """Pure function. Returns rule_id, recommendation (refund|investigate), eligible, reason."""
    try:
        days = (date.fromisoformat(config.DEMO_TODAY) - date.fromisoformat(order["delivered_at"])).days
    except (TypeError, ValueError, KeyError):
        days = None
    if issue_type == "damaged_item":
        if days is None or order.get("delivery_status") != "delivered":
            return _r("DEMO-DAMAGE-01", "investigate", False, "Delivery date unknown; needs staff review.")
        return _r("DEMO-DAMAGE-01", "refund", True,
                  f"Damage reported {days} day(s) after delivery. Evidence is unconfirmed; "
                  "staff must confirm the defect before approving.")
    if issue_type == "disputed_delivery":
        if order.get("proof_of_delivery") != "recipient_signed":
            return _r("DEMO-DELIVERY-01", "investigate", False,
                      "Carrier scan says delivered but there is no recipient proof; claim and tracking conflict.")
        return _r("DEMO-DELIVERY-01", "investigate", False,
                  "Recipient proof exists and conflicts with the claim; needs staff review.")
    if issue_type == "change_of_mind":
        if days is None:
            return _r("DEMO-RETURN-01", "investigate", False, "Delivery date unknown; needs staff review.")
        if days <= RETURN_WINDOW_DAYS:
            return _r("DEMO-RETURN-01", "investigate", True,
                      f"Within the {RETURN_WINDOW_DAYS}-day sample window ({days} days); "
                      "item condition unconfirmed, so no immediate refund.")
        return _r("DEMO-RETURN-01", "investigate", False,
                  f"Outside the {RETURN_WINDOW_DAYS}-day sample window ({days} days).")
    raise ValueError("unsupported issue type")


def _r(rule_id, recommendation, eligible, reason):
    return {"rule_id": rule_id, "recommendation": recommendation, "eligible": eligible, "reason": reason}
