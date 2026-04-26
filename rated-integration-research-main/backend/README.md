# Backend (FastAPI)

In-memory FastAPI service for the Rated app. Two files:

- `rated_backend.py` — pure-Python domain layer (models, in-memory DBs, services). No HTTP.
- `api.py` — FastAPI HTTP wrapper. Imports `App` and `Movie` from `rated_backend`.

## Local development

```bash
cd backend
make install   # creates .venv, installs requirements.txt
make dev       # uvicorn api:app --reload on http://localhost:8000
```

Health check: `curl http://localhost:8000/` → `{"status":"ok",...}`.

OpenAPI docs auto-served at `http://localhost:8000/docs`.

## Make targets

| Target       | What it does |
|--------------|--------------|
| `install`    | Create `.venv` and `pip install -r requirements.txt` |
| `dev`        | `uvicorn api:app --reload` (autoreload, local only) |
| `run`        | `uvicorn api:app` (no reload) |
| `test`       | `pytest -q` |
| `lint`       | `ruff check .` |
| `format`     | `ruff check --fix .` + `black .` |
| `typecheck`  | `mypy .` |
| `freeze`     | `pip freeze > requirements.lock` |
| `clean`      | Remove venv + caches |

Override defaults: `make dev PORT=8001 HOST=127.0.0.1`.

## API surface

See `api.py` for full route list. Highlights:

| Method | Path | Purpose |
|--------|------|---------|
| GET    | `/` | Health |
| GET    | `/movies` | List seeded movies |
| GET    | `/movies/top` | Top-ranked |
| POST   | `/auth/login` | Exchange Google id_token for session_token |
| POST   | `/auth/username` | Claim username (requires session_token) |
| GET    | `/users/{id}/feed` | Activity feed from followed users |
| POST   | `/users/{id}/rankings` | Add a 1–10 ranking |
| POST   | `/users/{id}/follow` | Follow another user |
| POST   | `/users/{id}/saved` | Save a movie |
| POST   | `/users/{id}/reviews` | Submit a review |

Auth is **stubbed** today — `/auth/login` accepts any `id_token` shaped like
`sub|name|email` and returns a deterministic session token. See "Production gaps"
below.

## Deployment

Netlify Functions don't run Python servers, so the backend lives elsewhere.
The frontend (on Netlify) calls it via `VITE_API_BASE_URL`.

### Recommended: Render (free tier)

1. Push this repo to GitHub.
2. In Render → New → Web Service → connect this repo.
3. Set:
   - **Root Directory**: `rated-integration-research-main/backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn api:app --host 0.0.0.0 --port $PORT`
   - **Environment**: copy keys from `.env.example`
4. After deploy, Render gives you a URL like `https://rated-api.onrender.com`.
5. In Netlify → Site settings → Environment variables, set
   `VITE_API_BASE_URL = https://rated-api.onrender.com` and redeploy the frontend.

Alternative hosts that work the same way: Railway, Fly.io, Heroku.

### Hooking up Netlify DB (Neon Postgres)

When ready to move off the in-memory store:

1. In Netlify → Extensions → enable "Neon" (this provisions Netlify DB).
2. Netlify exposes `NETLIFY_DATABASE_URL` to the frontend build env. Copy that
   value into Render's `DATABASE_URL` env var (the backend reads it from there).
3. Replace `UserDB`, `MovieDB`, etc. in `rated_backend.py` with SQLAlchemy
   models against `DATABASE_URL`. (Not yet wired — see `.env.example`.)

## Production gaps (TODO)

- **Auth**: replace stub with real Google JWT verification (`google-auth` lib),
  then layer on Netlify Identity / OIDC if we want Netlify-managed sessions.
- **Storage**: in-memory → Postgres (SQLAlchemy + Alembic).
- **CORS**: currently `["*"]`; switch to `ALLOWED_ORIGINS` env var.
- **Session tokens**: currently `sha256(user_id + timestamp)`; switch to
  `secrets.token_urlsafe(32)` stored in DB with expiry.
- **Logging / observability**: no logging today. Add `structlog` + Sentry.
- **Rate limiting**: none. Add `slowapi` for login + write endpoints.
