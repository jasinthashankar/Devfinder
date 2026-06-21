"""
Job Aggregator Service
Pulls remote developer job listings from 3 sources:
1. RemoteOK (no key needed)
2. Arbeitnow (no key needed)
3. Adzuna (requires ADZUNA_APP_ID + ADZUNA_APP_KEY in .env)
"""

import requests
from typing import List, Dict, Optional
from utils.config import settings


class JobService:
    def __init__(self):
        self.remoteok_url = "https://remoteok.com/api"
        self.arbeitnow_url = "https://www.arbeitnow.com/api/job-board-api"
        self.adzuna_app_id = settings.ADZUNA_APP_ID
        self.adzuna_app_key = settings.ADZUNA_APP_KEY
        self.adzuna_url = "https://api.adzuna.com/v1/api/jobs/in/search/1"  # 'in' = India

    def fetch_remoteok_jobs(self, tag: Optional[str] = None, limit: int = 100) -> List[Dict]:
        try:
            url = self.remoteok_url if not tag else f"{self.remoteok_url}?tags={tag}"
            response = requests.get(url, headers={"User-Agent": "DevFinder/1.0"}, timeout=15)
            response.raise_for_status()
            data = response.json()
            jobs = []
            for item in data:
                if not isinstance(item, dict) or "id" not in item:
                    continue
                jobs.append({
                    "source": "remoteok",
                    "external_id": str(item.get("id")),
                    "title": item.get("position", "Untitled"),
                    "company": item.get("company", "Unknown"),
                    "location": item.get("location", "Remote"),
                    "remote": True,
                    "tags": item.get("tags", []),
                    "apply_url": item.get("url", ""),
                    "description": (item.get("description") or "")[:500],
                    "posted_date": item.get("date"),
                })
            return jobs[:limit]
        except Exception as e:
            print(f"[JobService] RemoteOK error: {e}")
            return []

    def fetch_arbeitnow_jobs(self, limit: int = 100) -> List[Dict]:
        try:
            response = requests.get(self.arbeitnow_url, timeout=15)
            response.raise_for_status()
            data = response.json().get("data", [])
            jobs = []
            for item in data:
                jobs.append({
                    "source": "arbeitnow",
                    "external_id": item.get("slug", ""),
                    "title": item.get("title", "Untitled"),
                    "company": item.get("company_name", "Unknown"),
                    "location": item.get("location", "Remote"),
                    "remote": item.get("remote", False),
                    "tags": item.get("tags", []),
                    "apply_url": item.get("url", ""),
                    "description": (item.get("description") or "")[:500],
                    "posted_date": item.get("created_at"),
                })
            return jobs[:limit]
        except Exception as e:
            print(f"[JobService] Arbeitnow error: {e}")
            return []

    def fetch_adzuna_jobs(self, keyword: Optional[str] = None, limit: int = 50) -> List[Dict]:
        """
        Fetch jobs from Adzuna API.
        Uses 'in' (India) country code. Change to 'gb', 'us', 'au' etc. if needed.
        """
        if not self.adzuna_app_id or not self.adzuna_app_key:
            print("[JobService] Adzuna keys not configured — skipping")
            return []

        try:
            params = {
                "app_id": self.adzuna_app_id,
                "app_key": self.adzuna_app_key,
                "results_per_page": min(limit, 50),
                "content-type": "application/json",
                "what": keyword or "software developer",
                "sort_by": "date",
            }
            response = requests.get(self.adzuna_url, params=params, timeout=15)
            response.raise_for_status()
            data = response.json()

            jobs = []
            for item in data.get("results", []):
                # Extract tags from category + contract type
                tags = []
                if item.get("category", {}).get("label"):
                    tags.append(item["category"]["label"])
                if item.get("contract_type"):
                    tags.append(item["contract_type"])

                jobs.append({
                    "source": "adzuna",
                    "external_id": str(item.get("id", "")),
                    "title": item.get("title", "Untitled"),
                    "company": item.get("company", {}).get("display_name", "Unknown"),
                    "location": item.get("location", {}).get("display_name", "Unknown"),
                    "remote": "remote" in (item.get("title", "") + item.get("description", "")).lower(),
                    "tags": tags,
                    "apply_url": item.get("redirect_url", ""),
                    "description": (item.get("description") or "")[:500],
                    "posted_date": item.get("created"),
                    "salary_min": item.get("salary_min"),
                    "salary_max": item.get("salary_max"),
                })
            print(f"[JobService] Adzuna returned {len(jobs)} jobs")
            return jobs
        except Exception as e:
            print(f"[JobService] Adzuna error: {e}")
            return []

    def fetch_all_jobs(self, limit_per_source: int = 100, keyword: Optional[str] = None) -> List[Dict]:
        """Fetch from all 3 sources and merge."""
        remoteok  = self.fetch_remoteok_jobs(limit=limit_per_source)
        arbeitnow = self.fetch_arbeitnow_jobs(limit=limit_per_source)
        adzuna    = self.fetch_adzuna_jobs(keyword=keyword, limit=50)

        all_jobs = remoteok + arbeitnow + adzuna

        # Deduplicate by apply_url
        seen = set()
        unique = []
        for job in all_jobs:
            url = job.get("apply_url", "")
            if url and url not in seen:
                seen.add(url)
                unique.append(job)
            elif not url:
                unique.append(job)

        print(f"[JobService] Total: {len(unique)} unique jobs (RemoteOK={len(remoteok)}, Arbeitnow={len(arbeitnow)}, Adzuna={len(adzuna)})")
        return unique
