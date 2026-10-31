# ReturnPilot

ReturnPilot is a hackathon prototype for evidence-driven e-commerce complaint resolution. A customer submits a complaint; the backend reads a sample order, applies deterministic merchant policy, and records a reviewable recommendation. A retailer must approve any financial action before the backend records a **simulated** refund.

## Status

Implemented: sample SQLite orders, complaints, deterministic policy decisions, audit events, retailer approval, simulated refunds, two Next.js views, and optional Google ADK/Gemini investigation with Order and Policy agents. The default `demo` mode is deterministic and runs without a Google key. Set `INVESTIGATION_MODE=adk` and `GOOGLE_API_KEY` for live agent investigation. In either mode, backend policy and authorization determine permitted actions; model text cannot authorize a refund.

Not implemented: real payments, Shopify integration, identity management, photo analysis, production tenancy, or legal advice. Sample orders and policies are fictional. Do not use this prototype for real customer decisions.

## Repository

- `frontend/` — Next.js customer portal and retailer dashboard
- `backend/` — FastAPI, Pydantic, SQLite, policy, audit and tests
- `agents/` — Google ADK agent definitions and runner
- `docs/` — architecture, agent design, API, data model, setup and demos

## Quick start

See [development setup](docs/DEVELOPMENT_SETUP.md). Use order IDs `RP-1001`, `RP-1002`, and `RP-1003` for the three demos. The customer demo token is `demo-customer-token`; retailer token is `demo-retailer-token`. These fixed tokens are solely for local demonstration and must be replaced before deployment.

## Verification

Run `python -m pytest backend/tests` and `npm run build` from `frontend`. The test suite checks policy, access, approvals, idempotency and the complete simulated-refund flow. Live Gemini calls require your own key and are not part of the offline test suite.
