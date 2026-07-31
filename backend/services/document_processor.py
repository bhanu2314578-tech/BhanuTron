import io
import re
from dataclasses import dataclass
from typing import BinaryIO

from docx import Document as DocxDocument
from pypdf import PdfReader

from config import settings


@dataclass
class ProcessedChunk:
    content: str
    page_number: int | None
    section: str | None
    chunk_index: int


def _split_text(text: str) -> list[str]:
    cleaned = re.sub(r"\s+", " ", text).strip()
    if not cleaned:
        return []

    chunks: list[str] = []
    start = 0
    while start < len(cleaned):
        end = min(start + settings.chunk_size, len(cleaned))
        if end < len(cleaned):
            split_at = cleaned.rfind(" ", start, end)
            if split_at > start:
                end = split_at
        piece = cleaned[start:end].strip()
        if piece:
            chunks.append(piece)
        next_start = end - settings.chunk_overlap
        start = max(next_start, end) if next_start > start else end

    return chunks


def _to_processed_chunks(
    raw_chunks: list[tuple[str, int | None, str | None]],
) -> list[ProcessedChunk]:
    processed: list[ProcessedChunk] = []
    index = 0
    for content, page_number, section in raw_chunks:
        for piece in _split_text(content):
            processed.append(
                ProcessedChunk(
                    content=piece,
                    page_number=page_number,
                    section=section,
                    chunk_index=index,
                )
            )
            index += 1
    return processed


def extract_pdf(file_obj: BinaryIO) -> list[ProcessedChunk]:
    reader = PdfReader(file_obj)
    raw_chunks: list[tuple[str, int | None, str | None]] = []
    for page_index, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        if text.strip():
            raw_chunks.append((text, page_index, None))
    return _to_processed_chunks(raw_chunks)


def extract_docx(file_obj: BinaryIO) -> list[ProcessedChunk]:
    document = DocxDocument(file_obj)
    paragraphs = [paragraph.text.strip() for paragraph in document.paragraphs if paragraph.text.strip()]
    content = "\n".join(paragraphs)
    raw_chunks = [(content, None, "Document body")] if content else []
    return _to_processed_chunks(raw_chunks)


def extract_txt(file_obj: BinaryIO) -> list[ProcessedChunk]:
    content = file_obj.read().decode("utf-8", errors="ignore")
    raw_chunks = [(content, None, "Document body")] if content.strip() else []
    return _to_processed_chunks(raw_chunks)


def process_document(file_bytes: bytes, file_type: str) -> tuple[list[ProcessedChunk], int]:
    buffer = io.BytesIO(file_bytes)

    if file_type == "pdf":
        chunks = extract_pdf(buffer)
        page_count = max((chunk.page_number or 0 for chunk in chunks), default=0)
        return chunks, page_count
    if file_type == "docx":
        return extract_docx(buffer), 1
    if file_type == "txt":
        return extract_txt(buffer), 1

    raise ValueError(f"Unsupported file type: {file_type}")
