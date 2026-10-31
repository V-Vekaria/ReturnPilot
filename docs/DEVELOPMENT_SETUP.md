# Development setup

Requires Python 3.11+ and Node.js 20+.

1. Copy `.env.example` to `.env`. Do not commit `.env`. Set `GOOGLE_API_KEY` only if using live ADK mode.
2. At repository root, create a virtual environment: `python -m venv .venv`; activate it and run `pip install -r backend/requirements.txt`.
3. Run `uvicorn backend.app.main:app --reload --port 8000` from repository root. The local SQLite file is created and fictional orders are seeded on first start.
4. In another terminal, run `npm install` then `npm run dev` from `frontend/`. Open `http://localhost:3000`.
5. For live Gemini investigation, set `INVESTIGATION_MODE=adk` and `GOOGLE_API_KEY` in the backend environment and restart it. The default offline demo mode needs no external service.
6. Run `python -m pytest backend/tests` and `npm run build` for verification.

Use only local demo tokens from `.env.example`. This prototype has no real authentication or payment integration.
