# Spec: Backend Database Layer — Pagination for Sessions and History

## Domain
`app/core/db.py`

## ADDED Requirements

### Requirement: get_sessions_count

The system **SHALL** provide a `get_sessions_count()` async function that returns the total number of rows in the `sessions` table.

- **Signature:** `async def get_sessions_count() -> int`
- **Implementation:** Execute `SELECT COUNT(*) FROM sessions` and return the integer result.

#### Scenario: Empty database
- **GIVEN** no sessions exist in the database
- **WHEN** `get_sessions_count()` is called
- **THEN** it returns `0`

#### Scenario: Non-empty database
- **GIVEN** 3 sessions exist in the database
- **WHEN** `get_sessions_count()` is called
- **THEN** it returns `3`

---

### Requirement: get_history_count

The system **SHALL** provide a `get_history_count(session_id: str) -> int` async function that returns the total number of messages for a given session.

- **Signature:** `async def get_history_count(session_id: str) -> int`
- **Implementation:** Execute `SELECT COUNT(*) FROM conversations WHERE session_id = ?` and return the integer result.

#### Scenario: Empty session
- **GIVEN** session `"s1"` exists with no messages
- **WHEN** `get_history_count("s1")` is called
- **THEN** it returns `0`

#### Scenario: Non-empty session
- **GIVEN** session `"s1"` has 5 messages
- **WHEN** `get_history_count("s1")` is called
- **THEN** it returns `5`

#### Scenario: Non-existent session
- **GIVEN** session `"nonexistent"` does not exist
- **WHEN** `get_history_count("nonexistent")` is called
- **THEN** it returns `0`

---

### Requirement: Paginated get_sessions envelope

The system **SHALL** provide a `get_sessions()` function that accepts pagination parameters and returns an envelope object.

- **Signature:** `async def get_sessions(limit: int = 20, offset: int = 0) -> dict`
- **Return envelope shape:**
  ```json
  {
    "items": [{ "session_id": "...", "title": "...", "created_at": "..." }, ...],
    "total": 42,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
  ```
- **`items`**: List of session dicts, sorted by `created_at DESC`, limited to `limit` rows starting at `offset`.
- **`total`**: Total count from `COUNT(*)` on the sessions table.
- **`limit`**: Echo of the `limit` parameter received.
- **`offset`**: Echo of the `offset` parameter received.
- **`has_more`**: `True` if `offset + limit < total`, else `False`.

#### Scenario: Default pagination (first page)
- **GIVEN** 25 sessions exist in the database
- **WHEN** `get_sessions()` is called with no arguments
- **THEN** the result has `items` of length `20`
- **AND** `total` equals `25`
- **AND** `limit` equals `20`
- **AND** `offset` equals `0`
- **AND** `has_more` equals `True`

#### Scenario: Second page
- **GIVEN** 25 sessions exist in the database
- **WHEN** `get_sessions(limit=20, offset=20)` is called
- **THEN** the result has `items` of length `5`
- **AND** `total` equals `25`
- **AND** `has_more` equals `False`

#### Scenario: Empty database
- **GIVEN** no sessions exist
- **WHEN** `get_sessions()` is called
- **THEN** the result has `items` of length `0`
- **AND** `total` equals `0`
- **AND** `has_more` equals `False`

#### Scenario: limit=0
- **GIVEN** 5 sessions exist
- **WHEN** `get_sessions(limit=0)` is called
- **THEN** `items` is an empty list `[]`
- **AND** `total` equals `5`
- **AND** `has_more` equals `False`

#### Scenario: offset >= total
- **GIVEN** 3 sessions exist
- **WHEN** `get_sessions(offset=10)` is called
- **THEN** `items` is an empty list `[]`
- **AND** `has_more` equals `False`

#### Scenario: Custom limit (max 100)
- **GIVEN** 50 sessions exist
- **WHEN** `get_sessions(limit=10)` is called
- **THEN** `items` has length `10`
- **AND** `limit` in the response equals `10`

---

### Requirement: Paginated get_history envelope

The system **SHALL** provide a `get_history()` function that accepts pagination parameters and returns an envelope object.

- **Signature:** `async def get_history(session_id: str, limit: int = 50, offset: int = 0) -> dict`
- **Return envelope shape:**
  ```json
  {
    "items": [{ "role": "...", "content": "...", "timestamp": "..." }, ...],
    "total": 128,
    "limit": 50,
    "offset": 0,
    "has_more": true
  }
  ```
