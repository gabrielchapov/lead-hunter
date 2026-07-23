# Lead Hunter — MVP → Production Roadmap

Snapshot date: 2026-07-23. This replaces `OVERPASS_IMPLEMENTATION_PLAN.md` (that
plan is done — Overpass import works) as the project's forward-looking plan.

## Where things actually stand

The core loop works: search a location → pull real businesses from
OpenStreetMap via Overpass → score/filter/kanban them → draft a WhatsApp
message. As of this session:

- All fictional/hardcoded lead data is gone (`seed.py` deleted, no
  auto-seeding on startup, the demo database was wiped).
- The "Enriquecer" button no longer fabricates fake phone numbers/emails for
  real businesses — it previously did this silently, which is worse than
  hardcoded demo data because it injected fake contact info into *real*
  records. It now only surfaces real OSM contact data, or tells you honestly
  that no provider is configured.
- The Overpass import had two real bugs (invalid query syntax, missing
  User-Agent causing 406s) — both fixed and confirmed against valid Overpass
  QL. Frontend/backend geocoding are now consistent (both know Itapoá; one
  didn't before, so the map silently re-centered on Porto Alegre).
- `.env` is now actually read (`CORS_ORIGINS`) — previously it sat there
  unused while CORS was hardcoded to `allow_origins=["*"]`.
- Dead code removed: `backend_old/`, stray root `package.json`/`config.json`/
  `data/` (superseded duplicates of `whatsapp-audit/`), old `.jsx` files, the
  duplicate `vite.config.js`/`tailwind.config.js`/`postcss.config.js` that
  were shadowing the real TS config.

None of that makes this deployable yet. It's a solid local dev tool. Below is
what separates that from something you can point a browser at from anywhere
and trust with real prospecting data.

## Phase 0 — Foundational hygiene (do this first, it's cheap)

1. **Git repo scoped to this project.** Right now the only `.git` nearby is
   at `Desktop/Projects/` (the parent folder, shared with unrelated projects,
   zero commits). Every sibling project (`bun-ai-api`, `karen-bot`, etc.) has
   its own repo; this one doesn't. Initialize one inside `lead-hunter/`,
   commit now as a baseline, then commit after every working change. This
   session alone fixed four separate bugs that would've been one `git bisect`
   away from instant diagnosis if there'd been commit history.
2. **`.gitignore` for the backend.** `prospects.db`, `__pycache__/`,
   `*.egg-info/` aren't ignored yet — add backend entries alongside the
   existing frontend ones.
3. A short `CONTRIBUTING.md` or top-of-README "how this is organized" isn't
   needed solo, skip it — but do keep `ROADMAP.md` (this file) updated as
   you knock items off, so future-you doesn't re-discover the same gaps.

## Phase 1 — Data reliability

The Overpass integration is real but fragile in ways that will bite you the
first time you rely on it for actual client work:

1. **No retry/backoff.** A single Overpass timeout or 429 currently just
   fails the whole import. Overpass's public instance has informal rate
   limits (~1 req/sec, and it'll degrade under load). Add exponential backoff
   and a fallback to a second public mirror (`overpass.kumi.systems`,
   `overpass.openstreetmap.ru`) when the primary is down.
2. **No caching.** Re-searching the same location+radius re-hits Overpass
   from scratch every time. Cache by rounded bbox+category for e.g. 24h to
   cut redundant calls and speed up repeat searches.
3. **Geocoding is two disconnected static lookup tables** (one in
   `backend/app/scrapers.py`, one in `frontend/src/utils/geocode.ts`) that
   only know ~10 cities each. This is exactly the bug class that broke the
   Itapoá default this session — the two lists can drift out of sync again.
   Replace both with a single real geocoding call: either have the frontend
   call Nominatim directly (usage-policy compliant: max 1 req/sec, set a
   real `User-Agent`), or add a `GET /api/v1/geocode?q=` backend proxy so
   there's one source of truth and no CORS/rate-limit surprises in the
   browser.
4. **Dedup is name+city exact-match only.** OSM data has inconsistent
   naming (branch suffixes, punctuation, casing). Add fuzzy matching
   (`rapidfuzz` token-sort ratio, threshold ~90) before treating two records
   as the same business.
5. **`radius_km` degree conversion is a flat `/111`.** Fine near the equator
   distortion-wise for Brazil's latitudes, but note it explicitly — don't
   reuse this conversion if this ever expands to higher latitudes.

## Phase 2 — Deployment

Currently "deployed" means double-clicking `start-clean.bat`, which opens two
`cmd` windows running dev servers (`vite`, `uvicorn --reload`) on your own
machine. That's fine for building, not for "a tool I can deploy and use
normally" — it dies when you close the terminal, isn't reachable from your
phone, and has no restart-on-crash.

Given this is a solo tool (not a multi-tenant SaaS), the pragmatic path:

1. **Backend:** containerize with a small `Dockerfile` (`python:3.11-slim`,
   `pip install -e .`, `uvicorn app.main:app --host 0.0.0.0 --port 8000`, no
   `--reload` in prod). Deploy to a low/no-cost PaaS — Fly.io or Railway both
   have small free/cheap tiers and handle TLS, restarts, and logs for you
   with a `git push` deploy. A $5-6/mo VPS (Hetzner, DigitalOcean) with
   Docker Compose + Caddy (automatic HTTPS, ~10 lines of config) is the
   next step up if you outgrow PaaS limits or want the enrichment/WhatsApp
   pieces on a persistent machine.
2. **Frontend:** `npm run build` produces static files — deploy to Vercel,
   Netlify, or Cloudflare Pages (all free for this traffic level). Point
   `VITE_API_BASE` at your deployed backend URL via their env var UI.
3. **Database:** SQLite is a legitimate choice for a single-user tool at this
   scale (thousands of rows, one writer) — don't reach for Postgres just
   because it's "more production." The real gap is **backups**: right now a
   corrupted or lost `prospects.db` loses everything with no recovery path.
   Add a daily `sqlite3 prospects.db ".backup backup-$(date +%F).db"` cron
   (or your PaaS's volume snapshot feature) writing to a second location —
   cheap insurance. Revisit Postgres only if you add multiple simultaneous
   users or need concurrent writes.
4. Stop relying on `.bat` scripts as the deployment mechanism — keep them for
   local dev convenience, but production should start via the container's
   own entrypoint / the PaaS's process manager, not a Windows batch file.

## Phase 3 — Access control

Once this is reachable from the internet instead of `localhost`, the current
setup has no login and (until this session) had CORS wide open. This
session restricted CORS to your dev origins via `.env`, but that's not
authentication — anyone who discovers the URL can read/write your lead
database.

For a solo tool, you don't need full user accounts. Cheapest adequate
options, roughly in order of effort:
1. **Shared secret header** — a single `X-API-Key` checked by a FastAPI
   dependency, stored in an env var, sent by the frontend from a build-time
   env var. Effectively a password; ~20 lines of code.
2. **Basic Auth in front of everything** via the reverse proxy (Caddy/nginx),
   zero backend code changes.
3. Only reach for real auth (JWT, OAuth) if you ever add a second user or
   plan to resell this to other consultants.

## Phase 4 — Real enrichment + the WhatsApp audit tool

`POST /api/v1/leads/{id}/enrich` is currently honest about doing nothing
when OSM has no contact info (fixed this session), but "honest no-op" isn't
the end state — it's a placeholder for a real lookup:
1. Cheapest real option: Google Places API (Find Place + Place Details) —
   costs money per call but has much better phone/website coverage than OSM
   for Brazil. Gate it behind a budget cap (e.g. only enrich leads you've
   actually moved to "contatado" in the kanban, not the whole imported set).
2. Wire the existing `whatsapp-audit/` companion tool into the main flow
   instead of it being a fully separate manual step: add an "Auditar bot"
   action on a lead card that exports that one lead to the CSV shape
   `whatsapp-audit` expects and kicks it off, instead of hand-editing
   `data/leads.csv`.
3. Revisit the active-security-scanning idea (checking for exposed `.env`
   files, misconfigured auth, etc.) discussed earlier only as a
   **post-authorization** feature — i.e., it runs against a specific client
   after they've signed off on a security review, never as an unsolicited
   scan during prospecting. That's a distinct product surface from lead
   generation and deserves its own authorization-gated workflow rather than
   being bolted onto the Overpass importer.

## Phase 5 — Observability

1. Replace the `print()`/`[DEBUG]` statements added during this session's
   debugging with Python's `logging` module (levels, timestamps, and
   `logging.exception()` in the `except` blocks instead of manual
   `traceback.print_exc()`).
2. Ship logs somewhere you'll actually see them once this isn't running in a
   terminal in front of you — even just the PaaS's built-in log viewer
   (Fly.io/Railway both have one) is enough at this scale; don't over-invest
   in a dedicated log aggregator yet.
3. A basic uptime check (UptimeRobot free tier, ping `/` every 5 min) so you
   find out the backend died before a prospect does.

## Phase 6 — Only if you outgrow solo use

Skip unless/until it's actually needed:
- Multi-user accounts, if you bring on a VA or sell access to other
  consultants doing the same play in different cities.
- Postgres migration, if you need concurrent writers or outgrow SQLite's
  single-writer model.
- A queue (Celery/RQ) for enrichment/audit jobs, once those become slow
  enough to block the request-response cycle.

## Suggested order of attack

Given the goal is "a tool I can deploy and use normally" (not resell), the
highest-leverage next three moves are: **(1)** git init + first commit so
future debugging isn't archaeology, **(2)** Phase 2's containerize-and-deploy
so it's reachable outside your machine, **(3)** Phase 3's shared-secret auth
so step 2 doesn't leave your lead data open to anyone with the URL. Phases 1,
4, and 5 improve quality/trust in the data but don't block you from actually
using the tool day to day.
