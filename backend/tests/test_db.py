import os
import tempfile
import pytest
import app.core.db as db_module
from app.core.db import (
    init_db, create_session, get_sessions,
    update_session_title, delete_session,
    save_message, get_history,
)


@pytest.fixture(autouse=True)
async def isolated_db(tmp_path, monkeypatch):
    db_file = str(tmp_path / "test.db")
    monkeypatch.setattr(db_module, "DB_PATH", db_file)
    await init_db()


async def test_create_session_basic():
    await create_session("s1")
    sessions = await get_sessions()
    assert any(s["session_id"] == "s1" for s in sessions)


async def test_create_session_default_title():
    await create_session("s2")
    sessions = await get_sessions()
    s = next(s for s in sessions if s["session_id"] == "s2")
    assert s["title"] == "New Chat"


async def test_create_session_idempotent():
    await create_session("s3")
    await create_session("s3")  # INSERT OR IGNORE — should not raise
    sessions = await get_sessions()
    assert sum(1 for s in sessions if s["session_id"] == "s3") == 1


async def test_get_sessions_ordering():
    await create_session("a")
    await create_session("b")
    sessions = await get_sessions()
    ids = [s["session_id"] for s in sessions]
    # b was created after a, so b should come first (DESC)
    assert ids.index("b") < ids.index("a")


async def test_update_session_title():
    await create_session("s4")
    await update_session_title("s4", "My Title")
    sessions = await get_sessions()
    s = next(s for s in sessions if s["session_id"] == "s4")
    assert s["title"] == "My Title"


async def test_delete_session_removes_session_and_messages():
    await create_session("s5")
    await save_message("s5", "user", "hello")
    await delete_session("s5")
    sessions = await get_sessions()
    assert not any(s["session_id"] == "s5" for s in sessions)
    history = await get_history("s5")
    assert history == []


async def test_save_and_get_history():
    await create_session("s6")
    await save_message("s6", "user", "hi")
    await save_message("s6", "assistant", "hello back")
    history = await get_history("s6")
    assert len(history) == 2
    assert history[0]["role"] == "user"
    assert history[0]["content"] == "hi"
    assert history[1]["role"] == "assistant"


async def test_get_history_empty():
    await create_session("s7")
    assert await get_history("s7") == []
