from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from routers.auth import AuthUser, get_current_user
from services.supabase_client import get_supabase

router = APIRouter(prefix="/api/profile", tags=["profile"])


class ProfileResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str | None = None
    firstName: str | None = None
    lastName: str | None = None


class UpdateProfileRequest(BaseModel):
    name: str | None = None
    firstName: str | None = None
    lastName: str | None = None
    email: str | None = None
    role: str | None = Field(default=None, description="Read-only in UI for most users")


def _serialize_profile(row: dict) -> ProfileResponse:
    first_name = row.get("first_name")
    last_name = row.get("last_name")
    name = row.get("name") or " ".join(part for part in [first_name, last_name] if part).strip()
    return ProfileResponse(
        id=row["id"],
        name=name or row.get("email") or "User",
        email=row.get("email") or "",
        role=row.get("role"),
        firstName=first_name,
        lastName=last_name,
    )


async def _ensure_profile(user: AuthUser) -> dict:
    supabase = get_supabase()
    existing = supabase.table("profiles").select("*").eq("id", user.id).maybe_single().execute()
    if existing.data:
        return existing.data

    created = (
        supabase.table("profiles")
        .insert({"id": user.id, "email": user.email, "name": user.email or "User"})
        .execute()
    )
    return created.data[0]


@router.get("", response_model=ProfileResponse)
async def get_profile(user: AuthUser = Depends(get_current_user)):
    profile = await _ensure_profile(user)
    return _serialize_profile(profile)


@router.patch("", response_model=ProfileResponse)
async def update_profile(
    payload: UpdateProfileRequest,
    user: AuthUser = Depends(get_current_user),
):
    await _ensure_profile(user)
    updates = {
        key: value
        for key, value in {
            "name": payload.name,
            "first_name": payload.firstName,
            "last_name": payload.lastName,
            "email": payload.email,
            "role": payload.role,
        }.items()
        if value is not None
    }

    supabase = get_supabase()
    response = supabase.table("profiles").update(updates).eq("id", user.id).execute()
    return _serialize_profile(response.data[0])
