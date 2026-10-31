import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

ROOT = Path(__file__).resolve().parents[2]
DATABASE_PATH = Path(os.getenv("DATABASE_PATH", str(ROOT / "backend" / "returnpilot.db")))
if not DATABASE_PATH.is_absolute():
    DATABASE_PATH = ROOT / DATABASE_PATH
INVESTIGATION_MODE = os.getenv("INVESTIGATION_MODE", "demo")
CUSTOMER_TOKEN = os.getenv("CUSTOMER_TOKEN", "demo-customer-token")
RETAILER_TOKEN = os.getenv("RETAILER_TOKEN", "demo-retailer-token")
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
