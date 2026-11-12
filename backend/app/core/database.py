"""
Database connection and Supabase client initialization
"""

from supabase import create_client, Client
from app.core.config import settings


def get_supabase_client() -> Client:
    """
    Create Supabase client with service role key
    Use ONLY for privileged backend operations
    """
    return create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_ROLE_KEY
    )


def get_supabase_client_for_user(access_token: str) -> Client:
    """
    Create Supabase client with user's access token
    This client has RLS applied based on the user's JWT
    """
    return create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_ANON_KEY,
        options={
            "headers": {
                "Authorization": f"Bearer {access_token}"
            }
        }
    )


# Global service role client for privileged operations
# Use sparingly and only for admin/system operations
supabase_admin = get_supabase_client()
