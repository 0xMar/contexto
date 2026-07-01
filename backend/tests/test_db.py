"""Direct unit tests for app.core.db — runs against real SQLite via tmp_path."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("GOOGLE_API_KEY", "test-key")

import pytest
from unittest.mock import patch
import app.core.db as db_module
from app.core.db import (
    init_db,
    create_session,
    get_sessions,
    get_sessions_count,
    save_message,
    get_history,
    get_history_count,
    update_session_title,
    delete_session,
)


@pytest.fixture(autouse=True)
async def fresh_db(tmp_path):
    """Point db.DB_PATH to a fresh temp file and run init_db."""
    db_path = str(tmp_path / "test.db")
    original = db_module.DB_PATH
    db_module.DB_PATH = db_path
    await init_db()
    yield
    db_module.DB_PATH = original


# ── get_sessions_count ────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_sessions_count_empty():
    assert await get_sessions_count() == 0


@pytest.mark.asyncio
async def test_get_sessions_count_with_sessions():
    await create_session("s1")
    await create_session("s2")
    await create_session("s3")
    assert await get_sessions_count() == 3


# ── get_history_count ─────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_history_count_empty_session():
    await create_session("s1")
    assert await get_history_count("s1") == 0


@pytest.mark.asyncio
async def test_get_history_count_with_messages():
    await create_session("s1")
    await save_message("s1", "user", "hello")
    await save_message("s1", "assistant", "hi")
    await save_message("s1", "user", "how are you?")
    assert await get_history_count("s1") == 3


@pytest.mark.asyncio
async def test_get_history_count_nonexistent_session():
    assert await get_history_count("ghost") == 0


@pytest.mark.asyncio
async def test_get_history_count_different_sessions_isolated():
    await create_session("s1")
    await create_session("s2")
    await save_message("s1", "user", "msg1")
    await save_message("s1", "assistant", "msg2")
    await save_message("s2", "user", "msg3")
    assert await get_history_count("s1") == 2
    assert await get_history_count("s2") == 1


# ── get_sessions (paginated) ─────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_sessions_default_pagination_empty():
    result = await get_sessions()
    assert result["items"] == []
    assert result["total"] == 0
    assert result["limit"] == 20
    assert result["offset"] == 0
    assert result["has_more"] is False


@pytest.mark.asyncio
async def test_get_sessions_default_first_page():
    for i in range(25):
        await create_session(f"sess-{i:03d}", f"Session {i:03d}")

    result = await get_sessions()
    assert len(result["items"]) == 20
    assert result["total"] == 25
    assert result["limit"] == 20
    assert result["offset"] == 0
    assert result["has_more"] is True


@pytest.mark.asyncio
async def test_get_sessions_second_page():
    for i in range(25):
        await create_session(f"sess-{i:03d}", f"Session {i:03d}")

    result = await get_sessions(limit=20, offset=20)
    assert len(result["items"]) == 5
    assert result["total"] == 25
    assert result["offset"] == 20
    assert result["has_more"] is False


@pytest.mark.asyncio
async def test_get_sessions_custom_limit():
    for i in range(10):
        await create_session(f"sess-{i}", f"Sess {i}")

    result = await get_sessions(limit=3)
    assert len(result["items"]) == 3
    assert result["total"] == 10
    assert result["limit"] == 3
    assert result["has_more"] is True


@pytest.mark.asyncio
async def test_get_sessions_limit_zero():
    for i in range(5):
        await create_session(f"sess-{i}")

    result = await get_sessions(limit=0)
    assert result["items"] == []
    assert result["total"] == 5
    assert result["has_more"] is False


@pytest.mark.asyncio
async def test_get_sessions_offset_beyond_total():
    for i in range(3):
        await create_session(f"sess-{i}")

    result = await get_sessions(offset=100)
    assert result["items"] == []
    assert result["total"] == 3
    assert result["has_more"] is False


@pytest.mark.asyncio
async def test_get_sessions_exact_page_boundary():
    for i in range(40):
        await create_session(f"sess-{i}")

    result = await get_sessions(limit=20, offset=20)
    assert len(result["items"]) == 20
    assert result["total"] == 40
    assert result["has_more"] is False


@pytest.mark.asyncio
async def test_get_sessions_sort_order_newest_first():
    await create_session("old", "Old Session")
    await create_session("mid", "Mid Session")
    await create_session("new", "New Session")

    result = await get_sessions(limit=10, offset=0)
    titles = [item["title"] for item in result["items"]]
    assert titles == ["New Session", "Mid Session", "Old Session"]


# ── get_history (paginated) ──────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_history_empty_session():
    await create_session("s1")
    result = await get_history("s1")
    assert result["items"] == []
    assert result["total"] == 0
    assert result["limit"] == 50
    assert result["offset"] == 0
    assert result["has_more"] is False


@pytest.mark.asyncio
async def test_get_history_first_page():
    await create_session("s1")
    for i in range(55):
        await save_message("s1", "user", f"msg-{i:03d}")

    result = await get_history("s1")
    assert len(result["items"]) == 50
    assert result["total"] == 55
    assert result["offset"] == 0
    assert result["has_more"] is True


@pytest.mark.asyncio
async def test_get_history_second_page():
    await create_session("s1")
    for i in range(55):
        await save_message("s1", "user", f"msg-{i:03d}")

    result = await get_history("s1", limit=50, offset=50)
    assert len(result["items"]) == 5
    assert result["total"] == 55
    assert result["offset"] == 50
    assert result["has_more"] is False


@pytest.mark.asyncio
async def test_get_history_sort_order_oldest_first():
    await create_session("s1")
    await save_message("s1", "user", "first")
    await save_message("s1", "user", "second")
    await save_message("s1", "user", "third")

    result = await get_history("s1", limit=10, offset=0)
    contents = [item["content"] for item in result["items"]]
    assert contents == ["first", "second", "third"]


@pytest.mark.asyncio
async def test_get_history_pagination_preserves_order():
    """Second page of messages must contain the correct older messages."""
    await create_session("s1")
    for i in range(10):
        await save_message("s1", "user", f"msg-{i:03d}")

    # Get first 5 (oldest)
    page1 = await get_history("s1", limit=5, offset=0)
    assert [m["content"] for m in page1["items"]] == [
        "msg-000", "msg-001", "msg-002", "msg-003", "msg-004"
    ]

    # Get next 5
    page2 = await get_history("s1", limit=5, offset=5)
    assert [m["content"] for m in page2["items"]] == [
        "msg-005", "msg-006", "msg-007", "msg-008", "msg-009"
    ]


@pytest.mark.asyncio
async def test_get_history_limit_zero():
    await create_session("s1")
    await save_message("s1", "user", "hello")

    result = await get_history("s1", limit=0)
    assert result["items"] == []
    assert result["total"] == 1
    assert result["has_more"] is False


@pytest.mark.asyncio
async def test_get_history_offset_beyond_total():
    await create_session("s1")
    await save_message("s1", "user", "hello")

    result = await get_history("s1", offset=100)
    assert result["items"] == []
    assert result["has_more"] is False


@pytest.mark.asyncio
async def test_get_history_nonexistent_session():
    result = await get_history("ghost")
    assert result["items"] == []
    assert result["total"] == 0
    assert result["has_more"] is False


@pytest.mark.asyncio
async def test_get_history_mixed_roles_preserved():
    await create_session("s1")
    await save_message("s1", "user", "question")
    await save_message("s1", "assistant", "answer")
    await save_message("s1", "user", "follow-up")

    result = await get_history("s1")
    roles = [m["role"] for m in result["items"]]
    assert roles == ["user", "assistant", "user"]


# ── update_session_title ─────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_update_session_title():
    await create_session("s1", "Old Title")
    await update_session_title("s1", "New Title")

    result = await get_sessions()
    assert result["items"][0]["title"] == "New Title"


@pytest.mark.asyncio
async def test_update_session_title_upsert():
    """Updating title for a session_id that doesn't exist should not raise,
    but no row is inserted (UPDATE, not INSERT)."""
    await update_session_title("new-session", "Fresh Title")
    result = await get_sessions()
    # Pure UPDATE doesn't insert — no session should appear
    assert not any(s["session_id"] == "new-session" for s in result["items"])


# ── delete_session ────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_delete_session_removes_from_sessions():
    await create_session("s1")
    await create_session("s2")
    await delete_session("s1")

    result = await get_sessions()
    assert result["total"] == 1
    assert result["items"][0]["session_id"] == "s2"


@pytest.mark.asyncio
async def test_delete_session_removes_messages():
    await create_session("s1")
    await save_message("s1", "user", "hello")
    await save_message("s1", "assistant", "hi")
    await delete_session("s1")

    result = await get_history("s1")
    assert result["items"] == []
    assert result["total"] == 0


# ── save_message ──────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_save_message_preserves_role_and_content():
    await create_session("s1")
    await save_message("s1", "user", "my question")
    await save_message("s1", "assistant", "my answer")

    result = await get_history("s1")
    assert result["total"] == 2
    assert result["items"][0] == {
        "role": "user",
        "content": "my question",
        "timestamp": result["items"][0]["timestamp"],
    }
    assert result["items"][1]["role"] == "assistant"


@pytest.mark.asyncio
async def test_save_message_multiple_in_same_session():
    await create_session("s1")
    await save_message("s1", "user", "msg1")
    await save_message("s1", "assistant", "msg2")
    await save_message("s1", "user", "msg3")

    result = await get_history("s1")
    assert result["total"] == 3
    roles = [m["role"] for m in result["items"]]
    assert roles == ["user", "assistant", "user"]