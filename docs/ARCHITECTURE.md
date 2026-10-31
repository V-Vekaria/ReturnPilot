# Architecture

```text
Customer Portal -> FastAPI -> SQLite orders/cases/audit
                         |-> deterministic policy engine
                         |-> ADK orchestrator -> Order Agent (read order tool)
                         |                    -> Policy Agent (read policy tool)
Retailer Dashboard -> FastAPI approval endpoint -> simulated refund + audit
```

The backend creates a case from an authenticated demo customer's order. It loads order facts from SQLite and evaluates a versioned, deterministic sample policy. In `adk` mode, ADK agents read the same backend services through read-only tools and produce an investigation summary. The model output is advisory. The backend stores its own policy result and enforces retailer approval, amount bounds, and one refund per case before changing financial state.

The two Next.js pages call the FastAPI JSON API. SQLite is local and seeded only with the three documented fictional orders. CORS is limited to `FRONTEND_ORIGIN`. Demo tokens are fixed local credentials, so this architecture is not ready for public deployment.
