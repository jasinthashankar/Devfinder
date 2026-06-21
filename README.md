# DevFinder

AI-powered developer opportunity discovery platform. Find open-source repositories, remote jobs, and internships in one dashboard — with AI-generated summaries, skill-based recommendations, and GitHub OAuth login.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), Tailwind CSS v4, React Router, Axios |
| Backend | FastAPI (Python) |
| Database | Supabase (PostgreSQL) — auth & alerts only |
| AI | Groq API (Llama 3.1) |
| Auth | JWT + bcrypt + GitHub OAuth |
| Email | Resend API |
| Jobs | RemoteOK + Arbeitnow + Adzuna |

## Features

- 🔍 Live repository search from GitHub API (no DB cache)
- 💼 Live job & internship listings from 3 sources with smart keyword search
- 🤖 AI-powered recommendations ranked by your skills (Groq)
- 🔐 Email + GitHub OAuth login
- 🔔 Email alerts via Resend when new repos match your criteria
- 🌓 Light / Dark theme toggle
- 📱 Fully responsive

## Project structure
devfinder/

├── backend/

│   ├── api/              # route handlers (auth, repos, jobs, misc)

│   ├── auth/             # JWT + password hashing

│   ├── database/         # Supabase client + DatabaseManager

│   ├── models/           # Pydantic schemas

│   ├── scheduler/        # background alert jobs (every 12 hours)

│   ├── services/         # GitHub, Groq, job, email integrations

│   ├── utils/            # config loader + text filter

│   └── main.py

├── frontend/

│   └── src/

│       ├── components/   # RepoCard, JobCard, AppLayout, etc.

│       ├── context/      # Auth, Toast, Theme providers

│       ├── hooks/        # custom hooks

│       ├── pages/        # one file per route

│       ├── services/     # API client wrappers

│       └── utils/        # text utilities

└── database/

└── schema.sql        # run in Supabase SQL Editor first

## Environment variables

### Backend (`backend/.env`)
SUPABASE_URL=

SUPABASE_SERVICE_KEY=

JWT_SECRET_KEY=

GROQ_API_KEY=

GITHUB_TOKEN=

GITHUB_CLIENT_ID=

GITHUB_CLIENT_SECRET=

RESEND_API_KEY=

RESEND_FROM_EMAIL=

ADZUNA_APP_ID=

ADZUNA_APP_KEY=

### Frontend (`frontend/.env`)
VITE_API_URL=http://localhost:8000

VITE_GITHUB_CLIENT_ID=

## Quick start

```bash
# Backend
cd backend
pip install -r requirements.txt
python main.py

# Frontend
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`

## Security

Never commit `.env` files. Both `backend/.env` and `frontend/.env` are listed in `.gitignore` and will never be pushed to GitHub.

## Deployment

- Backend → Render (set env vars in dashboard)
- Frontend → Vercel (set env vars in dashboard)
- Update GitHub OAuth callback URL to your production domain