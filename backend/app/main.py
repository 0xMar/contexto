from contextlib import asynccontextmanager
from typing import Dict
import os
import json

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from app.core.document_processor import process_document
from app.core.rag_chain import RAGChain
from app.core.dependencies import delete_vectorstore
from app.core.db import (
    init_db, get_history, save_message,
    create_session, get_sessions, update_session_title, delete_session,
)

rag_chain: RAGChain | None = None

MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_SIZE_MB", "10")) * 1024 * 1024
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")


@asynccontextmanager
async def lifespan(app: FastAPI):
    global rag_chain
    await init_db()
    rag_chain = RAGChain()
    yield


app = FastAPI(title="Contexto API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Content-Type"],
)


# Sessions
@app.get("/sessions")
async def list_sessions():
    return await get_sessions()


@app.post("/sessions")
async def new_session(body: Dict[str, str]):
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id is required")
    await create_session(session_id)
    return {"session_id": session_id}


@app.patch("/sessions/{session_id}")
async def rename_session(session_id: str, body: Dict[str, str]):
    title = body.get("title")
    if not title:
        raise HTTPException(status_code=400, detail="title is required")
    await update_session_title(session_id, title)
    return {"ok": True}


@app.delete("/sessions/{session_id}")
async def remove_session(session_id: str):
    delete_vectorstore(session_id)
    await delete_session(session_id)
    return {"ok": True}


# Upload
@app.post("/upload")
async def upload_file(file: UploadFile = File(...), session_id: str = Form(...)):
    content = await file.read()

    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds maximum size of {os.getenv('MAX_UPLOAD_SIZE_MB', '10')}MB"
        )

    extension = os.path.splitext(file.filename)[1].lower()
    if extension not in [".pdf", ".txt"]:
        raise HTTPException(status_code=400, detail="Only PDF and TXT files are supported")

    doc_id = await process_document(content, extension, file.filename, session_id)
    return {"message": "Document processed successfully", "doc_id": doc_id}


# Chat
@app.post("/chat")
async def chat(message: Dict[str, str]):
    if not message.get("text"):
        raise HTTPException(status_code=400, detail="Message text is required")
    if not message.get("session_id"):
        raise HTTPException(status_code=400, detail="session_id is required")
    if not rag_chain:
        raise HTTPException(status_code=503, detail="RAG Chain not initialized")

    session_id = message["session_id"]
    text = message["text"]

    history = await get_history(session_id)
    is_first_message = len(history) == 0

    await save_message(session_id, "user", text)

    # Auto-title on first message
    if is_first_message:
        title = text[:50].strip()
        await update_session_title(session_id, title)

    async def event_generator():
        full_text = ""
        async for chunk in rag_chain.generate_response(text, history, session_id):
            if chunk.startswith("__METADATA__"):
                # Pass metadata as a separate SSE event
                yield f"data: {chunk}\n\n"
            else:
                full_text += chunk
                yield f"data: {chunk}\n\n"
        
        await save_message(session_id, "assistant", full_text)
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.get("/history/{session_id}")
async def history(session_id: str):
    return await get_history(session_id)
