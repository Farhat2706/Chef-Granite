"""
FastAPI application — Recipe RAG Agent API.
"""
from __future__ import annotations

import os
import shutil
import tempfile
from pathlib import Path
from typing import Any

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agent import get_agent
from rag_pipeline import (
    delete_source,
    ingest_file,
    ingest_text,
    list_ingested_sources,
    retrieve_relevant_chunks,
)

# ---------------------------------------------------------------------------
# App bootstrap
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Recipe RAG Agent API",
    description="Document Q&A RAG Agent powered by IBM Granite + LangChain",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_EXTENSIONS = {".pdf", ".txt", ".docx", ".doc", ".html", ".htm"}

# ---------------------------------------------------------------------------
# Pre-load sample recipes on startup
# ---------------------------------------------------------------------------
@app.on_event("startup")
async def startup_event():
    sample_dir = Path("../sample_recipes")
    if sample_dir.exists():
        existing = set(list_ingested_sources())
        for recipe_file in sample_dir.glob("*.*"):
            if recipe_file.suffix.lower() in ALLOWED_EXTENSIONS:
                if recipe_file.name not in existing:
                    try:
                        ingest_file(str(recipe_file), recipe_file.name)
                        print(f"[startup] Ingested: {recipe_file.name}")
                    except Exception as e:
                        print(f"[startup] Failed to ingest {recipe_file.name}: {e}")


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------
class ChatRequest(BaseModel):
    question: str
    history: list[dict[str, str]] = []
    top_k: int = 5


class ChatResponse(BaseModel):
    answer: str
    steps: list[str]
    substitutions: list[str]
    shopping_list: list[str]
    nutrition: dict[str, Any]
    sources: list[str]
    demo_mode: bool


class IngestTextRequest(BaseModel):
    text: str
    source_name: str = "pasted_recipe"


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/")
def root():
    return {"message": "Chef Granite Recipe RAG Agent is running! 🍳"}


@app.get("/health")
def health():
    agent = get_agent()
    sources = list_ingested_sources()
    return {
        "status": "ok",
        "demo_mode": agent.demo_mode,
        "ingested_sources": len(sources),
        "model": "ibm/granite-13b-chat-v2" if not agent.demo_mode else "demo",
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    try:
        docs = retrieve_relevant_chunks(req.question, k=req.top_k)
        agent = get_agent()
        result = agent.answer(req.question, docs, req.history)
        return ChatResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ingest/file")
async def ingest_file_endpoint(file: UploadFile = File(...)):
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name

        count = ingest_file(tmp_path, file.filename or "uploaded_file")
        return {"message": f"Ingested '{file.filename}' successfully.", "chunks": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


@app.post("/ingest/text")
async def ingest_text_endpoint(req: IngestTextRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
    try:
        count = ingest_text(req.text, req.source_name)
        return {"message": f"Ingested text as '{req.source_name}'.", "chunks": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/sources")
def get_sources():
    return {"sources": list_ingested_sources()}


@app.delete("/sources/{source_name}")
def remove_source(source_name: str):
    deleted = delete_source(source_name)
    if deleted == 0:
        raise HTTPException(status_code=404, detail=f"Source '{source_name}' not found.")
    return {"message": f"Deleted {deleted} chunks from '{source_name}'."}
