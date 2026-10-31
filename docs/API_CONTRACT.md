# API contract

Base URL: `http://localhost:8000`. JSON responses. Demo credentials use `Authorization: Bearer <token>`.

| Method | Path | Role | Purpose |
|---|---|---|---|
| GET | `/health` | public | Service health and investigation mode |
| GET | `/api/orders` | customer | List sample orders for the demo customer |
| POST | `/api/cases` | customer | Submit `order_id`, `issue_type`, `description` |
| GET | `/api/cases/{id}` | customer or retailer | Read own case or retailer case |
| GET | `/api/cases` | retailer | List all cases |
| POST | `/api/cases/{id}/approve` | retailer | Approve proposed outcome and optionally simulate refund |
| GET | `/api/cases/{id}/audit` | retailer | Read audit history |

Issue types: `damaged_item`, `disputed_delivery`, `change_of_mind`. Approval request: `{ "decision": "approve" | "reject", "note": "..." }`. A refund is recorded only for an approved `refund` recommendation. Repeated approval cannot create a second refund. Errors use standard HTTP status codes and `detail`.
