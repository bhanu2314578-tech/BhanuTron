import logging
import re
import uuid
from pathlib import PurePath
from typing import Any

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel
from starlette.concurrency import run_in_threadpool

from config import settings
from routers.auth import AuthUser, get_current_user
from services.document_processor import process_document
from services.supabase_client import get_supabase
from services.vector_db import delete_document_chunks, insert_chunks
from schemas import ErrorResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/documents", tags=["documents"])

ALLOWED_TYPES = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "text/plain": "txt",
}
EXTENSION_TYPES = {
    ".pdf": "pdf",
    ".docx": "docx",
    ".txt": "txt",
}


class DocumentResponse(BaseModel):
    id: str
    name: str
    pages: int
    uploadDate: str
    status: str
    size: str
    type: str


class RenameDocumentRequest(BaseModel):
    name: str


class DownloadLinkResponse(BaseModel):
    url: str


def _format_size(size_bytes: int) -> str:
    if size_bytes < 1024:
        return f"{size_bytes} B"
    if size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    return f"{size_bytes / (1024 * 1024):.1f} MB"


def _serialize_document(row: dict[str, Any]) -> DocumentResponse:
    return DocumentResponse(
        id=row["id"],
        name=row["name"],
        pages=row.get("pages") or 0,
        uploadDate=row["created_at"],
        status=row["status"],
        size=_format_size(row.get("size_bytes") or 0),
        type=row["file_type"],
    )


def _detect_file_type(file: UploadFile) -> str:
    filename = (file.filename or "").replace("\\", "/").lower()
    for extension, file_type in EXTENSION_TYPES.items():
        if filename.endswith(extension):
            return file_type

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Unsupported file type. Upload PDF, DOCX, or TXT.",
    )


def _safe_filename(filename: str | None, file_type: str) -> str:
    value = PurePath((filename or "").replace("\\", "/")).name
    value = re.sub(r"[\x00-\x1f\x7f]", "", value).strip()
    if not value or len(value) > 255:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid document filename",
        )
    if not value.lower().endswith(f".{file_type}"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename extension does not match document type",
        )
    return value


def _process_and_store_document(
    file_bytes: bytes,
    file_type: str,
    user_id: str,
    document_id: str,
    name: str,
    content_type: str,
) -> dict[str, Any]:
    supabase = get_supabase()
    storage_path = f"{user_id}/{document_id}/{name}"
    supabase.storage.from_(settings.storage_bucket).upload(
        storage_path,
        file_bytes,
        {"content-type": content_type, "upsert": "false"},
    )
    chunks, page_count = process_document(file_bytes, file_type)
    insert_chunks(
        user_id=user_id,
        document_id=document_id,
        chunks=[
            {
                "content": chunk.content,
                "page_number": chunk.page_number,
                "section": chunk.section,
                "chunk_index": chunk.chunk_index,
            }
            for chunk in chunks
        ],
    )
    updated = (
        supabase.table("documents")
        .update({"status": "processed", "pages": page_count})
        .eq("id", document_id)
        .eq("user_id", user_id)
        .execute()
    ).data
    if not updated:
        raise RuntimeError("Document processing status could not be saved")
    return updated[0]


@router.get(
    "",
    response_model=list[DocumentResponse],
    summary="List documents",
    description="Return the authenticated user's documents, newest first.",
    responses={
        401: {"model": ErrorResponse, "description": "Missing or invalid bearer token"},
        502: {"model": ErrorResponse, "description": "Database service unavailable"},
        503: {"model": ErrorResponse, "description": "Backend configuration is missing"},
    },
)
async def list_documents(user: AuthUser = Depends(get_current_user)):
    supabase = get_supabase()
    response = (
        supabase.table("documents")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", desc=True)
        .execute()
    )
    return [_serialize_document(row) for row in response.data or []]


