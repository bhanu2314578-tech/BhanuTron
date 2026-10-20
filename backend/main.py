import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from routers.auth import router as auth_router
from routers.chat import router as chat_router
from routers.documents import (
    DocumentResponse,
    router as documents_router,
    upload_document,
)
from routers.history import router as history_router
from routers.usage import router as usage_router
from routers.user import router as user_router
from schemas import ErrorResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="BhanuTron API",
    summary="Authenticated document question answering API",
    description=(
        "Manage documents and conversations, and ask questions grounded in "
        "the documents you upload. Protected endpoints require a Supabase "
        "access token. In Swagger UI, click **Authorize** and enter the token."
    ),
    version="1.0.0",
    docs_url="/docs",
    openapi_url="/openapi.json",
    redoc_url=None,
    openapi_tags=[
        {"name": "health", "description": "Service availability"},
        {"name": "auth", "description": "Sign up, sign in, and sign out"},
        {"name": "documents", "description": "Upload and manage private documents"},
        {"name": "chat", "description": "Ask questions using document retrieval"},
        {"name": "history", "description": "Manage saved conversations"},
        {"name": "usage", "description": "Account usage statistics"},
        {"name": "user", "description": "Authenticated user profile"},
    ],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if "*" in settings.allowed_origins else settings.allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(documents_router)
app.include_router(history_router)
app.include_router(usage_router)
app.include_router(user_router)
app.add_api_route(
    "/api/upload",
    upload_document,
    methods=["POST"],
    status_code=201,
    response_model=DocumentResponse,
    tags=["documents"],
    summary="Upload and process a document",
    description=(
        "Compatibility upload route. Accepts PDF, DOCX, or UTF-8 TXT files "
        "and returns the processed document."
    ),
    responses={
        400: {"model": ErrorResponse, "description": "Empty file or unsupported type"},
        401: {"model": ErrorResponse, "description": "Missing or invalid bearer token"},
        413: {"model": ErrorResponse, "description": "Upload exceeds the file size limit"},
        422: {"model": ErrorResponse, "description": "File is unreadable"},
        502: {"model": ErrorResponse, "description": "Storage or processing service failed"},
    },
)


@app.get(
    "/health",
    tags=["health"],
    summary="Health check",
    description="Returns success when the API process is responding.",
    responses={200: {"description": "API is healthy"}},
)
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    _: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    del exc
    return JSONResponse(
        status_code=422,
        content={"detail": "Request validation failed"},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, _: Exception) -> JSONResponse:
    logger.exception("Unhandled API error for %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )
