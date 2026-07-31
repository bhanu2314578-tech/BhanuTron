from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel

from routers.auth import AuthUser, get_current_user
from services.document_processor import process_document
from services.supabase_client import get_supabase
from services.vector_db import delete_document_chunks, insert_chunks

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


def _format_size(size_bytes: int) -> str:
    if size_bytes < 1024:
        return f"{size_bytes} B"
    if size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    return f"{size_bytes / (1024 * 1024):.1f} MB"


def _serialize_document(row: dict) -> DocumentResponse:
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
    if file.content_type in ALLOWED_TYPES:
        return ALLOWED_TYPES[file.content_type]

    filename = (file.filename or "").lower()
    for extension, file_type in EXTENSION_TYPES.items():
        if filename.endswith(extension):
            return file_type

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Unsupported file type. Upload PDF, DOCX, or TXT.",
    )


@router.get("", response_model=list[DocumentResponse])
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


@router.post("", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    user: AuthUser = Depends(get_current_user),
):
    file_type = _detect_file_type(file)
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file")

    supabase = get_supabase()
    document_name = file.filename or f"document.{file_type}"
    storage_path = f"{user.id}/{document_name}"

    document_row = {
        "user_id": user.id,
        "name": document_name,
        "storage_path": storage_path,
        "file_type": file_type,
        "size_bytes": len(file_bytes),
        "status": "processing",
        "pages": 0,
    }
    insert_response = supabase.table("documents").insert(document_row).execute()
    document = insert_response.data[0]
    document_id = document["id"]

    try:
        supabase.storage.from_("documents").upload(
            storage_path,
            file_bytes,
            {"content-type": file.content_type or "application/octet-stream", "upsert": "true"},
        )

        chunks, page_count = process_document(file_bytes, file_type)
        insert_chunks(
            user_id=user.id,
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

        update_response = (
            supabase.table("documents")
            .update({"status": "processed", "pages": page_count})
            .eq("id", document_id)
            .execute()
        )
        document = update_response.data[0]

        supabase.table("usage_logs").insert(
            {
                "user_id": user.id,
                "event_type": "upload",
                "metadata": {"document_id": document_id, "size_bytes": len(file_bytes)},
            }
        ).execute()
    except Exception as exc:
        supabase.table("documents").update({"status": "failed"}).eq("id", document_id).execute()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process document: {exc}",
        ) from exc

    return _serialize_document(document)


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
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

    delete_document_chunks(document_id)
    supabase.storage.from_("documents").remove([document["storage_path"]])
    supabase.table("documents").delete().eq("id", document_id).execute()
