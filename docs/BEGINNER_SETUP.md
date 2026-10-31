# Beginner setup guide

A step-by-step guide to running ReturnPilot on your own computer, written for people who don't code much. For the short technical version, see [DEVELOPMENT_SETUP.md](DEVELOPMENT_SETUP.md).

ReturnPilot is a demo (prototype) with two parts that run at the same time:

- **Backend**: the "engine" (Python). It stores sample orders and decides what to recommend.
- **Frontend**: the website you click around in (Next.js). It talks to the backend.

Everything runs locally on your computer. No real payments or customers are involved, and the default mode needs no account or API key.

## 1. Install the tools (one time)

| Tool | Version | Check it's installed | Download |
|------|---------|----------------------|----------|
| Git | any | `git --version` | <https://git-scm.com/downloads> |
| Python | 3.11 or newer | `python3 --version` | <https://www.python.org/downloads/> |
| Node.js | 20 or newer | `node --version` | <https://nodejs.org/> |

**Opening a terminal:** on a Mac press `Cmd + Space`, type `Terminal`, press Enter. On Windows press the Windows key, type `PowerShell`, press Enter.

## 2. Get the project (one time)

```bash
git clone <REPOSITORY_URL> ReturnPilot
cd ReturnPilot
```

Replace `<REPOSITORY_URL>` with the repository address. Skip this if you already have the folder; just `cd` into it.

## 3. Set up the backend (one time)

Run these from the `ReturnPilot` folder.

**a. Create your settings file**

```bash
cp .env.example .env
```

(Windows PowerShell: `copy .env.example .env`.) You can leave everything as it is. `GOOGLE_API_KEY` is only needed for the optional live-AI mode (see the end of this guide). Never share or commit your `.env` file.

**b. Create a private Python environment and install packages**

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

On Windows PowerShell, use `.venv\Scripts\Activate.ps1` instead of the `source` line. When the environment is on, `(.venv)` shows at the start of your terminal line.

## 4. Set up the frontend (one time)

```bash
cd frontend
npm install
cd ..
```

## 5. Run the demo

You need **two terminal windows** open at once.

**Terminal 1: backend** (from the `ReturnPilot` folder):

```bash
source .venv/bin/activate        # Windows: .venv\Scripts\Activate.ps1
uvicorn backend.app.main:app --reload --port 8000
```

Leave it running. The first start creates a local database with fictional sample orders.

**Terminal 2: frontend:**

```bash
cd ReturnPilot/frontend
npm run dev
```

Now open <http://localhost:3000> in your browser.

To stop either one, click its terminal and press `Ctrl + C`.

## 6. Try it out

- Use sample order IDs `RP-1001`, `RP-1002` and `RP-1003` when submitting a complaint as a customer.
- The retailer dashboard is at <http://localhost:3000/retailer>. A retailer must approve any refund. Refunds are only **simulated**.
- More demo walk-throughs are in [DEMO_SCENARIOS.md](DEMO_SCENARIOS.md).

## Optional: live AI mode

By default the app uses a built-in deterministic mode. To use Google's Gemini agents instead:

1. Get a key at <https://aistudio.google.com/apikey>.
2. In `.env`, set `GOOGLE_API_KEY=your-key` and `INVESTIGATION_MODE=adk`.
3. Restart the backend (Terminal 1).

## Checking that everything works

```bash
source .venv/bin/activate
python -m pytest backend/tests
```

All tests should pass.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `command not found: python3` / `node` / `git` | Install it (step 1), then open a new terminal. On Windows try `python` instead of `python3`. |
| `command not found: uvicorn` or `No module named ...` | The Python environment isn't on. Run the `source .venv/bin/activate` line again, then `pip install -r backend/requirements.txt`. |
| `Address already in use` | Something else is using port 8000 (or 3000). Close the other program, or stop an old copy of the app with `Ctrl + C`. |
| Website loads but shows errors or no data | Check that the backend (Terminal 1) is still running. |
| Changed `.env` but nothing changed | Stop the backend with `Ctrl + C` and start it again. |
