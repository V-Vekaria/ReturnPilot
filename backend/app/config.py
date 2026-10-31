import os
INVESTIGATION_MODE = os.getenv("INVESTIGATION_MODE", "demo")
DATABASE_PATH = os.getenv("DATABASE_PATH", "returnpilot.db")
DEMO_TODAY = "2026-10-31"
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")