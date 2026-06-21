"""
Alert & Notification Service
Sends email notifications for DevFinder events via the Resend API.

Replaces the original Gmail SMTP implementation which was unreliable.

Setup:
  1. Sign up at https://resend.com and get your API key.
  2. Add RESEND_API_KEY=re_... to backend/.env
  3. Set RESEND_FROM_EMAIL to a verified sender, e.g. alerts@yourdomain.com
     (Resend's free tier allows onboarding@resend.dev as sender for testing)
"""

import requests
import json
from typing import List, Dict

from utils.config import settings


class AlertService:
    RESEND_SEND_URL = "https://api.resend.com/emails"

    def __init__(self):
        self.api_key = settings.RESEND_API_KEY
        self.from_email = settings.RESEND_FROM_EMAIL
        self.frontend_url = settings.FRONTEND_URL

        self.enabled = bool(
            self.api_key
            and not self.api_key.startswith("your-")
            and not self.api_key.startswith("re_placeholder")
        )

        if self.enabled:
            print(f"[AlertService] Resend email enabled (from: {self.from_email})")
        else:
            print("[AlertService] RESEND_API_KEY not configured — emails will be logged only.")

    # ------------------------------------------------------------------
    # PUBLIC METHODS
    # ------------------------------------------------------------------

    def send_confirmation_email(self, recipient_email: str, alert_id: str):
        """Send a confirmation when a user creates a new alert subscription."""
        subject = "DevFinder – Alert Subscription Confirmed"
        html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background: #0D1117; color: #C9D1D9; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="border: 1px solid #30363D; border-radius: 8px; padding: 24px;">
                <h2 style="color: #58A6FF; margin-top: 0;">Welcome to DevFinder 🚀</h2>
                <p>Your alert subscription has been successfully created.</p>
                <p><strong>Alert ID:</strong> <code style="background:#161B22; padding: 2px 6px; border-radius: 4px;">{alert_id}</code></p>
                <p>We'll email you when new open-source repositories match your criteria.</p>
                <a href="{self.frontend_url}/alerts"
                   style="display: inline-block; background: #238636; color: #fff;
                          padding: 10px 20px; border-radius: 6px; text-decoration: none;
                          margin-top: 12px; font-weight: bold;">
                    Manage My Alerts
                </a>
                <hr style="border: none; border-top: 1px solid #30363D; margin: 24px 0;">
                <p style="color: #8B949E; font-size: 12px;">
                    You received this because you signed up for alerts on DevFinder.
                </p>
            </div>
        </body>
        </html>
        """
        self._send(recipient_email, subject, html, context="confirmation")

    def send_opportunity_alert(self, recipient_email: str, repositories: List[Dict]):
        """Send an alert email listing newly matched repositories."""
        count = len(repositories)
        subject = f"DevFinder Alert: {count} New Opportunit{'y' if count == 1 else 'ies'} Found!"

        repo_cards = ""
        for repo in repositories[:5]:
            name = repo.get("repo_name") or repo.get("name", "Repository")
            url = repo.get("url", "#")
            stars = repo.get("stars", 0)
            language = repo.get("language", "Unknown")
            gfi = repo.get("good_first_issues", 0)
            desc = (repo.get("description") or "")[:150]
            repo_cards += f"""
            <div style="border-left: 3px solid #58A6FF; padding-left: 16px; margin: 16px 0;">
                <h3 style="margin: 4px 0;">
                    <a href="{url}" style="color: #58A6FF; text-decoration: none;">{name}</a>
                </h3>
                <p style="margin: 4px 0; color: #8B949E; font-size: 13px;">
                    ⭐ {stars:,} stars &nbsp;|&nbsp; {language} &nbsp;|&nbsp; {gfi} good first issue{'s' if gfi != 1 else ''}
                </p>
                <p style="margin: 4px 0; font-size: 13px;">{desc}{'...' if len(desc) == 150 else ''}</p>
            </div>
            """

        if count > 5:
            repo_cards += f'<p style="color:#8B949E;">…and {count - 5} more.</p>'

        html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background: #0D1117; color: #C9D1D9; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="border: 1px solid #30363D; border-radius: 8px; padding: 24px;">
                <h2 style="color: #3FB950; margin-top: 0;">New Developer Opportunities Found 🎯</h2>
                <p>We found <strong>{count}</strong> repositor{'y' if count == 1 else 'ies'} matching your alert criteria.</p>
                <h3 style="color: #C9D1D9;">Top Matches:</h3>
                {repo_cards}
                <a href="{self.frontend_url}"
                   style="display: inline-block; background: #238636; color: #fff;
                          padding: 10px 20px; border-radius: 6px; text-decoration: none;
                          margin-top: 16px; font-weight: bold;">
                    View All Opportunities →
                </a>
                <hr style="border: none; border-top: 1px solid #30363D; margin: 24px 0;">
                <p style="color: #8B949E; font-size: 12px;">
                    You're receiving this because you subscribed to DevFinder alerts.
                    <a href="{self.frontend_url}/alerts" style="color: #58A6FF;">Manage alerts</a>
                </p>
            </div>
        </body>
        </html>
        """
        self._send(recipient_email, subject, html, context="opportunity_alert")

    # ------------------------------------------------------------------
    # PRIVATE HELPERS
    # ------------------------------------------------------------------

    def _send(self, recipient: str, subject: str, html_body: str, context: str = ""):
        """
        Core send method using the Resend REST API.
        Logs every request and response for debugging.
        """
        payload = {
            "from": self.from_email,
            "to": [recipient],
            "subject": subject,
            "html": html_body,
        }

        print(f"[AlertService] Sending '{context}' email → {recipient} | Subject: {subject}")

        if not self.enabled:
            print(f"[AlertService][MOCK] Email NOT sent (Resend not configured). Payload preview:")
            print(f"  From:    {payload['from']}")
            print(f"  To:      {payload['to']}")
            print(f"  Subject: {payload['subject']}")
            return

        try:
            response = requests.post(
                self.RESEND_SEND_URL,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                data=json.dumps(payload),
                timeout=10,
            )

            # Log full response for debugging
            print(f"[AlertService] Resend response: HTTP {response.status_code}")
            try:
                resp_json = response.json()
                print(f"[AlertService] Resend body: {resp_json}")
            except Exception:
                print(f"[AlertService] Resend raw body: {response.text}")

            response.raise_for_status()
            print(f"[AlertService] ✅ Email delivered to {recipient}")

        except requests.exceptions.HTTPError as e:
            print(f"[AlertService] ❌ HTTP error sending email: {e}")
        except requests.exceptions.ConnectionError as e:
            print(f"[AlertService] ❌ Connection error: {e}")
        except requests.exceptions.Timeout:
            print(f"[AlertService] ❌ Resend API timed out")
        except Exception as e:
            print(f"[AlertService] ❌ Unexpected error: {e}")
