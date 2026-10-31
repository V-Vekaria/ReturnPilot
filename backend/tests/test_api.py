import pytest
from fastapi.testclient import TestClient

from backend.app import db
from backend.app.main import app

C = {"Authorization": "Bearer demo-customer-token"}
R = {"Authorization": "Bearer demo-retailer-token"}


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(db, "DATABASE_PATH", tmp_path / "test.db")
    with TestClient(app) as test_client:
        yield test_client


def submit(client, order_id, issue_type):
    return client.post("/api/cases", headers=C, json={"order_id": order_id, "issue_type": issue_type, "description": "The product or delivery has a problem."})


def test_damaged_item_complete_flow(client):
    response = submit(client, "RP-1001", "damaged_item")
    assert response.status_code == 201
    case = response.json()
    assert case["recommendation"] == "refund"
    assert case["proposed_amount_pence"] == 4900
    case_id = case["id"]
    assert client.post(f"/api/cases/{case_id}/approve", headers=C, json={"decision": "approve"}).status_code == 403
    approved = client.post(f"/api/cases/{case_id}/approve", headers=R, json={"decision": "approve", "note": "Demo review complete"})
    assert approved.status_code == 200
    assert approved.json()["status"] == "approved"
    assert client.post(f"/api/cases/{case_id}/approve", headers=R, json={"decision": "approve"}).status_code == 409
    audit = client.get(f"/api/cases/{case_id}/audit", headers=R).json()
    assert [item["event_type"] for item in audit] == ["complaint_submitted", "investigation_completed", "recommendation_approved", "simulated_refund_recorded"]
    with db.connection() as conn:
        assert conn.execute("SELECT COUNT(*) FROM simulated_refunds WHERE case_id=?", (case_id,)).fetchone()[0] == 1


def test_disputed_delivery_never_refunds(client):
    case = submit(client, "RP-1002", "disputed_delivery").json()
    assert case["recommendation"] == "investigate"
    assert case["proposed_amount_pence"] == 0
    assert "recipient proof missing" in case["investigation"]
    client.post(f"/api/cases/{case['id']}/approve", headers=R, json={"decision": "approve"})
    with db.connection() as conn:
        assert conn.execute("SELECT COUNT(*) FROM simulated_refunds").fetchone()[0] == 0


def test_change_of_mind_and_invalid_order(client):
    case = submit(client, "RP-1003", "change_of_mind").json()
    assert case["recommendation"] == "return_for_review"
    assert case["proposed_amount_pence"] == 0
    assert submit(client, "RP-9999", "damaged_item").status_code == 404


def test_access_and_rejection(client):
    assert client.get("/api/orders").status_code == 401
    assert client.get("/api/cases", headers=C).status_code == 403
    case = submit(client, "RP-1001", "damaged_item").json()
    result = client.post(f"/api/cases/{case['id']}/approve", headers=R, json={"decision": "reject"})
    assert result.json()["status"] == "rejected"
    with db.connection() as conn:
        assert conn.execute("SELECT COUNT(*) FROM simulated_refunds").fetchone()[0] == 0
