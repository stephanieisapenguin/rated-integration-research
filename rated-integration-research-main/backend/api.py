"""
Rated - HTTP API wrapper

Wraps the service classes from rated_backend.py with FastAPI routes so
the frontend (Vite dev / Netlify build) can talk to them via fetch().

Run locally:
    make install && make dev
or:
    uvicorn api:app --reload

Then open http://localhost:8000/docs to test every endpoint.

Storage: SQLAlchemy → SQLite (backend/rated.db) by default. Set DATABASE_URL
to a Postgres URL (e.g. Netlify DB / Neon) and it works the same way.
The DB file persists across server restarts; delete it (or run `make db-reset`)
to wipe back to seeded fixtures.
"""

from typing import Optional

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from db import get_db, init_db, SessionLocal
from models import MovieRow, RankingRow, UserRow
from rated_backend import App, Movie


# ─── App init ─────────────────────────────────────────────────────────────────

app = FastAPI(title="Rated API", version="0.1.0")

# CORS — allow_origins=["*"] is fine for local development. For production,
# replace with your Netlify domain (e.g. ["https://rated.netlify.app"]).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Service singletons. Stateless — each method takes a Session.
app_instance = App()


# ─── Schema + seeding (run once on startup) ───────────────────────────────────

@app.on_event("startup")
def _startup() -> None:
    init_db()
    db = SessionLocal()
    try:
        if db.execute(select(func.count()).select_from(MovieRow)).scalar() == 0:
            _seed_initial(db)
            print("[seed] inserted fixture movies + 8 mock users + rankings")
        else:
            print(f"[startup] DB has data — skipping seed")
    finally:
        db.close()


def _seed_initial(db: Session) -> None:
    app_instance.seed_movies(db, [
        Movie("m-001", "Interstellar",       "Sci-Fi",   year=2014),
        Movie("m-002", "Parasite",           "Thriller", year=2019),
        Movie("m-003", "The Dark Knight",    "Action",   year=2008),
        Movie("m-004", "Whiplash",           "Drama",    year=2014),
        Movie("m-005", "RRR",                "Action",   year=2022),
    ])

    def _user(username, name, email):
        user = app_instance.auth.google_login(db, f"sub_seed_{username}|{name}|{email}")
        app_instance.auth.claim_username(db, user, username)
        return user

    seeds = [
        ("cinephile99", "Cinephile",  "cinephile@example.com",
            [("m-002", 10), ("m-001", 9), ("m-004", 9), ("m-003", 8)]),
        ("filmfreak",   "Film Freak", "filmfreak@example.com",
            [("m-003", 10), ("m-001", 9), ("m-002", 8)]),
        ("reeltalks",   "Reel Talks", "reeltalks@example.com",
            [("m-002", 10), ("m-005", 9), ("m-004", 8), ("m-003", 7)]),
        ("maya",        "Maya",       "maya@example.com",
            [("m-004", 10), ("m-001", 9), ("m-002", 9)]),
        ("jasonk",      "Jason K",    "jasonk@example.com",
            [("m-001", 10), ("m-003", 9)]),
        ("josh",        "Josh",       "josh@example.com",
            [("m-005", 10), ("m-002", 8)]),
        ("lina",        "Lina",       "lina@example.com",
            [("m-004", 10), ("m-002", 9), ("m-001", 8)]),
        ("carlos",      "Carlos",     "carlos@example.com",
            [("m-005", 10), ("m-003", 9), ("m-001", 7)]),
    ]
    for username, name, email, ranks in seeds:
        user = _user(username, name, email)
        for movie_id, score in ranks:
            app_instance.ranking_service.add_ranking(db, user.user_id, movie_id, score)


# ─── Pydantic request bodies ──────────────────────────────────────────────────

class LoginRequest(BaseModel):
    id_token: str  # stub format: "sub|name|email"

class RankRequest(BaseModel):
    movie_id: str
    score: int

class PairwiseRequest(BaseModel):
    winner_movie_id: str
    loser_movie_id: str

class WatchlistAddRequest(BaseModel):
    movie_id: str
    item_type: Optional[str] = "catalog"

class FollowRequest(BaseModel):
    followee_id: str

class UsernameClaimRequest(BaseModel):
    username: str

class SavedAddRequest(BaseModel):
    movie_id: str

