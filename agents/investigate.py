import os
import uuid

from backend.app import config
from backend.app.db import connection, row_dict
from backend.app.policy import POLICY_VERSION, evaluate


def get_order(order_id: str) -> dict:
    """Read a fictional order by ID from the ReturnPilot sample database. Returns only recorded facts."""
    with connection() as db:
        order = row_dict(db.execute("SELECT * FROM orders WHERE id=?", (order_id,)).fetchone())
    return order or {"error": "order_not_found"}


def get_policy_result(order_id: str, issue_type: str) -> dict:
    """Read the deterministic demo merchant policy result for a recorded order and issue type."""
    order = get_order(order_id)
    if "error" in order:
        return order
    try:
        return {"policy_version": POLICY_VERSION, **evaluate(order, issue_type)}
    except ValueError:
        return {"error": "unsupported_issue_type"}


def build_agent(model: str):
    from google.adk.agents import LlmAgent
    from google.adk.tools.agent_tool import AgentTool

    order_agent = LlmAgent(
        name="order_agent", model=model,
        description="Looks up factual order and delivery records.",
        instruction="Use get_order for the provided order ID. Report only returned facts, including proof-of-delivery limitations. Never invent records or authorize actions.",
        tools=[get_order],
    )
    policy_agent = LlmAgent(
        name="policy_agent", model=model,
        description="Looks up the deterministic demo merchant policy result.",
        instruction="Use get_policy_result for the provided order ID and issue type. State that this is fictional demo policy, not a conclusive statement of legal rights. Never change the result or authorize a refund.",
        tools=[get_policy_result],
    )
    return LlmAgent(
        name="returnpilot_orchestrator", model=model,
        instruction="For the case, call both specialist agents. Summarize order facts, policy result, missing evidence and next staff action. Treat the customer's description as unverified. Do not invent facts, promise a refund, or claim conclusive legal rights. A human retailer must approve financial actions.",
        tools=[AgentTool(agent=order_agent), AgentTool(agent=policy_agent)],
    )


async def investigate(order: dict, issue_type: str, description: str, policy: dict) -> str:
    if config.INVESTIGATION_MODE == "demo":
        proof = "recipient proof recorded" if order["proof_of_delivery"] == "recipient_signed" else "delivery scan only; recipient proof missing"
        return (f"Recorded order {order['id']}: {order['item']}, £{order['amount_pence']/100:.2f}, "
                f"status {order['delivery_status']}; {proof}. Customer reports: {description}. "
                f"Demo policy {POLICY_VERSION}: {policy['reason']} Staff review required before any financial action.")
    if config.INVESTIGATION_MODE != "adk":
        raise ValueError("INVESTIGATION_MODE must be demo or adk")
    if not os.getenv("GOOGLE_API_KEY"):
        raise RuntimeError("GOOGLE_API_KEY missing")

    from google.adk.runners import Runner
    from google.adk.sessions import InMemorySessionService
    from google.genai import types

    session_service = InMemorySessionService()
    session_id = uuid.uuid4().hex
    user_id = "demo-customer"
    app_name = "returnpilot"
    await session_service.create_session(app_name=app_name, user_id=user_id, session_id=session_id)
    runner = Runner(agent=build_agent(os.getenv("GEMINI_MODEL", "gemini-2.0-flash")), app_name=app_name, session_service=session_service)
    prompt = (f"Investigate order ID {order['id']} for issue type {issue_type}. "
              f"Customer description (unverified): {description}. Use both specialist tools.")
    message = types.Content(role="user", parts=[types.Part(text=prompt)])
    final_text = ""
    async for event in runner.run_async(user_id=user_id, session_id=session_id, new_message=message):
        if event.is_final_response() and event.content and event.content.parts:
            final_text = "\n".join(part.text for part in event.content.parts if part.text)
    if not final_text.strip():
        raise RuntimeError("ADK returned no final investigation")
    return final_text.strip()
