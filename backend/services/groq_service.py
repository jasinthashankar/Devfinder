"""
Groq AI Service
Repository analysis and personalized recommendations using Groq's
fast inference API (Llama 3.1).

Fix: generate_recommendations now handles both 'repo_name' and 'name'/'full_name'
fields, and always returns results even when AI ranking fails.
"""

import json
from typing import Dict, List
from groq import AsyncGroq

from utils.config import settings

DIFFICULTY_MAP = {"beginner": "Beginner", "intermediate": "Intermediate", "advanced": "Advanced"}


class GroqService:
    def __init__(self):
        if settings.GROQ_API_KEY and not settings.GROQ_API_KEY.startswith("your-"):
            self.client = AsyncGroq(api_key=settings.GROQ_API_KEY)
            self.enabled = True
            self.model = settings.GROQ_MODEL
            print("[SUCCESS] Groq AI service initialized")
        else:
            self.client = None
            self.enabled = False
            print("[WARNING] GROQ_API_KEY not configured. AI features disabled.")

    # ------------------------------------------------------------------
    # REPOSITORY ANALYSIS
    # ------------------------------------------------------------------
    async def analyze_repository(self, repo: Dict) -> Dict:
        if not self.enabled:
            return self._fallback_analysis(repo)

        try:
            prompt = f"""Analyze this GitHub repository and provide a concise technical analysis.

Repository:
- Name: {repo.get('name') or repo.get('repo_name', 'Unknown')}
- Description: {repo.get('description', 'No description')}
- Language: {repo.get('language', 'Unknown')}
- Stars: {repo.get('stars', 0)}
- Topics: {', '.join(repo.get('topics', []))}
- Open Issues: {repo.get('open_issues', 0)}

Respond ONLY with valid JSON with these fields:
{{
  "summary": "1-2 sentence summary",
  "what_it_does": "problem it solves",
  "tech_stack": "main technologies used",
  "learning_value": "skills developer can learn",
  "difficulty": "beginner|intermediate|advanced",
  "future_scope": "potential improvements",
  "why_contribute": "reason to contribute",
  "career_relevance": "job market relevance",
  "getting_started": "how to start contributing",
  "skills": ["skill1", "skill2", "skill3", "skill4"]
}}"""

            response = await self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are an expert technical analyst. Always respond with valid JSON only."},
                    {"role": "user", "content": prompt},
                ],
                model=self.model,
                temperature=0.7,
                max_tokens=1000,
                response_format={"type": "json_object"},
            )

            ai_data = json.loads(response.choices[0].message.content)
            difficulty_raw = ai_data.get("difficulty", "intermediate").lower()
            skills = ai_data.get("skills", repo.get("topics", [])[:5])

            return {
                "ai_summary": (ai_data.get("what_it_does") or ai_data.get("summary", ""))[:300],
                "difficulty": DIFFICULTY_MAP.get(difficulty_raw, "Intermediate"),
                "ai_tags": skills,
                "skills_required": skills,
                "tech_stack": ai_data.get("tech_stack", ""),
                "learning_value": ai_data.get("learning_value", ""),
                "future_scope": ai_data.get("future_scope", ""),
                "why_contribute": ai_data.get("why_contribute", ""),
                "career_relevance": ai_data.get("career_relevance", ""),
                "getting_started": ai_data.get("getting_started", ""),
            }
        except Exception as e:
            print(f"[Groq] analyze_repository error for {repo.get('name')}: {e}")
            return self._fallback_analysis(repo)

    def _fallback_analysis(self, repo: Dict) -> Dict:
        return {
            "ai_summary": (repo.get("description") or "No description available")[:300],
            "difficulty": DIFFICULTY_MAP.get(self._estimate_difficulty_basic(repo), "Intermediate"),
            "ai_tags": repo.get("topics", [])[:5],
            "skills_required": repo.get("topics", [])[:5],
            "tech_stack": repo.get("language", ""),
            "learning_value": "",
            "future_scope": "",
            "why_contribute": "",
            "career_relevance": "",
            "getting_started": "",
        }

    def _estimate_difficulty_basic(self, repo: Dict) -> str:
        stars = repo.get("stars", 0)
        gfi = repo.get("good_first_issues", 0)
        language = (repo.get("language") or "").lower()
        if gfi > 5:
            return "beginner"
        if language in ["python", "javascript", "html", "css"] and stars < 1000:
            return "beginner"
        if stars > 10000 or language in ["rust", "c++", "assembly", "haskell"]:
            return "advanced"
        return "intermediate"

    # ------------------------------------------------------------------
    # RECOMMENDATIONS  (fixed field name handling)
    # ------------------------------------------------------------------
    async def generate_recommendations(self, user_interests: List[str], available_repos: List[Dict]) -> List[Dict]:
        """
        Rank repos by relevance to user skills.
        Handles both DB repos (repo_name field) and live GitHub repos (name/full_name field).
        Always returns results — never empty.
        """
        if not available_repos:
            return []

        # Normalize: ensure every repo has a consistent 'display_name' for matching
        for repo in available_repos:
            if not repo.get("repo_name"):
                repo["repo_name"] = repo.get("full_name") or repo.get("name", "unknown")
            if not repo.get("description"):
                repo["description"] = ""

        if not self.enabled:
            return self._score_repos_locally(user_interests, available_repos)

        try:
            # Send top 20 candidates to AI for ranking
            candidates = available_repos[:20]
            repo_list = "\n".join([
                f"{i+1}. {r['repo_name']} ({r.get('language', 'Unknown')}) - {(r.get('description') or '')[:120]}"
                for i, r in enumerate(candidates)
            ])

            prompt = f"""User skills/interests: {', '.join(user_interests)}

Repositories to rank:
{repo_list}

Rank ALL repositories from most to least relevant for the user's skills.
Include ALL repository names in the ranking.

Respond ONLY with valid JSON:
{{"rankings": ["repo_name1", "repo_name2", ...]}}"""

            response = await self.client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=self.model,
                temperature=0.3,
                max_tokens=800,
                response_format={"type": "json_object"},
            )

            result = json.loads(response.choices[0].message.content)
            ranked_names = result.get("rankings", [])

            print(f"[Groq] AI returned {len(ranked_names)} ranked repos")

            # Match by name — try exact then partial
            ranked_repos = []
            used = set()

            for name in ranked_names:
                name_lower = name.lower().strip()
                for repo in candidates:
                    repo_key = repo["repo_name"].lower()
                    # Match full_name, short name, or partial
                    if (repo_key == name_lower or
                        repo_key.endswith("/" + name_lower) or
                        name_lower.endswith("/" + repo_key) or
                        repo_key.split("/")[-1] == name_lower):
                        if repo["repo_name"] not in used:
                            ranked_repos.append(repo)
                            used.add(repo["repo_name"])
                        break

            # Append any unmatched repos at the end
            for repo in candidates:
                if repo["repo_name"] not in used:
                    ranked_repos.append(repo)
                    used.add(repo["repo_name"])

            print(f"[Groq] Final ranked list: {len(ranked_repos)} repos")
            return ranked_repos[:10]

        except Exception as e:
            print(f"[Groq] generate_recommendations error: {e}")
            return self._score_repos_locally(user_interests, available_repos)

    def _score_repos_locally(self, skills: List[str], repos: List[Dict]) -> List[Dict]:
        """
        Fallback: score repos locally by skill keyword matching.
        Used when Groq is disabled or fails.
        """
        def score(repo):
            combined = f"{repo.get('repo_name','')} {repo.get('description','')} {repo.get('language','')} {' '.join(repo.get('topics', []))} {' '.join(repo.get('ai_tags') or [])}".lower()
            return sum(2 if skill.lower() in combined else 0 for skill in skills)

        scored = sorted(repos, key=score, reverse=True)
        return scored[:10]
