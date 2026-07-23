# Deploying Lead Hunter (free stack)

Backend: Render (free web service) + Neon (free Postgres).
Frontend: Cloudflare Pages (free static hosting).
Total cost: $0/month. No credit card required anywhere in this stack.

Trade-off you're accepting: Render's free tier spins the backend down after
~15 minutes of no traffic. The first request after that takes ~30-60s to
wake it back up; after that it's normal speed until it idles out again. For
a solo prospecting tool you check a few times a day, this is a non-issue —
if it ever bothers you, Render's paid tier ($7/mo) removes it, no code
changes needed.

This is a two-pass setup: the backend needs to exist before you know its
URL (for the frontend's `VITE_API_BASE`), and the frontend needs to exist
before you know its URL (for the backend's `CORS_ORIGINS`). Do it in the
order below and you only loop back once.

---

## 0. Push this repo to GitHub

Render and Cloudflare Pages both deploy by watching a GitHub repo — every
`git push` triggers a new deploy on both sides automatically.

1. Create a new **empty** repo on GitHub (no README/license — this repo
   already has commits).
2. From the `lead-hunter/` folder:
   ```bash
   git remote add origin https://github.com/<your-username>/lead-hunter.git
   git branch -M main
   git push -u origin main
   ```

---

## 1. Create the Neon Postgres database

1. Go to [neon.tech](https://neon.tech) → sign up (no card needed) → "New
   Project". Name it `lead-hunter`, pick a region close to you (e.g.
   São Paulo/`sa-east-1` if available, otherwise US East is fine).
2. On the project dashboard, copy the **connection string** — it looks like
   `postgresql://user:password@ep-xxxx.region.aws.neon.tech/dbname?sslmode=require`.
   Keep this tab open, you need it in the next step.

---

## 2. Deploy the backend to Render

1. Go to [render.com](https://render.com) → sign up (no card needed) →
   "New +" → "Blueprint".
2. Connect your GitHub account and select the `lead-hunter` repo. Render
   will find `render.yaml` at the repo root automatically and show you the
   `lead-hunter-backend` service it defines.
3. Before clicking deploy, it'll prompt you for the two env vars marked
   `sync: false` in the blueprint:
   - `DATABASE_URL` → paste the Neon connection string from step 1.
   - `CORS_ORIGINS` → leave as `http://localhost:5173` for now (a temporary
     placeholder — you'll update it in step 4 once the frontend exists).
4. Click "Apply" / "Deploy Blueprint". First build takes a few minutes.
5. Once it's live, copy the service URL Render gives you — something like
   `https://lead-hunter-backend.onrender.com`. Test it:
   ```bash
   curl https://lead-hunter-backend.onrender.com/api/v1/leads
   ```
   Should return `[]` (empty list — fresh database, nothing imported yet).
   The Postgres tables are created automatically on first startup (same
   `create_db_tables()` that ran locally against SQLite).

---

## 3. Deploy the frontend to Cloudflare Pages

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → "Workers &
   Pages" → "Create" → "Pages" → "Connect to Git".
2. Select the `lead-hunter` repo. Configure the build:
   - **Root directory:** `frontend`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
3. Before the first deploy, add an environment variable:
   - `VITE_API_BASE` = `https://lead-hunter-backend.onrender.com/api/v1`
     (your actual Render URL from step 2, with `/api/v1` appended — this
     gets baked into the static JS bundle at build time, confirmed working
     in testing before this guide was written).
4. Deploy. You'll get a URL like `https://lead-hunter.pages.dev`.

---

## 4. Close the loop: point the backend's CORS at the real frontend URL

1. Back in the Render dashboard → your service → "Environment".
2. Update `CORS_ORIGINS` to your actual Cloudflare Pages URL:
   `https://lead-hunter.pages.dev` (no trailing slash, comma-separate if
   you also want a custom domain later, e.g.
   `https://lead-hunter.pages.dev,https://leads.yourdomain.com`).
3. Save — Render redeploys automatically with the new env var.

---

## 5. Verify end to end

1. Open the Cloudflare Pages URL in a browser.
2. It should load (give it 30-60s on the very first load if the Render
   backend was idle — that's the free-tier cold start, not a bug).
3. Try "Importar do OpenStreetMap" for a real location — confirms
   frontend → Render → Overpass → Neon Postgres → back to frontend all
   work end to end.
4. Open browser dev tools → Network tab → confirm requests go to your
   `onrender.com` URL, not `localhost`.

---

## Ongoing workflow

Every `git push` to `main` redeploys both sides automatically — no manual
steps after this initial setup. Local development is unaffected: without
`DATABASE_URL` set, `backend/app/database.py` still falls back to a local
SQLite file, so `start-clean.bat` keeps working exactly as before for dev.

## If you outgrow the free tier

See `ROADMAP.md` Phase 2/6 — the main triggers are: cold starts becoming
annoying (→ Render paid tier, ~$7/mo, zero code changes), or needing more
than Neon's 0.5GB free storage (unlikely at lead-gen scale; Neon's paid
tier is usage-based if you ever get there).
