"""
Rated - HTTP API wrapper

Wraps the service classes from rated_backend.py with FastAPI routes so
the frontend (rated.html) can talk to them via fetch() calls.

Run locally:
    pip install fastapi uvicorn
    uvicorn api:api --reload

Then open http://localhost:8000/docs for an interactive UI to test
every endpoint.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from rated_backend import App, Movie

# ─── App init ─────────────────────────────────────────────────────────────────

api = FastAPI(title="Rated API", version="0.1.0")

# CORS — let the browser-loaded HTML file call this server.
# allow_origins=["*"] is fine for local development. For production, replace
# with your actual Netlify domain (e.g. ["https://rated.netlify.app"]).
api.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Single shared backend instance. In a real deploy this would connect to
# Postgres, but for local dev everything lives in memory.
app_instance = App()

# Seed the same movies the frontend has hardcoded so IDs match.
# When you wire TMDB later, this seed list goes away.
app_instance.seed_movies([
    Movie("m-001", "Interstellar",       "Sci-Fi",   year=2014),
    Movie("m-002", "Parasite",           "Thriller", year=2019),
    Movie("m-003", "The Dark Knight",    "Action",   year=2008),
    Movie("m-004", "Whiplash",           "Drama",    year=2014),
    Movie("m-005", "RRR",                "Action",   year=2022),
])

# Seed mock users matching the frontend's MOCK_FRIENDS / USER_PROFILES so
# follow/unfollow can work end-to-end. Each one logs in via the stub auth.
# The username gets claimed during seed so the frontend can look them up.
def _seed_user(username: str, name: str, email: str):
    user = app_instance.auth.google_login(f"sub_seed_{username}|{name}|{email}")
    app_instance.user_db.claim_username(user, username)
    return user

cinephile = _seed_user("cinephile99",  "Cinephile",  "cinephile@example.com")
filmfreak = _seed_user("filmfreak",    "Film Freak", "filmfreak@example.com")
reeltalks = _seed_user("reeltalks",    "Reel Talks", "reeltalks@example.com")
maya      = _seed_user("maya",         "Maya",       "maya@example.com")
jasonk    = _seed_user("jasonk",       "Jason K",    "jasonk@example.com")
josh      = _seed_user("josh",         "Josh",       "josh@example.com")
lina      = _seed_user("lina",         "Lina",       "lina@example.com")
carlos    = _seed_user("carlos",       "Carlos",     "carlos@example.com")

# Seed each mock user with a few rankings so the activity feed has real data
# when you follow them. Mix of overlapping and unique movies for variety.
# Score 1-10 (the same scale the frontend uses).
def _seed_rankings(user, ranks):
    """ranks = [(movie_id, score), ...]"""
    for movie_id, score in ranks:
        app_instance.ranking_service.add_ranking(user.user_id, movie_id, score)

_seed_rankings(cinephile, [("m-002", 10), ("m-001", 9), ("m-004", 9), ("m-003", 8)])
_seed_rankings(filmfreak, [("m-003", 10), ("m-001", 9), ("m-002", 8)])
_seed_rankings(reeltalks, [("m-002", 10), ("m-005", 9), ("m-004", 8), ("m-003", 7)])
_seed_rankings(maya,      [("m-004", 10), ("m-001", 9), ("m-002", 9)])
_seed_rankings(jasonk,    [("m-001", 10), ("m-003", 9)])
_seed_rankings(josh,      [("m-005", 10), ("m-002", 8)])
_seed_rankings(lina,      [("m-004", 10), ("m-002", 9), ("m-001", 8)])
_seed_rankings(carlos,    [("m-005", 10), ("m-003", 9), ("m-001", 7)])


# ─── Request/response models (validate incoming JSON) ─────────────────────────

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


# ─── Health check ─────────────────────────────────────────────────────────────

@api.get("/")
def root():
    """Quick sanity-check that the server is alive."""
    return {
        "service": "rated-api",
        "status": "ok",
        "movies_seeded": len(app_instance.movie_db.all()),
        "users_registered": len(app_instance.user_db.all()),
    }


# ─── Movies ───────────────────────────────────────────────────────────────────

@api.get("/movies")
def list_movies():
    """All seeded movies — for the catalog/search."""
    return [m.to_dict() for m in app_instance.movie_db.all()]


@api.get("/movies/{movie_id}")
def get_movie(movie_id: str):
    movie = app_instance.movie_db.get(movie_id)
    if not movie:
        raise HTTPException(status_code=404, detail=f"Movie {movie_id} not found")
    return movie.to_dict()


@api.get("/movies/top")
def top_movies(n: int = 10):
    """Leaderboard — movies sorted by average user score."""
    return [
        {"movie": m.to_dict(), "avg_score": s}
        for m, s in app_instance.ranking_service.top_movies(n)
    ]


# ─── Auth ─────────────────────────────────────────────────────────────────────

@api.post("/auth/login")
def login(req: LoginRequest):
    """
    Stub Google OAuth login. Real impl would validate the JWT against Google.
    For now: pass id_token as 'sub|name|email' (e.g. 'sub_alice|Alice|a@x.com').
    """
    try:
        user = app_instance.auth.google_login(req.id_token)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    token = app_instance.auth.generate_session_token(user)
    return {
        "user": user.to_dict(),
        "session_token": token,
        "user_id": user.user_id,
        "username": user.username,           # null if not claimed yet
        "needs_username": user.username is None,
    }


# ─── Username claim flow ──────────────────────────────────────────────────────
# After login, new users need to pick a public @handle. Frontend calls:
#   1. GET  /auth/username/check/{username}    → is it available?
#   2. POST /auth/username                     → claim it
# Validation rules: 3-20 chars, lowercase letters/numbers/underscores only.

import re

class UsernameClaimRequest(BaseModel):
    username: str

USERNAME_PATTERN = re.compile(r"^[a-z0-9_]{3,20}$")
RESERVED_USERNAMES = {"admin", "root", "rated", "support", "help", "api", "www"}

def validate_username_format(username: str) -> Optional[str]:
    """Returns an error message if invalid, None if format is OK."""
    if not username:
        return "Username is required"
    if len(username) < 3:
        return "At least 3 characters"
    if len(username) > 20:
        return "Max 20 characters"
    if not USERNAME_PATTERN.match(username):
        return "Only lowercase letters, numbers, and underscores"
    if username.lower() in RESERVED_USERNAMES:
        return "Username is reserved"
    return None


@api.get("/auth/username/check/{username}")
def check_username(username: str):
    """Is this @handle available? Used for live availability checking as user types."""
    err = validate_username_format(username)
    if err:
        return {"available": False, "reason": err}
    if app_instance.user_db.is_username_taken(username):
        return {"available": False, "reason": "Username already taken"}
    return {"available": True}


@api.post("/auth/username")
def claim_username(body: UsernameClaimRequest, session_token: str = ""):
    """
    Claim a @handle for the logged-in user. Real auth would derive user_id
    from the session token; for now we look up the user by token in a simple way.
    NOTE: this stub doesn't actually validate the token — anyone with any
    token can claim. That's fine for local dev. Real auth comes later.
    """
    # In a real system: look up user_id from session_token via a sessions table.
    # For now: if there's exactly one user, assume it's them (good enough for solo dev).
    # If there are multiple, we'd need real session tracking.
    users = app_instance.user_db.all()
    if not users:
        raise HTTPException(status_code=401, detail="Not logged in")
    # Find the most recently created user (best guess for "current user")
    user = max(users, key=lambda u: u.created_at)
    # Validate format
    err = validate_username_format(body.username)
    if err:
        raise HTTPException(status_code=400, detail=err)
    # Check availability (skip if it's the user's current username)
    if user.username != body.username and app_instance.user_db.is_username_taken(body.username):
        raise HTTPException(status_code=409, detail="Username already taken")
    app_instance.user_db.claim_username(user, body.username)
    return {"ok": True, "username": body.username, "user_id": user.user_id}


# ─── Users ────────────────────────────────────────────────────────────────────

@api.get("/users/{user_id}")
def get_user(user_id: str):
    user = app_instance.user_db.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail=f"User {user_id} not found")
    return user.to_dict()


@api.get("/users/by-username/{username}")
def get_user_by_username(username: str):
    """Look up a user by their @handle. Returns the same shape as get_user.
    Used by the frontend to translate @handles → user_ids before calling
    follow/unfollow endpoints (which need UUIDs)."""
    user = app_instance.user_db.find_by_username(username)
    if not user:
        raise HTTPException(status_code=404, detail=f"@{username} not found")
    return user.to_dict()


# ─── Rankings ─────────────────────────────────────────────────────────────────

@api.post("/users/{user_id}/rankings")
def add_ranking(user_id: str, body: RankRequest):
    """Rank a movie 1-10. Replaces any existing rank for the same user+movie."""
    try:
        ranking = app_instance.ranking_service.add_ranking(
            user_id, body.movie_id, body.score
        )
        return ranking.to_dict()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@api.get("/users/{user_id}/rankings")
def get_user_rankings(user_id: str):
    """All of a user's ranked movies, highest score first."""
    return [r.to_dict() for r in app_instance.ranking_service.user_rankings(user_id)]


