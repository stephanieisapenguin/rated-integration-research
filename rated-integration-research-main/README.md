# Rated

Movie ranking + social app. Vite + React frontend (deployed to Netlify) talks
to a FastAPI backend (deployed to Render/Railway/Fly).

```
rated-integration-research-main/
├── src/                    Frontend (React 19, Vite 8)
│   ├── App.jsx              ← main app, all screens
│   ├── main.jsx             ← React entry
│   ├── api/tmdb.js          ← TMDB client (currently inlined in App.jsx too)
│   └── Wireframe.jsx        ← static design reference
├── public/
│   └── _redirects           ← SPA fallback for Netlify
├── backend/                Backend (FastAPI, Python 3.11+)
│   ├── api.py               ← HTTP routes
│   ├── rated_backend.py     ← domain layer (in-memory DBs, services)
│   ├── Makefile             ← install / dev / run / test / lint
│   └── README.md            ← backend-specific docs
├── netlify.toml            Netlify build + redirects
├── package.json            Frontend deps + scripts
├── vite.config.js
└── .env.example            Frontend env vars (VITE_*)
```

## API location

| Environment | URL                                  | Set via                          |
|-------------|--------------------------------------|----------------------------------|
| Local dev   | `http://localhost:8000`              | `backend/Makefile` → `make dev`  |
| Production  | `https://<your-backend-host>`        | Netlify → env var `VITE_API_BASE_URL` (Render/Railway/Fly URL) |

The frontend reads the URL from `import.meta.env.VITE_API_BASE_URL`
(see `src/App.jsx`, line ~11). When unreachable, the UI silently falls back to
mocked data so the app stays usable in demos.

## Local build commands

### One-time setup

```bash
# Frontend
npm install

# Backend (creates .venv and installs FastAPI + Uvicorn)
cd backend && make install && cd ..
```

### Day-to-day

Two terminals:

```bash
# Terminal 1 — backend on :8000
cd backend && make dev

# Terminal 2 — frontend on :5173
npm run dev
```

Then open <http://localhost:5173>. The `vite` dev server proxies nothing —
the browser hits the FastAPI server directly using `VITE_API_BASE_URL`.

### Frontend npm scripts

| Command          | What it does                            |
|------------------|-----------------------------------------|
| `npm run dev`    | Vite dev server with HMR (port 5173)    |
| `npm run build`  | Production build to `dist/`             |
| `npm run preview`| Serve `dist/` locally for sanity check  |
| `npm run lint`   | ESLint over the project                 |

### Backend make targets

See `backend/README.md` for the full list. Most-used:

| Command         | What it does                            |
|-----------------|-----------------------------------------|
| `make install`  | Create `.venv`, install requirements    |
| `make dev`      | `uvicorn api:app --reload` on :8000     |
| `make test`     | `pytest -q`                             |
| `make lint`     | `ruff check .`                          |
| `make format`   | `ruff --fix` + `black`                  |
| `make clean`    | Remove venv + caches                    |

## Environment variables

Copy `.env.example` → `.env.local` (frontend) and `backend/.env.example` →
`backend/.env` (backend). The frontend only sees vars prefixed `VITE_`.

| Var                   | Where     | Purpose                                  |
|-----------------------|-----------|------------------------------------------|
| `VITE_API_BASE_URL`   | frontend  | Backend root URL                         |
| `VITE_TMDB_API_KEY`   | frontend  | TMDB v3 key (optional; falls back to mock) |
| `PORT`                | backend   | uvicorn port (default 8000)              |
| `ALLOWED_ORIGINS`     | backend   | CORS allowlist                           |
| `DATABASE_URL`        | backend   | Postgres URL (Netlify DB / Neon) — unused until we move off in-memory store |
| `GOOGLE_CLIENT_ID`    | backend   | For real Google JWT verification         |

## Deploying

### Frontend → Netlify

1. Connect the GitHub repo in Netlify → "Add new site → Import from Git".
2. Build settings (auto-detected from `netlify.toml`):
   - Base directory: `rated-integration-research-main`
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Site settings → Environment variables: set `VITE_API_BASE_URL` and
   `VITE_TMDB_API_KEY`.
4. Trigger a deploy.

### Backend → Render (recommended) / Railway / Fly

Netlify can't host the Python backend. See `backend/README.md` for the Render
walkthrough.

### Database → Netlify DB (Neon Postgres)

Provisioned via Netlify Extensions. Backend reads `DATABASE_URL` once we wire
SQLAlchemy in. See `backend/README.md` for the migration plan.

### Auth

Currently stub auth (any `sub|name|email` token works). Production path:
Google OAuth client → frontend signs in → sends id_token → backend verifies
with `google-auth` against `GOOGLE_CLIENT_ID`. Netlify Auth (OIDC) can sit in
front of the site for gated previews.

## Status

- [x] Single repo, frontend builds (`npm run build`)
- [x] Backend runs locally (`make dev`)
- [x] Env vars wired (no more hardcoded URLs)
- [x] Netlify config + SPA redirects
- [ ] Backend host picked + deployed
- [ ] Real auth (Google JWT verification)
- [ ] Postgres-backed storage (replace in-memory `App()`)
- [ ] `App.jsx` split into per-screen components (it's 5,200+ lines today)
- [ ] CI on push (lint + build)

The repo root (one level up) and the legacy duplicates there
(`api.py`, `rated_backend.py`, `RatedApp (1).jsx`, etc.) are scheduled for
removal once we rename this folder up to repo root.
