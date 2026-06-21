import os
from dotenv import load_dotenv
load_dotenv()

class Settings:
    SUPABASE_URL: str          = os.getenv("SUPABASE_URL", "")
    SUPABASE_SERVICE_KEY: str  = os.getenv("SUPABASE_SERVICE_KEY", "")
    JWT_SECRET_KEY: str        = os.getenv("JWT_SECRET_KEY", "change-me")
    JWT_ALGORITHM: str         = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))
    GROQ_API_KEY: str          = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str            = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
    GITHUB_TOKEN: str          = os.getenv("GITHUB_TOKEN", "")
    GITHUB_CLIENT_ID: str      = os.getenv("GITHUB_CLIENT_ID", "")
    GITHUB_CLIENT_SECRET: str  = os.getenv("GITHUB_CLIENT_SECRET", "")
    RESEND_API_KEY: str        = os.getenv("RESEND_API_KEY", "re_placeholder")
    RESEND_FROM_EMAIL: str     = os.getenv("RESEND_FROM_EMAIL", "onboarding@resend.dev")
    ADZUNA_APP_ID: str         = os.getenv("ADZUNA_APP_ID", "")
    ADZUNA_APP_KEY: str        = os.getenv("ADZUNA_APP_KEY", "")
    HOST: str                  = os.getenv("HOST", "0.0.0.0")
    PORT: int                  = int(os.getenv("PORT", "8000"))
    FRONTEND_URL: str          = os.getenv("FRONTEND_URL", "http://localhost:5173")

settings = Settings()


def validate_settings():
    missing = []
    if not settings.SUPABASE_URL:
        missing.append("SUPABASE_URL")
    if not settings.SUPABASE_SERVICE_KEY:
        missing.append("SUPABASE_SERVICE_KEY")
    if not settings.GROQ_API_KEY:
        missing.append("GROQ_API_KEY")
    if settings.JWT_SECRET_KEY == "change-me":
        missing.append("JWT_SECRET_KEY")
    if settings.RESEND_API_KEY.startswith("re_placeholder"):
        missing.append("RESEND_API_KEY (emails will be mocked)")
    if not settings.GITHUB_CLIENT_ID:
        missing.append("GITHUB_CLIENT_ID (GitHub OAuth disabled)")
    if not settings.GITHUB_CLIENT_SECRET:
        missing.append("GITHUB_CLIENT_SECRET (GitHub OAuth disabled)")
    if not settings.ADZUNA_APP_ID:
        missing.append("ADZUNA_APP_ID (Adzuna jobs skipped)")
    return missing
