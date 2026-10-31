# Demo scenarios

All orders belong to the fictional demo customer. These outcomes come from sample merchant policy `demo-v1`; staff should not interpret them as legal decisions.

| Scenario | Order | Input | Expected recommendation |
|---|---|---|---|
| Damaged item | `RP-1001` | `damaged_item`, describe cracked headphones | Refund £49.00, pending retailer approval |
| Disputed delivery | `RP-1002` | `disputed_delivery`, say parcel is missing | Investigate: delivery scan has no recipient proof; no refund proposed |
| Change of mind | `RP-1003` | `change_of_mind`, request return | Return for review; no immediate refund |

For the full vertical slice, submit the damaged-item case, inspect its evidence and policy explanation, approve as retailer, then inspect the audit timeline and simulated refund. Repeat approval to show duplicate execution is blocked. Try a customer token on retailer endpoints to show the backend rejects it.
