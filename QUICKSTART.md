# Quickstart

## 1. Supabase setup (5 min)

1. Go to [supabase.com](https://supabase.com) → your project (you already have one).
2. Open **SQL Editor** → **New query**.
3. Paste the entire contents of `database/schema.sql` and run it.
4. Go to **Settings → API**. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role key** (NOT the anon key) → `SUPABASE_SERVICE_KEY`

## 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `.env`:
- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` → from step 1
- `GROQ_API_KEY` → get a free key at [console.groq.com](https://console.groq.com/keys)
- `JWT_SECRET_KEY` → run `python -c "import secrets; print(secrets.token_hex(32))"` and paste the result
- `GITHUB_TOKEN` (optional, raises GitHub API rate limit from 60/hr to 5000/hr) → [github.com/settings/tokens](https://github.com/settings/tokens)
- `SENDER_EMAIL` / `SENDER_PASSWORD` (optional, for email alerts) → use a Gmail [App Password](https://myaccount.google.com/apppasswords), not your real password

Run it:

```bash
python main.py
```

Backend is now live at `http://localhost:8000`. Visit `http://localhost:8000/docs` for interactive API docs.

## 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend is now live at `http://localhost:5173`.

## 4. Create an admin account

Register a normal account through the UI, then in Supabase **Table Editor → users**, change that row's `role` from `user` to `admin`. Log out and back in — the Admin link will appear in the sidebar.
