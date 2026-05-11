import json
import os
import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from httpx import AsyncClient, ASGITransport

os.environ.setdefault("GOOGLE_API_KEY", "test-key")
os.environ.setdefault("DB_PATH", ":memory:")

import app.main as main_module
from app.main import app


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


@pytest.fixture(autouse=True)
def mock_db(monkeypatch):
    """Replace all db functions used in main with async mocks."""
    monkeypatch.setattr(main_module, "get_sessions", AsyncMock(return_value=[]))
    monkeypatch.setattr(main_module, "create_session", AsyncMock())
    monkeypatch.setattr(main_module, "update_session_title", AsyncMock())
    monkeypatch.setattr(main_module, "delete_session", AsyncMock())
    monkeypatch.setattr(main_module, "get_history", AsyncMock(return_value=[]))
    monkeypatch.setattr(main_module, "save_message", AsyncMock())


@pytest.fixture(autouse=True)
def mock_rag(monkeypatch):
    """Inject a fake RAGChain into app.main.rag_chain."""
    async def fake_generate(query, history, session_id):
        yield "message", "Hello"
        yield "message", " world"
        yield "metadata", json.dumps({"sources": []})

    fake = MagicMock()
    fake.generate_response = fake_generate
    monkeypatch.setattr(main_module, "rag_chain", fake)


# ── Sessions ──────────────────────────────────────────────────────────────────

async def test_list_sessions(client):
    resp = await client.get("/sessions")
    assert resp.status_code == 200
    assert resp.json() == []


async def test_create_session(client):
    resp = await client.post("/sessions", json={"session_id": "abc"})
    assert resp.status_code == 200
    assert resp.json() == {"session_id": "abc"}


async def test_create_session_missing_id(client):
    resp = await client.post("/sessions", json={})
    assert resp.status_code == 400


async def test_rename_session(client):
    resp = await client.patch("/sessions/abc", json={"title": "New Title"})
    assert resp.status_code == 200
    assert resp.json() == {"ok": True}


async def test_rename_session_missing_title(client):
    resp = await client.patch("/sessions/abc", json={})
    assert resp.status_code == 400


async def test_delete_session(client):
    resp = await client.delete("/sessions/abc")
    assert resp.status_code == 200
    assert resp.json() == {"ok": True}


# ── Upload ────────────────────────────────────────────────────────────────────

async def test_upload_txt_success(client):
    with patch("app.main.process_document", new=AsyncMock(return_value="doc.txt")):
        resp = await client.post(
            "/upload",
            files={"file": ("doc.txt", b"hello", "text/plain")},
            data={"session_id": "s1"},
        )
    assert resp.status_code == 200
    assert resp.json()["doc_id"] == "doc.txt"


async def test_upload_unsupported_extension(client):
    resp = await client.post(
        "/upload",
        files={"file": ("virus.exe", b"bad", "application/octet-stream")},
        data={"session_id": "s1"},
    )
    assert resp.status_code == 400


async def test_upload_size_exceeded(client, monkeypatch):
    monkeypatch.setattr(main_module, "MAX_UPLOAD_BYTES", 5)
    resp = await client.post(
        "/upload",
        files={"file": ("big.txt", b"x" * 10, "text/plain")},
        data={"session_id": "s1"},
    )
    assert resp.status_code == 413


# ── Chat ──────────────────────────────────────────────────────────────────────

async def test_chat_missing_text(client):
    resp = await client.post("/chat", json={"session_id": "s1"})
    assert resp.status_code == 400


async def test_chat_missing_session_id(client):
    resp = await client.post("/chat", json={"text": "hi"})
    assert resp.status_code == 400


async def test_chat_streams_response(client):
    resp = await client.post("/chat", json={"text": "hi", "session_id": "s1"})
    assert resp.status_code == 200
    body = resp.text
    assert "Hello" in body
    assert "world" in body
    assert "event: metadata" in body
    assert "event: done" in body


async def test_chat_auto_titles_first_message(client):
    main_module.get_history.return_value = []  # type: ignore[attr-defined]
    await client.post("/chat", json={"text": "What is RAG?", "session_id": "s1"})
    main_module.update_session_title.assert_called_with("s1", "What is RAG?")  # type: ignore[attr-defined]


# ── History ───────────────────────────────────────────────────────────────────

async def test_get_history_empty(client):
    resp = await client.get("/history/s1")
    assert resp.status_code == 200
    assert resp.json() == []


async def test_get_history_populated(client):
    main_module.get_history.return_value = [  # type: ignore[attr-defined]
        {"role": "user", "content": "hi", "timestamp": "2024-01-01T00:00:00"}
    ]
    resp = await client.get("/history/s1")
    assert resp.status_code == 200
    assert resp.json()[0]["role"] == "user"


# ── RAGChain unit ─────────────────────────────────────────────────────────────

async def test_rag_chain_yields_chunks_and_metadata():
    from app.core.rag_chain import RAGChain

    chain = RAGChain.__new__(RAGChain)

    mock_doc = MagicMock()
    mock_doc.page_content = "relevant content"
    mock_doc.metadata = {"source": "/docs/file.pdf", "page": 3}

    async def fake_astream(_):
        yield "Answer"
        yield " here"

    mock_retriever = MagicMock()
    mock_retriever.ainvoke = AsyncMock(return_value=[mock_doc])

    mock_vs = MagicMock()
    mock_vs.as_retriever.return_value = mock_retriever

    chain.chain = MagicMock()
    chain.chain.astream = fake_astream

    with patch("app.core.rag_chain.get_vectorstore", return_value=mock_vs):
        chunks = []
        async for event, data in chain.generate_response("q", [], "s1"):
            chunks.append((event, data))

    assert chunks[0] == ("message", "Answer")
    assert chunks[1] == ("message", " here")
    event, data = chunks[2]
    assert event == "metadata"
    sources = json.loads(data)["sources"]
    assert sources[0]["source"] == "file.pdf"
    assert sources[0]["page"] == 3


async def test_rag_chain_converts_history_to_messages():
    from app.core.rag_chain import RAGChain
    from langchain_core.messages import HumanMessage, AIMessage

    chain = RAGChain.__new__(RAGChain)

    mock_retriever = MagicMock()
    mock_retriever.ainvoke = AsyncMock(return_value=[])

    mock_vs = MagicMock()
    mock_vs.as_retriever.return_value = mock_retriever

    captured = {}

    async def fake_astream(inputs):
        captured["chat_history"] = inputs["chat_history"]
        yield "ok"

    chain.chain = MagicMock()
    chain.chain.astream = fake_astream

    history = [
        {"role": "user", "content": "hello"},
        {"role": "assistant", "content": "hi"},
    ]

    with patch("app.core.rag_chain.get_vectorstore", return_value=mock_vs):
        async for _ in chain.generate_response("q", history, "s1"):
            pass

    msgs = captured["chat_history"]
    assert isinstance(msgs[0], HumanMessage)
    assert isinstance(msgs[1], AIMessage)