- **`items`**: List of message dicts, sorted by `id ASC`, limited to `limit` rows starting at `offset`.
- **`total`**: Total count from `COUNT(*)` on conversations WHERE session_id matches.
- **`limit`**: Echo of the `limit` parameter received.
- **`offset`**: Echo of the `offset` parameter received.
- **`has_more`**: `True` if `offset + limit < total`, else `False`.

#### Scenario: Default pagination (first page)
- **GIVEN** session `"s1"` has 55 messages
- **WHEN** `get_history("s1")` is called with no pagination params
- **THEN** `items` has length `50`
- **AND** `total` equals `55`
- **AND** `limit` equals `50`
- **AND** `offset` equals `0`
- **AND** `has_more` equals `True`

#### Scenario: Second page of history
- **GIVEN** session `"s1"` has 55 messages
- **WHEN** `get_history("s1", limit=50, offset=50)` is called
- **THEN** `items` has length `5`
- **AND** `total` equals `55`
- **AND** `has_more` equals `False`

#### Scenario: Empty session
- **GIVEN** session `"s1"` exists with no messages
- **WHEN** `get_history("s1")` is called
- **THEN** `items` is an empty list `[]`
- **AND** `total` equals `0`
- **AND** `has_more` equals `False`

#### Scenario: limit=0
- **GIVEN** session `"s1"` has 10 messages
- **WHEN** `get_history("s1", limit=0)` is called
- **THEN** `items` is `[]`
- **AND** `total` equals `10`
- **AND** `has_more` equals `False`

#### Scenario: offset >= total
- **GIVEN** session `"s1"` has 3 messages
- **WHEN** `get_history("s1", offset=10)` is called
- **THEN** `items` is `[]`
- **AND** `has_more` equals `False`

#### Scenario: Custom limit (max 200)
- **GIVEN** session `"s1"` has 100 messages
- **WHEN** `get_history("s1", limit=25)` is called
- **THEN** `items` has length `25`
- **AND** `limit` in the response equals `25`

---

## MODIFIED Requirements

### Requirement: get_sessions function signature and return type (previously: bare list)

**Previously:** `async def get_sessions() -> list[dict]` returning a flat list of session dicts.

**Now:** `async def get_sessions(limit: int = 20, offset: int = 0) -> dict` returning an envelope object with `items`, `total`, `limit`, `offset`, `has_more`.

- The original `SELECT` query **MUST** be augmented with `LIMIT ? OFFSET ?` clauses.
- A `SELECT COUNT(*) FROM sessions` query **MUST** be executed to populate `total`.
- The sorting order `ORDER BY created_at DESC` **MUST** be preserved.
- All existing callers (e.g., `main.py` route handler) **MUST** be updated to pass and handle the new envelope format.

#### Scenario: Backward-compatible default call
- **GIVEN** existing code calls `get_sessions()` with no arguments
- **WHEN** the function executes
- **THEN** it returns the first page (20 items) in envelope format without error

---

### Requirement: get_history function signature and return type (previously: bare list)

**Previously:** `async def get_history(session_id: str) -> list[dict]` returning a flat list of message dicts.

**Now:** `async def get_history(session_id: str, limit: int = 50, offset: int = 0) -> dict` returning an envelope object with `items`, `total`, `limit`, `offset`, `has_more`.

- The original `SELECT` query **MUST** be augmented with `LIMIT ? OFFSET ?` clauses.
- A `SELECT COUNT(*) FROM conversations WHERE session_id = ?` query **MUST** be executed to populate `total`.
- The sorting order `ORDER BY id ASC` (oldest first) **MUST** be preserved.
- All existing callers (e.g., `main.py` route handler, `main.py` chat endpoint) **MUST** be updated. The chat endpoint **SHOULD** call `get_history(session_id)` without pagination params to retrieve all messages for RAG context (defaults handle this, but the chat handler must unwrap the envelope to extract `items`).

#### Scenario: Chat endpoint retrieves full history for RAG
- **GIVEN** the `POST /chat` handler needs the complete message history for RAG context
- **WHEN** it calls `get_history(session_id)` (no pagination arguments)
- **THEN** the envelope is returned and the handler extracts the `items` field for use as `history`
- **AND** all messages are available for RAG processing