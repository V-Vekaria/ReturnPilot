import json
import sqlite3
from contextlib import contextmanager
from datetime import date, datetime, timedelta, timezone

from .config import DATABASE_PATH


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


@contextmanager
def connection():
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(DATABASE_PATH)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA foreign_keys=ON")
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def initialize():
    with connection() as db:
        db.executescript("""
        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY, customer_id TEXT NOT NULL, item TEXT NOT NULL,
          amount_pence INTEGER NOT NULL CHECK(amount_pence > 0),
          delivery_status TEXT NOT NULL, delivered_at TEXT, purchased_at TEXT NOT NULL,
          proof_of_delivery TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS cases (
          id TEXT PRIMARY KEY, order_id TEXT NOT NULL REFERENCES orders(id),
          customer_id TEXT NOT NULL, issue_type TEXT NOT NULL, description TEXT NOT NULL,
          recommendation TEXT NOT NULL, proposed_amount_pence INTEGER NOT NULL,
          policy_reason TEXT NOT NULL, investigation TEXT NOT NULL,
          status TEXT NOT NULL, created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS audit_events (
          id INTEGER PRIMARY KEY AUTOINCREMENT, case_id TEXT NOT NULL REFERENCES cases(id),
          event_type TEXT NOT NULL, actor TEXT NOT NULL, details TEXT NOT NULL,
          created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS simulated_refunds (
          case_id TEXT PRIMARY KEY REFERENCES cases(id), order_id TEXT NOT NULL,
          amount_pence INTEGER NOT NULL, created_at TEXT NOT NULL
        );
        """)
        if db.execute("SELECT COUNT(*) FROM orders").fetchone()[0] == 0:
            today = date.today()
            sample = [
                ("RP-1001", "demo-customer", "Wireless headphones", 4900, "delivered", (today-timedelta(days=2)).isoformat(), (today-timedelta(days=5)).isoformat(), "recipient_signed"),
                ("RP-1002", "demo-customer", "Desk lamp", 7900, "delivered", (today-timedelta(days=1)).isoformat(), (today-timedelta(days=4)).isoformat(), "scan_only"),
                ("RP-1003", "demo-customer", "Canvas tote", 2400, "delivered", (today-timedelta(days=3)).isoformat(), (today-timedelta(days=6)).isoformat(), "recipient_signed"),
            ]
            db.executemany("INSERT INTO orders VALUES (?,?,?,?,?,?,?,?)", sample)


def row_dict(row):
    return dict(row) if row is not None else None


def audit(db, case_id: str, event_type: str, actor: str, details: dict):
    db.execute(
        "INSERT INTO audit_events(case_id,event_type,actor,details,created_at) VALUES (?,?,?,?,?)",
        (case_id, event_type, actor, json.dumps(details), now()),
    )
