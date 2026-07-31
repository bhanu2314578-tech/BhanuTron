from collections.abc import Iterator

from groq import Groq

from config import settings

SYSTEM_PROMPT = """You are BhanuTron, a helpful document assistant.
Answer using only the provided context. If the context is insufficient, say you do not know.
Cite relevant document names and page numbers when available.
Keep answers clear and concise."""


def build_prompt(question: str, chunks: list[dict]) -> str:
    if not chunks:
        context = "No relevant document context was retrieved."
    else:
        context_parts = []
        for index, chunk in enumerate(chunks, start=1):
            document_name = chunk.get("document_name") or "Unknown document"
            page_number = chunk.get("page_number")
            section = chunk.get("section")
            page_label = f"page {page_number}" if page_number else "page unknown"
            section_label = f", section {section}" if section else ""
            context_parts.append(
                f"[{index}] {document_name} ({page_label}{section_label})\n{chunk.get('content', '')}"
            )
        context = "\n\n".join(context_parts)

    return f"""Context:
{context}

Question:
{question}

Answer:"""


def estimate_tokens(text: str) -> int:
    return max(1, len(text.split()))


def stream_answer(question: str, chunks: list[dict]) -> Iterator[str]:
    client = Groq(api_key=settings.groq_api_key)
    prompt = build_prompt(question, chunks)

    stream = client.chat.completions.create(
        model=settings.groq_model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
        stream=True,
    )

    for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta
