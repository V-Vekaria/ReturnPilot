import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from backend.app import config
SCHEMA = """
    CREATE TABLE IF NOT EXISTS orders(id TEXT PRIMARY KEY, item TEXT, amount_pence
    INTEGER,
    delivery_status TEXT, proof_of_delivery TEXT, delivered_at TEXT);
    CREATE TABLE IF NOT EXISTS cases(id TEXT PRIMARY KEY, order_id TEXT REFERENCES
    orders(id),
    issue_type TEXT, description TEXT, status TEXT, recommendation TEXT,
    proposed_amount_pence INTEGER,
    investigation_summary TEXT, policy_reason TEXT, decision_note TEXT, created_at
    TEXT, updated_at TEXT);
    CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY AUTOINCREMENT, case_id
    TEXT, at TEXT,
    actor TEXT, type TEXT, message TEXT);
    CREATE TABLE IF NOT EXISTS resolutions(case_id TEXT PRIMARY KEY, amount_pence
    INTEGER, ref TEXT, created_at TEXT);
"""
SEED = [
("NT-1042", "Wireless headphones", 14900, "delivered", "scan_only",
"2026-10-29"),
("NT-1050", "Parcel (electronics)", 25000, "delivered", "scan_only",
"2026-10-28"),
("NT-1060", "Jacket", 6500, "delivered", "recipient_signed", "2026-10-26"),
]
def now(): return datetime.now(timezone.utc).isoformat()
@contextmanager
def connection():
    conn = sqlite3.connect(config.DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
def row_dict(row): return dict(row) if row else None
def log_event(conn, case_id, actor, type_, message):
    conn.execute("INSERT INTO events(case_id, at, actor, type, message) VALUES(?,?,?,?,?)", (case_id, now(), actor, type_, message))
def init_db(reset=False):
    with connection() as c:
        if reset:
            for t in ("resolutions", "events", "cases", "orders"):
                c.execute(f"DROP TABLE IF EXISTS {t}")
        c.executescript(SCHEMA)
        if not c.execute("SELECT 1 FROM orders").fetchone():
            c.executemany("INSERT INTO orders VALUES(?,?,?,?,?,?)", SEED)