@api.post("/users/{user_id}/pairwise")
def record_pairwise(user_id: str, body: PairwiseRequest):
    """Record that the user picked one movie over another."""
    result = app_instance.ranking_service.record_pairwise(
        user_id, body.winner_movie_id, body.loser_movie_id
    )
    return {
        "user_id": result.user_id,
        "winner_movie_id": result.winner_movie_id,
        "loser_movie_id": result.loser_movie_id,
        "timestamp": result.timestamp,
    }


# ─── Feed ─────────────────────────────────────────────────────────────────────

@api.post("/users/{user_id}/follow")
def follow(user_id: str, body: FollowRequest):
    try:
        app_instance.feed_service.follow(user_id, body.followee_id)
        return {"ok": True}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@api.delete("/users/{user_id}/follow/{followee_id}")
def unfollow(user_id: str, followee_id: str):
    app_instance.feed_service.unfollow(user_id, followee_id)
    return {"ok": True}


@api.get("/users/{user_id}/feed")
def get_feed(user_id: str, limit: int = 20):
    """Activity from people the user follows, newest first."""
    try:
        return [r.to_dict() for r in app_instance.feed_service.get_feed(user_id, limit)]
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ─── Watchlist ────────────────────────────────────────────────────────────────

@api.post("/users/{user_id}/watchlist")
def add_to_watchlist(user_id: str, body: WatchlistAddRequest):
    """Add a movie to watchlist. Idempotent — duplicate adds are silently ignored."""
    try:
        item = app_instance.watchlist_service.add(user_id, body.movie_id, body.item_type)
        return item.to_dict()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@api.delete("/users/{user_id}/watchlist/{movie_id}")
