# Data models

`orders`: fictional order ID, customer ID, item, paid amount in GBP pennies, delivery status, delivery date, purchase date, and proof-of-delivery status.

`cases`: generated ID, order ID, customer ID, issue type, description, recommendation, proposed amount in pennies, policy reason, investigation text, status, timestamps.

`audit_events`: append-only ID, case ID, event type, actor, JSON details, timestamp. Events cover submission, investigation, approval or rejection, and simulated refund.

`simulated_refunds`: unique case ID, order ID, amount in pennies, timestamp. This table is a local ledger only; it does not connect to a payment provider.

All money is stored as integer pennies. The backend derives customer ID from the demo bearer token, never from submitted JSON. Sample policy version `demo-v1` is a fictional merchant rule, not a determination of legal rights.
