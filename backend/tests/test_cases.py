from backend.app.db import connection


def test_unknown_order_returns_404(client):
    response = client.post(
        "/api/cases",
        json={
            "order_id": "UNKNOWN",
            "issue_type": "damaged_item",
            "description": "The item arrived damaged.",
        },
    )

    assert response.status_code == 404


def test_short_description_returns_422(client):
    response = client.post(
        "/api/cases",
        json={
            "order_id": "NT-1042",
            "issue_type": "damaged_item",
            "description": "Too short",
        },
    )

    assert response.status_code == 422


def test_customer_case_response_omits_internal_fields(client):
    create_response = client.post(
        "/api/cases",
        json={
            "order_id": "NT-1042",
            "issue_type": "damaged_item",
            "description": "The headphones arrived with a broken ear cup.",
        },
    )
    assert create_response.status_code == 201

    case_id = create_response.json()["id"]
    response = client.get(f"/api/customer/cases/{case_id}")

    assert response.status_code == 200
    assert not {
        "investigation_summary",
        "recommendation",
        "policy_reason",
    }.intersection(response.json())


def test_approval_uses_proposed_amount_and_rejects_repeat(client):
    create_response = client.post(
        "/api/cases",
        json={
            "order_id": "NT-1042",
            "issue_type": "damaged_item",
            "description": "The headphones arrived with a broken ear cup.",
        },
    )
    case_id = create_response.json()["id"]
    with connection() as db:
        db.execute(
            """UPDATE cases
               SET status='awaiting_review', recommendation='refund',
                   proposed_amount_pence=14900
               WHERE id=?""",
            (case_id,),
        )

    body = {"decision": "approve", "note": "Approve the stored refund proposal."}
    response = client.post(f"/api/cases/{case_id}/decision", json=body)

    assert response.status_code == 200
    assert response.json()["status"] == "resolved"
    assert client.post(f"/api/cases/{case_id}/decision", json=body).status_code == 409
    with connection() as db:
        resolution = db.execute(
            "SELECT amount_pence FROM resolutions WHERE case_id=?", (case_id,)
        ).fetchone()
    assert resolution["amount_pence"] == 14900