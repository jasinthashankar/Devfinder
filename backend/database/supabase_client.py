"""
Supabase client singleton.
Uses the service_role key so the backend has full DB access
and bypasses Row Level Security (RLS) policies.
"""

from supabase import create_client, Client
from utils.config import settings

_supabase_client: Client | None = None


def get_supabase() -> Client:
    global _supabase_client
    if _supabase_client is None:
        if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
            raise RuntimeError(
                "SUPABASE_URL / SUPABASE_SERVICE_KEY not set. "
                "Copy backend/.env.example to backend/.env and fill in your Supabase project credentials."
            )
        _supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    return _supabase_client
