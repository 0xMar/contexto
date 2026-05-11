"""Tests for SSE error propagation in the /chat endpoint."""
import json
import os
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from httpx import AsyncClient, ASGITransport

os.environ.setdefault("GOOGLE_API_KEY", "test-key")

import app.main as main_module
from app.main import app


@pytest.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


@pytest.fixture(autouse=True)
def mock_db(monkeypatch):
    monkeypatch.setattr(main_module, "get_sessions", AsyncMock(return_value={
        "items": [], "total": 0, "limit": 20, "offset": 0, "has_more": False
    }))
    monkeypatch.setattr(main_module, "create_session", AsyncMock())
    monkeypatch.setattr(main_module, "update_session_title", AsyncMock())
    monkeypatch.setattr(main_module, "delete_session", AsyncMock())
    monkeypatch.setattr(main_module, "get_history", AsyncMock(return_value={
        "items": [], "total": 0, "limit": 50, "offset": 0, "has_more": False
    }))
    monkeypatch.setattr(main_module, "save_message", AsyncMock())


async def test_chat_sse_error_event_on_gemini_failure(client, monkeypatch):
    """When generate_response raises, the stream yields event: error."""
    async def failing_generate(query, history, session_id):
        raise RuntimeError("Gemini quota exceeded")
        yield  # make it an async generator

    fake = MagicMock()
    fake.generate_response = failing_generate
    monkeypatch.setattr(main_module, "rag_chain", fake)

    resp = await client.post("/chat", json={"text": "hi", "session_id": "s1"})
    assert resp.status_code == 200
    body = resp.text
    assert "event: error" in body
    assert "Gemini quota exceeded" in body


async def test_chat_sse_error_does_not_save_message(client, monkeypatch):
    """On error, the assistant message is NOT saved to history."""
    async def failing_generate(query, history, session_id):
        raise RuntimeError("timeout")
        yield

    fake = MagicMock()
    fake.generate_response = failing_generate
    monkeypatch.setattr(main_module, "rag_chain", fake)

    await client.post("/chat", json={"text": "hi", "session_id": "s1"})

    # save_message should only be called once (for the user message), not twice
    assert main_module.save_message.call_count == 1  # type: ignore[attr-defined]
