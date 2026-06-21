# Deployment Guide

## Database — Supabase

Already hosted; nothing to deploy. Just ensure `schema.sql` has been run on your production project (the same project you're already using is fine for a final-year project).

## Backend — Render

1. Push the `backend/` folder to a GitHub repo (or push the whole project and set Render's root directory to `backend`).
2. On [render.com](https://render.com): **New → Web Service** → connect your repo.
3. Settings:
   - **Root directory**: `backend`
   - **Build command**: `pip install -r requirements.txt`
   - **Start command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add all variables from `.env.example` under **Environment** (real values, not placeholders). Set `FRONTEND_URL` to your deployed Vercel URL once you have it (step below) so CORS allows it.
5. Deploy. Note the resulting URL, e.g. `https://devfinder-api.onrender.com`.

Render's free tier spins down after inactivity — the first request after idling takes ~30–50 seconds to wake up. This is expected, not a bug.

## Backend — Railway (alternative)

1. [railway.app](https://railway.app) → **New Project → Deploy from GitHub repo**.
2. Set root directory to `backend`.
3. Add the same environment variables.
4. Railway auto-detects the start command from `Procfile` if you add one:
   ```
   web: uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

## Frontend — Vercel

1. Push `frontend/` to GitHub (or set Vercel's root directory to `frontend`).
2. [vercel.com](https://vercel.com) → **New Project** → import the repo.
3. Framework preset: **Vite**.
4. Environment variable: `VITE_API_URL` = your backend URL from above (e.g. `https://devfinder-api.onrender.com`).
5. Deploy.

## Frontend — Netlify (alternative)

1. **New site from Git** → select repo, base directory `frontend`.
2. Build command: `npm run build`. Publish directory: `dist`.
3. Add `VITE_API_URL` under **Site settings → Environment variables**.

## Post-deploy checklist

- [ ] Update backend `FRONTEND_URL` env var to the live Vercel/Netlify URL (fixes CORS).
- [ ] Confirm `/health` responds on the live backend URL.
- [ ] Register a test account on the live frontend and confirm login works end-to-end.
- [ ] Rotate any API keys that were ever committed to a public repo or shared zip file.
