"""
GitHub API Service
Handles all interactions with the GitHub REST API for repository
and issue discovery.
"""

import requests
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor

from utils.config import settings


class GitHubService:
    def __init__(self):
        self.base_url = "https://api.github.com"
        self.token = settings.GITHUB_TOKEN
        self.headers = {"Accept": "application/vnd.github.v3+json"}
        if self.token:
            self.headers["Authorization"] = f"token {self.token}"

    def search_repositories(
        self,
        language: Optional[str] = None,
        min_stars: int = 0,
        keywords: Optional[str] = None,
        limit: int = 20,
    ) -> List[Dict]:
        query_parts = []
        if keywords:
            query_parts.append(keywords)
        if language:
            query_parts.append(f"language:{language}")
        if min_stars > 0:
            query_parts.append(f"stars:>={min_stars}")

        date_filter = (datetime.now() - timedelta(days=180)).strftime("%Y-%m-%d")
        query_with_date = " ".join(query_parts + [f"pushed:>={date_filter}"])
        query = query_with_date if query_parts else "stars:>100"

        url = f"{self.base_url}/search/repositories"
        params = {"q": query, "sort": "stars", "order": "desc", "per_page": min(limit, 100)}

        try:
            response = requests.get(url, headers=self.headers, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()

            if data.get("total_count", 0) == 0 and query_parts:
                params["q"] = " ".join(query_parts)
                response = requests.get(url, headers=self.headers, params=params, timeout=10)
                response.raise_for_status()
                data = response.json()

            items = data.get("items", [])[:limit]

            with ThreadPoolExecutor(max_workers=10) as executor:
                issue_counts = dict(executor.map(
                    lambda item: (item["full_name"], self._count_good_first_issues(item["full_name"])),
                    items
                ))

            repositories = []
            for item in items:
                repositories.append({
                    "name": item["name"],
                    "owner": item["owner"]["login"],
                    "github_id": item["id"],
                    "full_name": item["full_name"],
                    "description": item.get("description") or "No description available",
                    "stars": item["stargazers_count"],
                    "forks": item["forks_count"],
                    "language": item.get("language") or "Unknown",
                    "url": item["html_url"],
                    "topics": item.get("topics", []),
                    "created_at": item["created_at"],
                    "updated_at": item["updated_at"],
                    "good_first_issues": issue_counts.get(item["full_name"], 0),
                    "open_issues": item["open_issues_count"],
                })
            return repositories
        except Exception as e:
            print(f"GitHub API error: {e}")
            return []

    def get_trending_repositories(self, language: Optional[str] = None) -> List[Dict]:
        date_filter = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
        query = f"created:>{date_filter}"
        if language:
            query += f" language:{language}"

        url = f"{self.base_url}/search/repositories"
        params = {"q": query, "sort": "stars", "order": "desc", "per_page": 20}

        try:
            response = requests.get(url, headers=self.headers, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()

            if data.get("total_count", 0) == 0:
                query = f"pushed:>{date_filter} stars:>100"
                if language:
                    query += f" language:{language}"
                params["q"] = query
                response = requests.get(url, headers=self.headers, params=params, timeout=10)
                response.raise_for_status()
                data = response.json()

            items = data.get("items", [])

            with ThreadPoolExecutor(max_workers=10) as executor:
                issue_counts = dict(executor.map(
                    lambda item: (item["full_name"], self._count_good_first_issues(item["full_name"])),
                    items
                ))

            repositories = []
            for item in items:
                repositories.append({
                    "name": item["name"],
                    "owner": item["owner"]["login"],
                    "github_id": item["id"],
                    "full_name": item["full_name"],
                    "description": item.get("description") or "No description available",
                    "stars": item["stargazers_count"],
                    "forks": item["forks_count"],
                    "language": item.get("language") or "Unknown",
                    "url": item["html_url"],
                    "topics": item.get("topics", []),
                    "good_first_issues": issue_counts.get(item["full_name"], 0),
                    "created_at": item["created_at"],
                    "updated_at": item["updated_at"],
                    "open_issues": item["open_issues_count"],
                })
            return repositories
        except Exception as e:
            print(f"Error fetching trending repos: {e}")
            return []

    def search_good_first_issues(self, language: Optional[str] = None, limit: int = 20) -> List[Dict]:
        query = 'label:"good first issue" state:open'
        if language:
            query += f" language:{language}"

        url = f"{self.base_url}/search/issues"
        params = {"q": query, "sort": "created", "order": "desc", "per_page": 50}

        try:
            response = requests.get(url, headers=self.headers, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()

            if data.get("total_count", 0) == 0 and language:
                params["q"] = 'label:"good first issue" state:open'
                response = requests.get(url, headers=self.headers, params=params, timeout=10)
                response.raise_for_status()
                data = response.json()

            issue_items = data.get("items", [])
            unique_repo_urls = list({issue["repository_url"] for issue in issue_items})

            with ThreadPoolExecutor(max_workers=10) as executor:
                repo_pairs = list(executor.map(
                    lambda u: (u, self._get_repository_details(u)), unique_repo_urls
                ))

            repo_map = {u: d for u, d in repo_pairs if d}
            for repo_url in repo_map:
                repo_map[repo_url]["good_first_issues"] = 0
            for issue in issue_items:
                repo_url = issue["repository_url"]
                if repo_url in repo_map:
                    repo_map[repo_url]["good_first_issues"] += 1

            return list(repo_map.values())[:limit]
        except Exception as e:
            print(f"Error searching good first issues: {e}")
            return []

    def get_repo_issues(self, full_name: str, labels: str = "good first issue,help wanted", limit: int = 20) -> List[Dict]:
        """Get open issues for a specific repo, filtered by labels."""
        url = f"{self.base_url}/repos/{full_name}/issues"
        params = {"state": "open", "labels": labels, "per_page": min(limit, 100)}
        try:
            response = requests.get(url, headers=self.headers, params=params, timeout=10)
            response.raise_for_status()
            issues = response.json()
            return [
                {
                    "title": issue["title"],
                    "number": issue["number"],
                    "url": issue["html_url"],
                    "labels": [l["name"] for l in issue.get("labels", [])],
                    "created_at": issue["created_at"],
                }
                for issue in issues if "pull_request" not in issue
            ]
        except Exception as e:
            print(f"Error fetching issues for {full_name}: {e}")
            return []

    def _get_repository_details(self, repo_url: str) -> Optional[Dict]:
        try:
            response = requests.get(repo_url, headers=self.headers, timeout=10)
            response.raise_for_status()
            item = response.json()
            return {
                "name": item["name"],
                "owner": item["owner"]["login"],
                "github_id": item["id"],
                "full_name": item["full_name"],
                "description": item.get("description") or "No description available",
                "stars": item["stargazers_count"],
                "forks": item.get("forks_count", 0),
                "language": item.get("language") or "Unknown",
                "url": item["html_url"],
                "topics": item.get("topics", []),
            }
        except Exception:
            return None

    def _count_good_first_issues(self, repo_full_name: str) -> int:
        url = f"{self.base_url}/search/issues"
        params = {"q": f'repo:{repo_full_name} label:"good first issue" state:open', "per_page": 1}
        try:
            response = requests.get(url, headers=self.headers, params=params, timeout=5)
            response.raise_for_status()
            return response.json().get("total_count", 0)
        except Exception:
            return 0
