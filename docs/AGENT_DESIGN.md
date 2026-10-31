# Agent design

The Google ADK `returnpilot_orchestrator` delegates factual order lookup to `order_agent` and policy lookup to `policy_agent`. Each specialist has one read-only Python tool backed by the same SQLite repository or deterministic policy service used by the API. The agents are instructed to report gaps, cite returned facts, and avoid claiming legal certainty. The orchestrator returns a short investigation narrative.

`INVESTIGATION_MODE=demo` uses a deterministic summary for a key-free demo. `INVESTIGATION_MODE=adk` invokes Gemini through ADK. Agent failure leaves the case unapproved and returns an error; it never triggers a refund. The policy decision and executable amount always come from backend code, independent of model text.
