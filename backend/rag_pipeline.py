"""
RAG pipeline: document ingestion, vector store management, and retrieval.
"""
import os
import uuid
from pathlib import Path
from typing import List

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import (
    TextLoader,
    PyPDFLoader,
    Docx2txtLoader,
    BSHTMLLoader,
)
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_core.documents import Document

from config import get_settings

settings = get_settings()

# ---------------------------------------------------------------------------
# Embeddings — use a lightweight local model so no extra API calls are needed
# ---------------------------------------------------------------------------
_EMBED_MODEL = "sentence-transformers/all-MiniLM-L6-v2"

def _get_embeddings() -> HuggingFaceEmbeddings:
    return HuggingFaceEmbeddings(
        model_name=_EMBED_MODEL,
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True},
    )


def _get_vector_store() -> Chroma:
    """Return (or create) the persistent Chroma vector store."""
    return Chroma(
        collection_name="recipes",
        embedding_function=_get_embeddings(),
        persist_directory=settings.chroma_persist_dir,
    )


# ---------------------------------------------------------------------------
# Document loading helpers
# ---------------------------------------------------------------------------
def _load_document(file_path: str) -> List[Document]:
    ext = Path(file_path).suffix.lower()
    if ext == ".pdf":
        loader = PyPDFLoader(file_path)
    elif ext in (".docx", ".doc"):
        loader = Docx2txtLoader(file_path)
    elif ext in (".html", ".htm"):
        loader = BSHTMLLoader(file_path)
    else:
        loader = TextLoader(file_path, encoding="utf-8")
    return loader.load()


def ingest_file(file_path: str, source_name: str | None = None) -> int:
    """
    Load a file, chunk it, and upsert into the vector store.
    Returns the number of chunks stored.
    """
    raw_docs = _load_document(file_path)
    source_label = source_name or Path(file_path).name

    # Tag each document with its source
    for doc in raw_docs:
        doc.metadata.setdefault("source", source_label)
        doc.metadata.setdefault("doc_id", str(uuid.uuid4()))

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    chunks = splitter.split_documents(raw_docs)

    store = _get_vector_store()
    store.add_documents(chunks)
    store.persist()
    return len(chunks)


def ingest_text(text: str, source_name: str = "user_upload") -> int:
    """Ingest raw text directly (e.g. pasted recipe notes)."""
    doc = Document(
        page_content=text,
        metadata={"source": source_name, "doc_id": str(uuid.uuid4())},
    )
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
    )
    chunks = splitter.split_documents([doc])
    store = _get_vector_store()
    store.add_documents(chunks)
    store.persist()
    return len(chunks)


def retrieve_relevant_chunks(query: str, k: int | None = None) -> List[Document]:
    """Semantic search — returns the most relevant recipe chunks."""
    store = _get_vector_store()
    k = k or settings.top_k_retrieval
    return store.similarity_search(query, k=k)


def list_ingested_sources() -> List[str]:
    """Return unique source names that have been ingested."""
    store = _get_vector_store()
    try:
        data = store.get()
        sources = {
            meta.get("source", "unknown")
            for meta in data.get("metadatas", [])
        }
        return sorted(sources)
    except Exception:
        return []


def delete_source(source_name: str) -> int:
    """Delete all chunks belonging to a given source. Returns deleted count."""
    store = _get_vector_store()
    try:
        data = store.get()
        ids_to_delete = [
            id_
            for id_, meta in zip(data["ids"], data["metadatas"])
            if meta.get("source") == source_name
        ]
        if ids_to_delete:
            store.delete(ids=ids_to_delete)
            store.persist()
        return len(ids_to_delete)
    except Exception:
        return 0
