from functools import lru_cache

from fastapi import HTTPException, status
from supabase import Client, create_client

from config import settings


def get_auth_client() -> Client:
    try:
        settings.require("supabase_url")
        settings.require("supabase_anon_key")
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service is not configured",
        ) from exc
    return create_client(
        settings.supabase_url,
        settings.get_secret("supabase_anon_key"),
    )


@lru_cache(maxsize=1)
def _create_admin_client() -> Client:
    settings.require("supabase_url")
    settings.require("supabase_service_role_key")
    return create_client(
        settings.supabase_url,
        settings.get_secret("supabase_service_role_key"),
    )


def get_supabase() -> Client:
    try:
        return _create_admin_client()
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service is not configured",
        ) from exc
