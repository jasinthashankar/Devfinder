"""
Repository routes — fully live, no DB storage.
Every request fetches directly from GitHub API.
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Optional
import traceback

from services.github_service import GitHubService
from services.groq_service import GroqService

router = APIRouter(prefix="/api", tags=["repositories"])
github_service = GitHubService()
groq_service = GroqService()


@router.get("/repos")
async def get_repositories(
    language: Optional[str] = None,
    min_stars: int = 0,
    difficulty: Optional[str] = None,
    keywords: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """
    Fully live — fetches directly from GitHub every request.
    No DB read or write. Always fresh data.
    """
    try:
        print(f"[LIVE] Repos: lang={language}, keywords={keywords}, min_stars={min_stars}")

        repos = github_service.search_repositories(
            language=language,
            min_stars=min_stars,
            keywords=keywords,
            limit=page_size * 2,
        )

        # Filter by difficulty locally if requested
        if difficulty and repos:
            filtered = []
            for repo in repos:
                try:
                    analysis = await groq_service.analyze_repository(repo)
                    repo.update(analysis)
                    if analysis.get("difficulty", "").lower() == difficulty.lower():
                        filtered.append(repo)
                except Exception:
                    filtered.append(repo)
            repos = filtered if filtered else repos

        # Paginate in memory
        total = len(repos)
        start = (page - 1) * page_size
        items = repos[start:start + page_size]

        return {"items": items, "total": total, "source": "live"}

    except Exception as e:
        print(f"[ERROR] /api/repos: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/repos/{repo_id}")
async def get_repository_detail(repo_id: str):
    raise HTTPException(status_code=404, detail="Detail view not available in live mode")
