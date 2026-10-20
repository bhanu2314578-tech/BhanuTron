import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from gotrue.errors import AuthApiError
from pydantic import BaseModel, Field, field_validator

from services.supabase_client import get_auth_client
from schemas import ErrorResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["auth"])
bearer_scheme = HTTPBearer(auto_error=False)


class AuthUser(BaseModel):
    id: str
    email: str
    name: str = ""


class AuthResponse(BaseModel):
    token: str
    user: AuthUser


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=1, max_length=256)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()


class SignupRequest(LoginRequest):
    name: str = Field(min_length=1, max_length=120)
    password: str = Field(min_length=8, max_length=256)

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        name = value.strip()
        if not name:
            raise ValueError("Name is required")
        return name


def _user_details(user: Any) -> dict[str, str]:
    metadata = getattr(user, "user_metadata", None) or {}
    name = metadata.get("name") or metadata.get("full_name") or ""
    return {
        "id": str(user.id),
        "email": str(user.email or ""),
        "name": str(name),
    }


def _auth_response(data: Any) -> dict[str, Any]:
    if not data.session or not data.user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email confirmation is required before you can sign in",
        )
    return {
        "token": data.session.access_token,
        "user": _user_details(data.user),
    }


@router.post(
    "/login",
    summary="Sign in",
    description="Verify credentials with Supabase and return a bearer access token.",
    response_model=AuthResponse,
    responses={
        401: {"model": ErrorResponse, "description": "Invalid credentials"},
        403: {"model": ErrorResponse, "description": "Email confirmation required"},
        422: {"model": ErrorResponse, "description": "Invalid request body"},
        502: {"model": ErrorResponse, "description": "Supabase authentication unavailable"},
        503: {"model": ErrorResponse, "description": "Backend auth configuration is missing"},
    },
)
def login(payload: LoginRequest) -> dict[str, Any]:
    try:
        result = get_auth_client().auth.sign_in_with_password(
            {"email": payload.email, "password": payload.password}
        )
    except AuthApiError as exc:
        logger.info("Supabase rejected a sign-in attempt")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        ) from exc
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Supabase sign-in request failed")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Authentication service is unavailable",
        ) from exc

    return _auth_response(result)


@router.post(
    "/signup",
    status_code=status.HTTP_201_CREATED,
    summary="Create an account",
    description="Create a Supabase Auth account. Email confirmation may be required.",
    response_model=AuthResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Account could not be created"},
        403: {"model": ErrorResponse, "description": "Email confirmation required"},
        422: {"model": ErrorResponse, "description": "Invalid request body"},
        502: {"model": ErrorResponse, "description": "Supabase authentication unavailable"},
        503: {"model": ErrorResponse, "description": "Backend auth configuration is missing"},
    },
)
def signup(payload: SignupRequest) -> dict[str, Any]:
    try:
        result = get_auth_client().auth.sign_up(
            {
                "email": payload.email,
                "password": payload.password,
                "options": {"data": {"name": payload.name}},
            }
        )
    except AuthApiError as exc:
        logger.info("Supabase rejected an account creation request")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to create an account with those details",
        ) from exc
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Supabase sign-up request failed")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Authentication service is unavailable",
        ) from exc

    return _auth_response(result)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> AuthUser:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        response = get_auth_client().auth.get_user(credentials.credentials)
        user = response.user
    except AuthApiError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Supabase token validation failed")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Authentication service is unavailable",
        ) from exc

    if user is None or not user.id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    metadata = getattr(user, "user_metadata", None) or {}
    return AuthUser(
        id=str(user.id),
        email=str(user.email or ""),
        name=str(metadata.get("name") or metadata.get("full_name") or ""),
    )


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Sign out",
    description=(
        "Validate the current bearer token. Discard the token client-side to "
        "complete sign-out; access tokens are not revoked by this endpoint."
    ),
    responses={
        204: {"description": "Signed out"},
        401: {"model": ErrorResponse, "description": "Missing or invalid bearer token"},
        502: {"model": ErrorResponse, "description": "Supabase authentication unavailable"},
    },
)
def logout(_: AuthUser = Depends(get_current_user)) -> None:
    return None
