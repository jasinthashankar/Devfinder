"""
Auth routes: register, login, GitHub OAuth.
"""

from fastapi import APIRouter, HTTPException, status
import requests
import traceback
import re

from models.schemas import RegisterRequest, LoginRequest, TokenResponse
from database.db_manager import DatabaseManager
from auth.jwt_handler import hash_password, verify_password, create_access_token
from utils.config import settings

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _safe_log(db, user_id, email, username, action, method):
    """Log auth event without crashing the login flow."""
    try:
        db.log_auth_event(user_id, email, username, action, method)
    except Exception as e:
        print(f"[WARNING] log_auth_event failed (non-critical): {e}")


@router.post("/register", response_model=TokenResponse)
def register(payload: RegisterRequest):
    try:
        db = DatabaseManager()
        user = db.create_user(payload.username, payload.email, hash_password(payload.password))
        if not user:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
        _safe_log(db, user["id"], user["email"], user["username"], "register", "email")
        token = create_access_token({"sub": user["id"], "email": user["email"], "role": user["role"]})
        return TokenResponse(
            access_token=token,
            user={"id": user["id"], "username": user["username"], "email": user["email"], "role": user["role"]},
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Register: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest):
    try:
        db = DatabaseManager()
        user = db.get_user_by_email(payload.email)
        if not user or not verify_password(payload.password, user.get("password_hash", "")):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
        _safe_log(db, user["id"], user["email"], user["username"], "login", "email")
        token = create_access_token({"sub": user["id"], "email": user["email"], "role": user["role"]})
        return TokenResponse(
            access_token=token,
            user={"id": user["id"], "username": user["username"], "email": user["email"], "role": user["role"]},
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Login: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/github", response_model=TokenResponse)
def github_oauth(payload: dict):
    code = payload.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="GitHub code is required")
    if not settings.GITHUB_CLIENT_ID or not settings.GITHUB_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="GitHub OAuth not configured in .env")

    # Step 1: Exchange code for token
    try:
        token_resp = requests.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            json={
                "client_id": settings.GITHUB_CLIENT_ID,
                "client_secret": settings.GITHUB_CLIENT_SECRET,
                "code": code,
            },
            timeout=10,
        )
        token_data = token_resp.json()
        github_token = token_data.get("access_token")
        if not github_token:
            print(f"[GitHub OAuth] Token exchange failed: {token_data}")
            raise HTTPException(status_code=400, detail="GitHub token exchange failed. Try again.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"GitHub token exchange error: {e}")

    # Step 2: Fetch GitHub profile
    try:
        gh_headers = {
            "Authorization": f"Bearer {github_token}",
            "Accept": "application/vnd.github.v3+json",
        }
        profile = requests.get("https://api.github.com/user", headers=gh_headers, timeout=10).json()

        email = profile.get("email")
        if not email:
            emails = requests.get("https://api.github.com/user/emails", headers=gh_headers, timeout=10).json()
            primary = next((e for e in emails if e.get("primary") and e.get("verified")), None)
            email = primary["email"] if primary else None

        if not email:
            raise HTTPException(status_code=400, detail="Could not get email from GitHub. Make sure your GitHub email is verified.")

        github_id = str(profile["id"])
        username = re.sub(r"[^a-zA-Z0-9_]", "_", profile.get("login", f"github_{github_id}"))
        print(f"[GitHub OAuth] User: {username} ({email})")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"GitHub profile error: {e}")

    # Step 3: Find or create user
    try:
        db = DatabaseManager()
        user = db.get_user_by_email(email)
        if user:
            action = "login"
        else:
            user = db.create_user(username=username, email=email, password_hash="github_oauth")
            if not user:
                user = db.create_user(
                    username=f"{username}_{github_id[-4:]}",
                    email=email,
                    password_hash="github_oauth"
                )
            action = "register"

        _safe_log(db, user["id"], user["email"], user["username"], action, "github")

        token = create_access_token({"sub": user["id"], "email": user["email"], "role": user["role"]})
        return TokenResponse(
            access_token=token,
            user={"id": user["id"], "username": user["username"], "email": user["email"], "role": user["role"]},
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] GitHub OAuth DB: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))