class ReviewSubmitRequest(BaseModel):
    movie_id: str
    rating: int
    text: str


# ─── Health ──────────────────────────────────────────────────────────────────

@app.get("/")
def root(db: Session = Depends(get_db)):
    movies = db.execute(select(func.count()).select_from(MovieRow)).scalar() or 0
    users = db.execute(select(func.count()).select_from(UserRow)).scalar() or 0
    return {
        "service": "rated-api",
        "status": "ok",
        "movies_seeded": movies,
        "users_registered": users,
    }


# ─── Movies ──────────────────────────────────────────────────────────────────
# /movies/top must come before /movies/{movie_id} so "top" isn't matched as id.

@app.get("/movies")
def list_movies(db: Session = Depends(get_db)):
    return [m.to_dict() for m in db.execute(select(MovieRow)).scalars()]


@app.get("/movies/top")
def top_movies(n: int = 10, db: Session = Depends(get_db)):
    return [
        {"movie": m.to_dict(), "avg_score": s}
        for m, s in app_instance.ranking_service.top_movies(db, n)
    ]


@app.get("/movies/{movie_id}")
def get_movie(movie_id: str, db: Session = Depends(get_db)):
    movie = db.get(MovieRow, movie_id)
    if not movie:
        raise HTTPException(status_code=404, detail=f"Movie {movie_id} not found")
    return movie.to_dict()


@app.get("/movies/{movie_id}/reviews")
def get_movie_reviews(movie_id: str, db: Session = Depends(get_db)):
    out = []
    for r in app_instance.review_service.get_for_movie(db, movie_id):
        d = r.to_dict()
        author = db.get(UserRow, r.user_id)
        d["username"] = author.username if author else None
        d["display_name"] = author.name if author else None
        out.append(d)
    return out


# ─── Auth ────────────────────────────────────────────────────────────────────

