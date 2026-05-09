import os
import aiosqlite
from datetime import datetime

DB_PATH = os.getenv("DB_PATH", "./data/chat_history.db")


async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                session_id TEXT PRIMARY KEY,
                title TEXT NOT NULL DEFAULT 'New Chat',
                created_at TEXT NOT NULL
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                timestamp TEXT NOT NULL
            )
        """)
        await db.execute("CREATE INDEX IF NOT EXISTS idx_session ON conversations(session_id)")
        await db.commit()


async def create_session(session_id: str, title: str = "New Chat"):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT OR IGNORE INTO sessions (session_id, title, created_at) VALUES (?, ?, ?)",
            (session_id, title, datetime.utcnow().isoformat()),
        )
        await db.commit()


async def get_sessions() -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT session_id, title, created_at FROM sessions ORDER BY created_at DESC"
        ) as cursor:
            return [dict(row) for row in await cursor.fetchall()]


async def update_session_title(session_id: str, title: str):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "UPDATE sessions SET title = ? WHERE session_id = ?",
            (title, session_id),
        )
        await db.commit()


async def delete_session(session_id: str):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("DELETE FROM sessions WHERE session_id = ?", (session_id,))
        await db.execute("DELETE FROM conversations WHERE session_id = ?", (session_id,))
        await db.commit()


async def save_message(session_id: str, role: str, content: str):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO conversations (session_id, role, content, timestamp) VALUES (?, ?, ?, ?)",
            (session_id, role, content, datetime.utcnow().isoformat()),
        )
        await db.commit()


async def get_history(session_id: str) -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT role, content, timestamp FROM conversations WHERE session_id = ? ORDER BY id",
            (session_id,),
        ) as cursor:
            return [dict(row) for row in await cursor.fetchall()]
