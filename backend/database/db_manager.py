"""
Database Manager
All database operations go through the Supabase Python client.
"""

from typing import Dict, List, Optional
from datetime import datetime, timezone
from database.supabase_client import get_supabase


class DatabaseManager:
    def __init__(self):
        self.db = get_supabase()

    # ------------------------------------------------------------------
    # USERS
    # ------------------------------------------------------------------
    def create_user(self, username: str, email: str, password_hash: str, role: str = "user") -> Optional[Dict]:
        existing = self.db.table("users").select("id").eq("email", email).execute()
        if existing.data:
            return None
        result = self.db.table("users").insert({
            "username": username,
            "email": email,
            "password_hash": password_hash,
            "role": role,
        }).execute()
        return result.data[0] if result.data else None

    def get_user_by_email(self, email: str) -> Optional[Dict]:
        result = self.db.table("users").select("*").eq("email", email).limit(1).execute()
        return result.data[0] if result.data else None

    def get_user_by_id(self, user_id: str) -> Optional[Dict]:
        result = self.db.table("users").select("*").eq("id", user_id).limit(1).execute()
        return result.data[0] if result.data else None

    # ------------------------------------------------------------------
    # AUTH EVENT LOGGING
    # ------------------------------------------------------------------
    def log_auth_event(self, user_id: str, email: str, username: str, action: str, method: str):
        try:
            self.db.table("auth_events").insert({
                "user_id": user_id,
                "email": email,
                "username": username,
                "action": action,
                "method": method,
            }).execute()
            print(f"[AUTH] Logged {action} via {method} for {email}")
        except Exception as e:
            print(f"[WARNING] auth_events log failed (non-critical): {e}")

    # ------------------------------------------------------------------
    # REPOSITORIES
    # ------------------------------------------------------------------
    def save_repository(self, repo: Dict) -> Optional[Dict]:
        payload = {
            "github_id": repo.get("github_id"),
            "repo_name": repo.get("name") or repo.get("repo_name"),
            "owner": repo.get("owner", ""),
            "full_name": repo["full_name"],
            "description": repo.get("description", ""),
            "language": repo.get("language", ""),
            "stars": repo.get("stars", 0),
            "forks": repo.get("forks", 0),
            "url": repo.get("url", ""),
            "topics": repo.get("topics", []),
            "good_first_issues": repo.get("good_first_issues", 0),
            "ai_summary": repo.get("ai_summary", ""),
            "ai_tags": repo.get("ai_tags", []),
            "difficulty": repo.get("difficulty") or None,
            "skills_required": repo.get("skills_required", []),
            "tech_stack": repo.get("tech_stack", ""),
            "learning_value": repo.get("learning_value", ""),
            "future_scope": repo.get("future_scope", ""),
            "why_contribute": repo.get("why_contribute", ""),
            "career_relevance": repo.get("career_relevance", ""),
            "getting_started": repo.get("getting_started", ""),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        result = self.db.table("repositories").upsert(payload, on_conflict="full_name").execute()
        return result.data[0] if result.data else None

    def get_repository(self, full_name: str) -> Optional[Dict]:
        result = self.db.table("repositories").select("*").eq("full_name", full_name).limit(1).execute()
        return result.data[0] if result.data else None

    def get_repository_by_id(self, repo_id: str) -> Optional[Dict]:
        result = self.db.table("repositories").select("*").eq("id", repo_id).limit(1).execute()
        return result.data[0] if result.data else None

    def list_repositories(self, language=None, min_stars=0, difficulty=None,
                          keywords=None, page=1, page_size=20) -> Dict:
        query = self.db.table("repositories").select("*", count="exact")
        if language:
            query = query.eq("language", language)
        if min_stars:
            query = query.gte("stars", min_stars)
        if difficulty:
            query = query.eq("difficulty", difficulty)
        if keywords:
            query = query.or_(f"repo_name.ilike.%{keywords}%,description.ilike.%{keywords}%")
        start = (page - 1) * page_size
        result = query.order("stars", desc=True).range(start, start + page_size - 1).execute()
        return {"items": result.data, "total": result.count or 0}

    # ------------------------------------------------------------------
    # JOBS
    # ------------------------------------------------------------------
    def save_job(self, job: Dict) -> Optional[Dict]:
        payload = {
            "source": job.get("source", ""),
            "external_id": job.get("external_id"),
            "title": job.get("title", ""),
            "company": job.get("company", ""),
            "location": job.get("location", ""),
            "remote": job.get("remote", False),
            "tags": job.get("tags", []),
            "apply_url": job.get("apply_url", ""),
            "description": job.get("description", ""),
            "posted_date": job.get("posted_date"),
        }
        result = self.db.table("jobs").upsert(payload, on_conflict="source,external_id").execute()
        return result.data[0] if result.data else None

    def list_jobs(self, remote=None, location=None, tech=None, page=1, page_size=20) -> Dict:
        query = self.db.table("jobs").select("*", count="exact")
        if remote is not None:
            query = query.eq("remote", remote)
        if location:
            query = query.ilike("location", f"%{location}%")
        if tech:
            query = query.ilike("title", f"%{tech}%")
        start = (page - 1) * page_size
        result = query.order("posted_date", desc=True).range(start, start + page_size - 1).execute()
        return {"items": result.data, "total": result.count or 0}

    # ------------------------------------------------------------------
    # ALERTS
    # ------------------------------------------------------------------
    def create_alert(self, user_id: str, language: Optional[str],
                     minimum_stars: int, keywords: Optional[str]) -> Dict:
        result = self.db.table("alerts").insert({
            "user_id": user_id,
            "language": language,
            "minimum_stars": minimum_stars,
            "keywords": keywords,
        }).execute()
        return result.data[0]

    def list_alerts_for_user(self, user_id: str) -> List[Dict]:
        result = self.db.table("alerts").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        return result.data

    def get_active_alerts(self) -> List[Dict]:
        result = self.db.table("alerts").select("*, users(email)").eq("active", True).execute()
        return result.data

    def mark_alert_triggered(self, alert_id: str):
        self.db.table("alerts").update({
            "last_triggered": datetime.now(timezone.utc).isoformat()
        }).eq("id", alert_id).execute()

    # ------------------------------------------------------------------
    # SAVED PROJECTS
    # ------------------------------------------------------------------
    def save_project(self, user_id: str, repository_id: str) -> Optional[Dict]:
        result = self.db.table("saved_projects").upsert({
            "user_id": user_id,
            "repository_id": repository_id,
        }, on_conflict="user_id,repository_id").execute()
        return result.data[0] if result.data else None

    def list_saved_projects(self, user_id: str) -> List[Dict]:
        result = (
            self.db.table("saved_projects")
            .select("*, repositories(*)")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        return result.data

    def remove_saved_project(self, user_id: str, repository_id: str):
        self.db.table("saved_projects").delete().eq("user_id", user_id).eq("repository_id", repository_id).execute()

    # ------------------------------------------------------------------
    # SEARCH LOGGING / STATS
    # ------------------------------------------------------------------
    def log_search(self, search_params: Dict):
        try:
            self.db.table("searches").insert({
                "language": search_params.get("language", ""),
                "keywords": search_params.get("keywords", ""),
                "min_stars": search_params.get("min_stars", 0),
                "results_count": search_params.get("results_count", 0),
            }).execute()
        except Exception as e:
            print(f"[WARNING] log_search failed: {e}")

    def get_statistics(self) -> Dict:
        repos    = self.db.table("repositories").select("id", count="exact").execute()
        users    = self.db.table("users").select("id", count="exact").execute()
        jobs     = self.db.table("jobs").select("id", count="exact").execute()
        alerts   = self.db.table("alerts").select("id", count="exact").eq("active", True).execute()
        searches = self.db.table("searches").select("id", count="exact").execute()

        lang_data = self.db.table("repositories").select("language").execute()
        lang_counts: Dict[str, int] = {}
        for row in lang_data.data:
            lang = row.get("language") or "Unknown"
            lang_counts[lang] = lang_counts.get(lang, 0) + 1
        popular_languages = sorted(
            [{"language": k, "count": v} for k, v in lang_counts.items()],
            key=lambda x: x["count"], reverse=True
        )[:5]

        return {
            "total_users": users.count or 0,
            "total_repositories": repos.count or 0,
            "total_jobs": jobs.count or 0,
            "active_alerts": alerts.count or 0,
            "total_searches": searches.count or 0,
            "popular_languages": popular_languages,
            "last_updated": datetime.now(timezone.utc).isoformat(),
        }