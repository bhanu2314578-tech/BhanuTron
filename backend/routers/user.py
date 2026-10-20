from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field

from routers.auth import AuthUser, get_current_user
from schemas import ErrorResponse
from services.supabase_client import get_supabase

router = APIRouter(prefix="/api/user", tags=["user"])


class ProfileResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    firstName: str
    lastName: str


class UpdateProfileRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str | None = Field(default=None, max_length=120)
    first_name: str | None = Field(default=None, alias="firstName", max_length=60)
    last_name: str | None = Field(default=None, alias="lastName", max_length=60)
    email: str | None = Field(default=None, max_length=320)
    role: str | None = Field(default=None, max_length=120)


def _profile_response(user: AuthUser, row: dict[str, Any] | None) -> dict[str, Any]:
    row = row or {}
    return {
        "id": user.id,
        "name": row.get("name") or user.name,
        "email": user.email,
        "role": row.get("job_title") or row.get("role") or "",
        "firstName": row.get("first_name") or "",
        "lastName": row.get("last_name") or "",
    }


def _get_profile(user_id: str) -> dict[str, Any] | None:
    return (
        get_supabase()
        .table("profiles")
        .select("id,name,email,first_name,last_name,role,job_title")
        .eq("id", user_id)
        .maybe_single()
        .execute()
    ).data


@router.get(
    "/profile",
    response_model=ProfileResponse,
    summary="Get user profile",
    description="Return the authenticated user's profile fields.",
    responses={
        401: {"model": ErrorResponse, "description": "Missing or invalid bearer token"},
        502: {"model": ErrorResponse, "description": "Database service unavailable"},
    },
)
def get_profile(user: AuthUser = Depends(get_current_user)) -> dict[str, Any]:
    return _profile_response(user, _get_profile(user.id))


@router.post(
    "/update",
    response_model=ProfileResponse,
    summary="Update user profile",
    description=(
        "Update the authenticated user's name and job title. Email changes are "
        "not supported here because they require account verification."
    ),
    responses={
        400: {"model": ErrorResponse, "description": "Email change is not supported"},
        401: {"model": ErrorResponse, "description": "Missing or invalid bearer token"},
        422: {"model": ErrorResponse, "description": "Invalid profile fields"},
    },
)
def update_profile(
    payload: UpdateProfileRequest,
    user: AuthUser = Depends(get_current_user),
) -> dict[str, Any]:
    if payload.email and payload.email.strip().lower() != user.email.lower():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email changes require a separate account verification flow",
        )
    if payload.role is not None and not payload.role.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Role cannot be empty",
        )

    changes: dict[str, str] = {}
    first_name = payload.first_name.strip() if payload.first_name is not None else None
    last_name = payload.last_name.strip() if payload.last_name is not None else None
    name = payload.name.strip() if payload.name is not None else None
    if first_name is not None:
        changes["first_name"] = first_name
    if last_name is not None:
        changes["last_name"] = last_name
    if name is not None:
        changes["name"] = name
    elif first_name is not None or last_name is not None:
        current = _get_profile(user.id) or {}
        first_name = first_name if first_name is not None else current.get("first_name", "")
        last_name = last_name if last_name is not None else current.get("last_name", "")
        changes["name"] = f"{first_name} {last_name}".strip()
    if payload.role is not None:
        changes["job_title"] = payload.role.strip()

    if not changes:
        return _profile_response(user, _get_profile(user.id))

    result = (
        get_supabase()
        .table("profiles")
        .upsert(
            {
                "id": user.id,
                "email": user.email,
                **changes,
            },
            on_conflict="id",
        )
        .execute()
    ).data
    return _profile_response(user, result[0] if result else _get_profile(user.id))