def remove_from_watchlist(user_id: str, movie_id: str):
    app_instance.watchlist_service.remove(user_id, movie_id)
    return {"ok": True}


@api.get("/users/{user_id}/watchlist")
def get_watchlist(user_id: str):
    """List of movie_ids on the user's watchlist, newest added first."""
    return app_instance.watchlist_service.get(user_id)


# ─── Saved movies (bookmarks) ─────────────────────────────────────────────────
# Same shape as watchlist but conceptually distinct.

class SavedAddRequest(BaseModel):
    movie_id: str


@api.post("/users/{user_id}/saved")
def add_saved(user_id: str, body: SavedAddRequest):
    try:
        app_instance.saved_service.add(user_id, body.movie_id)
        return {"ok": True, "movie_id": body.movie_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@api.delete("/users/{user_id}/saved/{movie_id}")
def remove_saved(user_id: str, movie_id: str):
    app_instance.saved_service.remove(user_id, movie_id)
    return {"ok": True}


@api.get("/users/{user_id}/saved")
def get_saved(user_id: str):
    """List of movie_ids the user has bookmarked, newest first."""
    return app_instance.saved_service.get(user_id)


# ─── Reviews ──────────────────────────────────────────────────────────────────
# One review per user per movie. Submitting again replaces (edits) the existing.

class ReviewSubmitRequest(BaseModel):
    movie_id: str
    rating: int
    text: str


@api.post("/users/{user_id}/reviews")
def submit_review(user_id: str, body: ReviewSubmitRequest):
    """Create or edit a review. If the user already reviewed this movie, the
    text/rating get updated and edited_at is stamped."""
    try:
        review = app_instance.review_service.submit(
            user_id, body.movie_id, body.rating, body.text
        )
        return review.to_dict()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@api.delete("/users/{user_id}/reviews/{movie_id}")
def delete_review(user_id: str, movie_id: str):
    removed = app_instance.review_service.delete(user_id, movie_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Review not found")
    return {"ok": True}


@api.get("/users/{user_id}/reviews")
def get_user_reviews(user_id: str):
    """All reviews this user has written, newest first."""
    reviews = app_instance.review_service.get_for_user(user_id)
    reviews.sort(key=lambda r: r.edited_at or r.created_at, reverse=True)
    return [r.to_dict() for r in reviews]


@api.get("/movies/{movie_id}/reviews")
def get_movie_reviews(movie_id: str):
    """All reviews for a movie, newest first. Includes reviewer's username."""
    reviews = app_instance.review_service.get_for_movie(movie_id)
    out = []
    for r in reviews:
        d = r.to_dict()
        author = app_instance.user_db.get(r.user_id)
        d["username"] = author.username if author else None
        d["display_name"] = author.name if author else None
        out.append(d)
    return out
