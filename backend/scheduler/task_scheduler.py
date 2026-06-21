"""
Background Scheduler
Runs every 12 hours: refreshes trending repositories (with AI analysis),
job listings, then checks user alerts and sends emails via Resend.
"""

import asyncio
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from database.db_manager import DatabaseManager
from services.github_service import GitHubService
from services.groq_service import GroqService
from services.job_service import JobService
from services.alert_service import AlertService

github_service = GitHubService()
groq_service = GroqService()
job_service = JobService()
alert_service = AlertService()

# Languages to refresh trending repos for
TRENDING_LANGUAGES = ["Python", "JavaScript", "TypeScript", "Go", "Rust", None]


async def refresh_repositories():
    print("[SCHEDULER] Refreshing trending repositories...")
    db = DatabaseManager()
    for lang in TRENDING_LANGUAGES:
        try:
            repos = github_service.get_trending_repositories(language=lang)
            for repo in repos:
                try:
                    analysis = await groq_service.analyze_repository(repo)
                    repo.update(analysis)
                    db.save_repository(repo)
                except Exception as e:
                    print(f"[SCHEDULER] Analyze/save failed for {repo.get('full_name')}: {e}")
        except Exception as e:
            print(f"[SCHEDULER] Trending fetch failed for lang={lang}: {e}")
    print("[SCHEDULER] Repository refresh complete.")


def refresh_jobs():
    print("[SCHEDULER] Refreshing job listings...")
    db = DatabaseManager()
    try:
        jobs = job_service.fetch_all_jobs(limit_per_source=50)
        for job in jobs:
            db.save_job(job)
        print(f"[SCHEDULER] {len(jobs)} jobs refreshed.")
    except Exception as e:
        print(f"[SCHEDULER] Job refresh error: {e}")


def check_alerts():
    print("[SCHEDULER] Checking user alerts...")
    db = DatabaseManager()
    try:
        alerts = db.get_active_alerts()
        triggered = 0
        for alert in alerts:
            matches = db.list_repositories(
                language=alert.get("language"),
                min_stars=alert.get("minimum_stars", 0),
                keywords=alert.get("keywords"),
                page=1,
                page_size=10,
            )["items"]

            if matches:
                user_email = (alert.get("users") or {}).get("email")
                if user_email:
                    alert_service.send_opportunity_alert(user_email, matches)
                    db.mark_alert_triggered(alert["id"])
                    triggered += 1
        print(f"[SCHEDULER] Alert check complete — {triggered}/{len(alerts)} alerts triggered.")
    except Exception as e:
        print(f"[SCHEDULER] Alert check error: {e}")


async def run_full_cycle():
    await refresh_repositories()
    refresh_jobs()
    check_alerts()


def start_scheduler():
    scheduler = AsyncIOScheduler()
    scheduler.add_job(run_full_cycle, "interval", hours=12, id="devfinder_refresh")
    scheduler.start()
    print("[SCHEDULER] Started — running every 12 hours.")
    return scheduler
