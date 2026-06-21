"""
Recommendations — fully live, no DB dependency.
Fetches repos from GitHub using user skills as search keywords,
then ranks with Groq AI. Nothing stored in Supabase.
"""

from fastapi import APIRouter, Depends, HTTPException
from models.schemas import RecommendRequest, AlertCreateRequest, SaveProjectRequest
from services.github_service import GitHubService
from services.groq_service import GroqService
from services.alert_service import AlertService
from database.db_manager import DatabaseManager
from auth.jwt_handler import get_current_user, require_admin

router = APIRouter(prefix="/api", tags=["misc"])

groq_service = GroqService()
alert_service = AlertService()
github_service = GitHubService()

_FALLBACK_LANGUAGES = [
    "Python", "JavaScript", "TypeScript", "Java", "Go", "Rust",
    "C++", "C", "C#", "Ruby", "PHP", "Swift", "Kotlin", "Scala",
    "Elixir", "Haskell", "Lua", "R", "Julia", "Dart", "Shell",
    "HTML", "CSS", "Vue", "Svelte", "Clojure", "Nim", "Zig",
]


# ---------------- LANGUAGES ----------------
@router.get("/languages")
def get_languages():
    return {"languages": sorted(_FALLBACK_LANGUAGES)}


# ---------------- RECOMMENDATIONS (fully live) ----------------
@router.post("/recommend")
async def recommend(payload: RecommendRequest):
    """
    Fully live — fetches from GitHub every time using skills + language.
    Nothing stored in or read from Supabase.
    Works for any language, any skill.
    """
    all_repos = []
    seen = set()

    def add_repos(repos):
        for repo in repos:
            key = repo.get("full_name") or repo.get("name", "")
            if key and key not in seen:
                seen.add(key)
                all_repos.append(repo)

    # Search 1: skills as keywords
    skill_keywords = " ".join(payload.skills[:5])
    print(f"[RECOMMEND] Live search — skills: {payload.skills}, language: {payload.language}")

    repos_by_skills = github_service.search_repositories(
        language=payload.language,
        keywords=skill_keywords,
        limit=20,
    )
    add_repos(repos_by_skills)

    # Search 2: each skill individually for broader coverage
    for skill in payload.skills[:3]:
        repos = github_service.search_repositories(
            language=payload.language,
            keywords=skill,
            limit=10,
        )
        add_repos(repos)

    # Search 3: if language given, also fetch trending in that language
    if payload.language:
        trending = github_service.search_repositories(
            language=payload.language,
            keywords=None,
            limit=10,
        )
        add_repos(trending)

    print(f"[RECOMMEND] {len(all_repos)} unique repos fetched from GitHub")

    if not all_repos:
        raise HTTPException(
            status_code=404,
            detail=f"No repositories found for skills: {', '.join(payload.skills)}. Try different skills or remove the language filter."
        )

    # Rank with Groq AI
    ranked = await groq_service.generate_recommendations(payload.skills, all_repos)
    return {"items": ranked, "total": len(ranked), "source": "live"}


# ---------------- ALERTS ----------------
@router.post("/alerts")
def create_alert(payload: AlertCreateRequest, user: dict = Depends(get_current_user)):
    db = DatabaseManager()
    alert = db.create_alert(user["id"], payload.language, payload.minimum_stars, payload.keywords)
    try:
        user_data = db.get_user_by_id(user["id"])
        if user_data and user_data.get("email"):
            alert_service.send_confirmation_email(user_data["email"], alert["id"])
    except Exception as e:
        print(f"[WARNING] Confirmation email failed: {e}")
    return alert


@router.get("/alerts")
def list_alerts(user: dict = Depends(get_current_user)):
    db = DatabaseManager()
    return {"items": db.list_alerts_for_user(user["id"])}


# ---------------- SAVED PROJECTS ----------------
@router.post("/save")
def save_project(payload: SaveProjectRequest, user: dict = Depends(get_current_user)):
    db = DatabaseManager()
    repo = db.get_repository_by_id(payload.repository_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    return db.save_project(user["id"], payload.repository_id)


@router.get("/saved")
def list_saved(user: dict = Depends(get_current_user)):
    db = DatabaseManager()
    return {"items": db.list_saved_projects(user["id"])}


@router.delete("/saved/{repository_id}")
def remove_saved(repository_id: str, user: dict = Depends(get_current_user)):
    db = DatabaseManager()
    db.remove_saved_project(user["id"], repository_id)
    return {"status": "removed"}


# ---------------- ADMIN ----------------
@router.get("/admin/stats")
def admin_stats(admin: dict = Depends(require_admin)):
    db = DatabaseManager()
    return db.get_statistics()