@app.post("/auth/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """Stub Google login. Pass id_token = 'sub|name|email'."""
    try:
        user = app_instance.auth.google_login(db, req.id_token)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {
        "user": user.to_dict(),
        "session_token": app_instance.auth.generate_session_token(user),
        "user_id": user.user_id,
        "username": user.username,
        "needs_username": user.username is None,
    }


@app.get("/auth/username/check/{username}")
def check_username(username: str, db: Session = Depends(get_db)):
    err = app_instance.auth.validate_username(username)
    if err:
        return {"available": False, "reason": err}
    if app_instance.auth.is_username_taken(db, username):
        return {"available": False, "reason": "Username already taken"}
    return {"available": True}


@app.post("/auth/username")
def claim_username(
    body: UsernameClaimRequest,
    session_token: str = "",
    db: Session = Depends(get_db),
):
    """Stub: claims username for the most-recently-created user. Real auth
    would derive the user from session_token."""
    user = db.execute(
        select(UserRow).order_by(UserRow.created_at.desc()).limit(1)
    ).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="Not logged in")
    err = app_instance.auth.validate_username(body.username)
    if err:
        raise HTTPException(status_code=400, detail=err)
    if user.username != body.username and app_instance.auth.is_username_taken(db, body.username):
        raise HTTPException(status_code=409, detail="Username already taken")
    app_instance.auth.claim_username(db, user, body.username)
    return {"ok": True, "username": body.username, "user_id": user.user_id}


# ─── Users ───────────────────────────────────────────────────────────────────

@app.get("/users/{user_id}")
def get_user(user_id: str, db: Session = Depends(get_db)):
    user = db.get(UserRow, user_id)
    if not user:
        raise HTTPException(status_code=404, detail=f"User {user_id} not found")
    d = user.to_dict()
    d["follower_count"] = app_instance.feed_service.follower_count(db, user_id)
    d["following_count"] = app_instance.feed_service.following_count(db, user_id)
    return d


@app.get("/users/by-username/{username}")
def get_user_by_username(username: str, db: Session = Depends(get_db)):
    user = app_instance.auth.find_by_username(db, username)
    if not user:
        raise HTTPException(status_code=404, detail=f"@{username} not found")
    d = user.to_dict()
    d["follower_count"] = app_instance.feed_service.follower_count(db, user.user_id)
    d["following_count"] = app_instance.feed_service.following_count(db, user.user_id)
    return d


# ─── Rankings ────────────────────────────────────────────────────────────────

@app.post("/users/{user_id}/rankings")
def add_ranking(user_id: str, body: RankRequest, db: Session = Depends(get_db)):
    try:
        ranking = app_instance.ranking_service.add_ranking(
            db, user_id, body.movie_id, body.score,
        )
        return ranking.to_dict()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/users/{user_id}/rankings")
def get_user_rankings(user_id: str, db: Session = Depends(get_db)):
    return [r.to_dict() for r in app_instance.ranking_service.user_rankings(db, user_id)]


@app.post("/users/{user_id}/pairwise")
def record_pairwise(user_id: str, body: PairwiseRequest, db: Session = Depends(get_db)):
    row = app_instance.ranking_service.record_pairwise(
        db, user_id, body.winner_movie_id, body.loser_movie_id,
    )
    return {
        "user_id": row.user_id,
        "winner_movie_id": row.winner_movie_id,
        "loser_movie_id": row.loser_movie_id,
        "timestamp": row.timestamp,
    }


# ─── Feed ────────────────────────────────────────────────────────────────────

@app.post("/users/{user_id}/follow")
def follow(user_id: str, body: FollowRequest, db: Session = Depends(get_db)):
    try:
        app_instance.feed_service.follow(db, user_id, body.followee_id)
        return {"ok": True}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.delete("/users/{user_id}/follow/{followee_id}")
def unfollow(user_id: str, followee_id: str, db: Session = Depends(get_db)):
    app_instance.feed_service.unfollow(db, user_id, followee_id)
    return {"ok": True}


@app.get("/users/{user_id}/feed")
def get_feed(user_id: str, limit: int = 20, db: Session = Depends(get_db)):
    try:
        return [r.to_dict() for r in app_instance.feed_service.get_feed(db, user_id, limit)]
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ─── Watchlist ───────────────────────────────────────────────────────────────

@app.post("/users/{user_id}/watchlist")
def add_to_watchlist(user_id: str, body: WatchlistAddRequest, db: Session = Depends(get_db)):
    try:
        app_instance.watchlist_service.add(db, user_id, body.movie_id, body.item_type)
        return {"ok": True, "movie_id": body.movie_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.delete("/users/{user_id}/watchlist/{movie_id}")
def remove_from_watchlist(user_id: str, movie_id: str, db: Session = Depends(get_db)):
    app_instance.watchlist_service.remove(db, user_id, movie_id)
    return {"ok": True}


@app.get("/users/{user_id}/watchlist")
def get_watchlist(user_id: str, db: Session = Depends(get_db)):
    return app_instance.watchlist_service.get(db, user_id)


# ─── Saved (bookmarks) ───────────────────────────────────────────────────────

@app.post("/users/{user_id}/saved")
def add_saved(user_id: str, body: SavedAddRequest, db: Session = Depends(get_db)):
    try:
        app_instance.saved_service.add(db, user_id, body.movie_id)
        return {"ok": True, "movie_id": body.movie_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.delete("/users/{user_id}/saved/{movie_id}")
def remove_saved(user_id: str, movie_id: str, db: Session = Depends(get_db)):
    app_instance.saved_service.remove(db, user_id, movie_id)
    return {"ok": True}


@app.get("/users/{user_id}/saved")
def get_saved(user_id: str, db: Session = Depends(get_db)):
    return app_instance.saved_service.get(db, user_id)


# ─── Reviews ─────────────────────────────────────────────────────────────────

@app.post("/users/{user_id}/reviews")
def submit_review(user_id: str, body: ReviewSubmitRequest, db: Session = Depends(get_db)):
    try:
        review = app_instance.review_service.submit(
            db, user_id, body.movie_id, body.rating, body.text,
        )
        return review.to_dict()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.delete("/users/{user_id}/reviews/{movie_id}")
def delete_review(user_id: str, movie_id: str, db: Session = Depends(get_db)):
    if not app_instance.review_service.delete(db, user_id, movie_id):
        raise HTTPException(status_code=404, detail="Review not found")
    return {"ok": True}


@app.get("/users/{user_id}/reviews")
def get_user_reviews(user_id: str, db: Session = Depends(get_db)):
    return [r.to_dict() for r in app_instance.review_service.get_for_user(db, user_id)]
