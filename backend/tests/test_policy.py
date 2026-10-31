import pytest

from backend.app.db import SEED
from backend.app.policy import evaluate

ORDERS = {row[0]: dict(zip(("id", "item", "amount_pence", "delivery_status", "proof_of_delivery", "delivered_at"), row))
          for row in SEED}


def test_damaged_item_recommends_refund():
    assert evaluate(ORDERS["NT-1042"], "damaged_item")["recommendation"] == "refund"


def test_disputed_delivery_without_proof_recommends_investigate():
    result = evaluate(ORDERS["NT-1050"], "disputed_delivery")
    assert result["recommendation"] == "investigate"
    assert result["rule_id"] == "DEMO-DELIVERY-01"


def test_change_of_mind_within_window_recommends_investigate():
    result = evaluate(ORDERS["NT-1060"], "change_of_mind")
    assert result["recommendation"] == "investigate"
    assert result["eligible"] is True


def test_unknown_delivery_date_needs_review():
    order = {**ORDERS["NT-1042"], "delivered_at": None}
    assert evaluate(order, "damaged_item")["recommendation"] == "investigate"


def test_unknown_issue_type_raises():
    with pytest.raises(ValueError):
        evaluate(ORDERS["NT-1042"], "something_else")