@router.post(
    "",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload and process a document",
    description=(
        "Upload a PDF, DOCX, or UTF-8 TXT file up to the configured size limit. "
        "The API extracts text, creates embeddings, and stores the document privately."
    ),
    responses={
        201: {"description": "Document uploaded and processed"},
        400: {"model": ErrorResponse, "description": "Empty file or unsupported type"},
        401: {"model": ErrorResponse, "description": "Missing or invalid bearer token"},
        413: {"model": ErrorResponse, "description": "Upload exceeds the file size limit"},
        422: {"model": ErrorResponse, "description": "File is unreadable or has invalid content"},
        502: {"model": ErrorResponse, "description": "Storage or processing service failed"},
    },
)
async def upload_document(
    file: UploadFile = File(...),
    user: AuthUser = Depends(get_current_user),
):
    file_type = _detect_file_type(file)
    document_name = _safe_filename(file.filename, file_type)
    file_bytes = await file.read(settings.max_upload_bytes + 1)
    if not file_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file")
    if len(file_bytes) > settings.max_upload_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds the {settings.max_upload_bytes // (1024 * 1024)} MB limit",
        )

    supabase = get_supabase()
    document_id = str(uuid.uuid4())

    document_row = {
        "id": document_id,
        "user_id": user.id,
        "name": document_name,
        "storage_path": f"{user.id}/{document_id}/{document_name}",
        "file_type": file_type,
        "size_bytes": len(file_bytes),
        "status": "processing",
        "pages": 0,
    }
    insert_response = supabase.table("documents").insert(document_row).execute()
    if not insert_response.data:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to save document metadata",
        )

    try:
        document = await run_in_threadpool(
            _process_and_store_document,
            file_bytes,
            file_type,
            user.id,
            document_id,
            document_name,
            ALLOWED_TYPES.get(file.content_type or "", "application/octet-stream"),
        )
    except ValueError as exc:
        _mark_failed(supabase, document_id, user.id)
        _cleanup_upload(supabase, document_row["storage_path"], document_id, user.id)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        logger.exception("Document upload failed for document %s", document_id)
        _mark_failed(supabase, document_id, user.id)
        _cleanup_upload(supabase, document_row["storage_path"], document_id, user.id)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Document processing failed",
        ) from exc

    try:
        supabase.table("usage_logs").insert(
            {
                "user_id": user.id,
                "event_type": "upload",
                "metadata": {"document_id": document_id, "size_bytes": len(file_bytes)},
            }
        ).execute()
    except Exception as exc:
        logger.exception("Could not record upload usage for document %s", document_id)

    return _serialize_document(document)


def _mark_failed(supabase: Any, document_id: str, user_id: str) -> None:
    try:
        supabase.table("documents").update({"status": "failed"}).eq(
            "id", document_id
        ).eq("user_id", user_id).execute()
    except Exception:
        logger.exception("Could not mark failed document %s", document_id)


def _cleanup_upload(
    supabase: Any,
    storage_path: str,
    document_id: str,
    user_id: str,
) -> None:
    try:
        delete_document_chunks(document_id, user_id)
        supabase.storage.from_(settings.storage_bucket).remove([storage_path])
    except Exception:
        logger.exception("Could not clean up failed document %s", document_id)


@router.patch(
    "/{document_id}",
    response_model=DocumentResponse,
    summary="Rename a document",
    description="Rename a document owned by the authenticated user.",
    responses={
        400: {"model": ErrorResponse, "description": "Name is empty"},
        401: {"model": ErrorResponse, "description": "Missing or invalid bearer token"},
        404: {"model": ErrorResponse, "description": "Document not found"},
    },
)
async def rename_document(
    document_id: str,
    payload: RenameDocumentRequest,
    user: AuthUser = Depends(get_current_user),
):
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Document name is required")

    supabase = get_supabase()
    updated = (
        supabase.table("documents")
        .update({"name": name})
        .eq("id", document_id)
        .eq("user_id", user.id)
        .execute()
    ).data
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    return _serialize_document(updated[0])


@router.get(
    "/{document_id}/download",
    response_model=DownloadLinkResponse,
    summary="Create a document download link",
    description="Return a short-lived signed URL for a document owned by the user.",
    responses={
        401: {"model": ErrorResponse, "description": "Missing or invalid bearer token"},
        404: {"model": ErrorResponse, "description": "Document not found"},
        500: {"model": ErrorResponse, "description": "Could not create signed URL"},
    },
)
async def download_document(
    document_id: str,
    user: AuthUser = Depends(get_current_user),
):
    supabase = get_supabase()
    document = (
        supabase.table("documents")
        .select("storage_path")
        .eq("id", document_id)
        .eq("user_id", user.id)
        .maybe_single()
        .execute()
    ).data
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    signed = supabase.storage.from_(settings.storage_bucket).create_signed_url(
        document["storage_path"], 300
    )
    if not signed or not signed.get("signedURL"):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create download link",
        )

    return {"url": signed["signedURL"]}


@router.delete(
    "/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a document",
    description="Delete the user's document, stored file, and associated vector chunks.",
    responses={
        204: {"description": "Document deleted"},
        401: {"model": ErrorResponse, "description": "Missing or invalid bearer token"},
        404: {"model": ErrorResponse, "description": "Document not found"},
    },
)
async def delete_document(document_id: str, user: AuthUser = Depends(get_current_user)):
    supabase = get_supabase()
    response = (
        supabase.table("documents")
        .select("*")
        .eq("id", document_id)
        .eq("user_id", user.id)
        .maybe_single()
        .execute()
    )
    document = response.data
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    supabase.storage.from_(settings.storage_bucket).remove([document["storage_path"]])
    delete_document_chunks(document_id, user.id)
    supabase.table("documents").delete().eq("id", document_id).eq(
        "user_id", user.id
    ).execute()
