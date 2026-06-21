# Installation Guide

## Prerequisites

- Python 3.10+
- Node.js 18+
- A Supabase project (you already have one — see your project URL)
- A free Groq API key

## Backend installation

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Environment variables

Copy `backend/.env.example` to `backend/.env` and fill in every value. Required vs optional:

| Variable | Required? | Notes |
|---|---|---|
| `SUPABASE_URL` | Yes | Project Settings → API |
| `SUPABASE_SERVICE_KEY` | Yes | Use service_role, never expose to frontend |
| `JWT_SECRET_KEY` | Yes | Generate with `secrets.token_hex(32)` |
| `GROQ_API_KEY` | Yes (for AI features) | Free tier at console.groq.com |
| `GITHUB_TOKEN` | Optional | Without it, GitHub API limits to 60 requests/hour |
| `SENDER_EMAIL` / `SENDER_PASSWORD` | Optional | Needed only for email alerts; use a Gmail App Password |

### Database schema

Run `database/schema.sql` in the Supabase SQL Editor before starting the backend. This creates all 6 tables (users, repositories, jobs, alerts, saved_projects, searches) plus indexes and Row Level Security policies.

### Running the backend

```bash
python main.py
```

Or with auto-reload during development:

```bash
uvicorn main:app --reload --port 8000
```

Verify it's working: `curl http://localhost:8000/health` should return `{"status":"healthy"}`.

## Frontend installation

```bash
cd frontend
npm install
cp .env.example .env
```

Edit `.env` if your backend runs on a different host/port than `http://localhost:8000`.

```bash
npm run dev
```

Visit `http://localhost:5173`.

## Verifying the full setup

1. Register a new account from the frontend.
2. Visit **Repositories** — it should show GitHub results within a few seconds (first load triggers a live fetch + AI analysis, cached afterward).
3. Visit **Jobs** — same behavior, pulling from RemoteOK/Arbeitnow.
4. Create an **Alert** — confirm it appears in the list.
5. Save a repository from the Repositories page, then check it shows up on **Profile**.

If repositories/jobs stay empty, check the backend terminal for `GitHub API error` or `RemoteOK fetch error` messages — usually a rate limit or network issue, not a code bug.
