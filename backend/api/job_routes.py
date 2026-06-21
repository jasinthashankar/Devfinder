"""
Jobs & Internships — fully live, no DB storage at all.
30-minute in-memory cache to avoid hammering APIs on every click.
"""

from fastapi import APIRouter, Query
from typing import Optional, List, Dict
import time

from services.job_service import JobService

router = APIRouter(prefix="/api", tags=["jobs"])
job_service = JobService()

INTERN_KEYWORDS = [
    "intern", "internship", "trainee", "fresher",
    "junior", "entry level", "entry-level", "graduate"
]

_cache: dict = {}
_CACHE_TTL = 1800  # 30 minutes


def _get_base_jobs() -> List[Dict]:
    """Return cached base jobs or fetch fresh."""
    now = time.time()
    if "base" in _cache and now - _cache["base"][0] < _CACHE_TTL:
        print(f"[CACHE] Jobs from cache (age {int(now - _cache['base'][0])}s)")
        return _cache["base"][1]
    print("[LIVE] Fetching fresh jobs from all sources...")
    remoteok  = job_service.fetch_remoteok_jobs(limit=100)
    arbeitnow = job_service.fetch_arbeitnow_jobs(limit=100)
    merged = _merge(remoteok, arbeitnow)
    _cache["base"] = (now, merged)
    print(f"[LIVE] Base cache: {len(merged)} jobs")
    return merged


def _merge(a: List[Dict], b: List[Dict]) -> List[Dict]:
    seen, result = set(), []
    for job in a + b:
        url = job.get("apply_url", "")
        if url and url not in seen:
            seen.add(url)
            result.append(job)
        elif not url:
            result.append(job)
    return result


def _score(job: Dict, query: str) -> int:
    q     = query.lower()
    title = job.get("title", "").lower()
    tags  = " ".join(job.get("tags", [])).lower()
    desc  = (job.get("description") or "").lower()
    s = 0
    if q in title:                         s += 10
    if any(w in title for w in q.split()): s += 5
    if q in tags:                          s += 8
    if any(w in tags for w in q.split()):  s += 4
    if q in desc:                          s += 3
    if any(w in desc for w in q.split()):  s += 1
    return s


def _filter_and_rank(jobs, tech, remote, location):
    results = jobs
    if remote is not None:
        results = [j for j in results if j.get("remote") == remote]
    if location:
        loc = location.lower()
        results = [j for j in results if loc in (j.get("location") or "").lower()]
    if tech:
        scored = [(j, _score(j, tech)) for j in results]
        scored = [(j, s) for j, s in scored if s > 0]
        scored.sort(key=lambda x: x[1], reverse=True)
        results = [j for j, _ in scored]
    return results


@router.get("/jobs")
async def get_jobs(
    remote: Optional[bool] = None,
    location: Optional[str] = None,
    tech: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """
    Fully live jobs — no DB at all.
    Base listings cached 30 min. Adzuna queried fresh per keyword.
    """
    base = _get_base_jobs()

    # Fetch Adzuna fresh for keyword (targeted results)
    if tech:
        adzuna = job_service.fetch_adzuna_jobs(keyword=tech, limit=50)
        all_jobs = _merge(base, adzuna)
    else:
        adzuna = job_service.fetch_adzuna_jobs(limit=50)
        all_jobs = _merge(base, adzuna)

    filtered = _filter_and_rank(_clean_jobs(all_jobs), tech, remote, location)
    total = len(filtered)
    start = (page - 1) * page_size
    return {"items": filtered[start:start + page_size], "total": total, "source": "live"}


@router.get("/internships")
async def get_internships(
    location: Optional[str] = None,
    tech: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """
    Fully live internships — no DB at all.
    Filters base jobs + Adzuna intern search by intern keywords.
    """
    base = _get_base_jobs()

    # Adzuna intern-specific fetch
    adzuna_kw = f"internship {tech}" if tech else "internship"
    adzuna = job_service.fetch_adzuna_jobs(keyword=adzuna_kw, limit=50)

    # Extra RemoteOK intern/junior tags
    now = time.time()
    if "intern_tags" in _cache and now - _cache["intern_tags"][0] < _CACHE_TTL:
        extra = _cache["intern_tags"][1]
    else:
        extra  = job_service.fetch_remoteok_jobs(tag="intern", limit=50)
        extra += job_service.fetch_remoteok_jobs(tag="junior", limit=50)
        _cache["intern_tags"] = (now, extra)

    all_jobs = _merge(_merge(base, adzuna), extra)

    def is_intern(job):
        combined = f"{job.get('title','')} {' '.join(job.get('tags',[]))} {job.get('description','') or ''}".lower()
        return any(kw in combined for kw in INTERN_KEYWORDS)

    intern_jobs = [j for j in all_jobs if is_intern(j)]
    filtered = _filter_and_rank(_clean_jobs(intern_jobs), tech, None, location)
    total = len(filtered)
    start = (page - 1) * page_size
    return {"items": filtered[start:start + page_size], "total": total, "source": "live"}


def _is_readable(text: str) -> bool:
    """Return False if text contains mostly non-Latin characters."""
    if not text:
        return True
    non_latin = sum(1 for c in text if ord(c) > 0x024F)
    return non_latin / len(text) < 0.3


def _clean_jobs(jobs: List[Dict]) -> List[Dict]:
    """Remove jobs with garbled/non-English titles or companies."""
    return [
        j for j in jobs
        if _is_readable(j.get("title", "")) and _is_readable(j.get("company", ""))
    ]
