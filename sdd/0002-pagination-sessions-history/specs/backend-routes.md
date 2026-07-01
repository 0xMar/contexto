# Spec: Backend API Route Handlers — Pagination Query Parameters

## Domain
`app/main.py`

---

## MODIFIED Requirements

### Requirement: GET /sessions — accept pagination query parameters

**Previously:** `GET /sessions` returned a bare JSON array of all sessions.

**Now:** `GET /sessions` accepts optional `limit` and `offset` query parameters and returns a paginated envelope.

- **Query parameters:**
  | Param | Type | Default | Max |
  |-------|------|---------|-----|
  | `limit` | integer | 20 | 100 |
  | `offset` | integer | 0 | — |

- **Response (200):**
  ```json
  {
    "items": [{ "session_id": "...", "title": "...", "created_at": "..." }],
    "total": 42,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
  ```

- If `limit` exceeds 100, it **MUST** be capped at 100.
- If `limit` or `offset` is negative, the handler **MUST** return `400 Bad Request`.
- If `limit` or `offset` is not an integer, the handler **MUST** return `400 Bad Request`.
- The handler **MUST** pass `limit` and `offset` to `get_sessions(limit, offset)`.

#### Scenario: Default request (no query params)
- **GIVEN** 25 sessions exist
- **WHEN** `GET /sessions` is requested with no query params
- **THEN** response status is `200`
- **AND** the response body has `items` with at most 20 entries
- **AND** the response body has `total: 25`, `limit: 20`, `offset: 0`, `has_more: true`

#### Scenario: Custom limit
- **WHEN** `GET /sessions?limit=5` is requested
- **THEN** response `items` has length `5`
- **AND** response `limit` is `5`

#### Scenario: Pagination with offset
- **WHEN** `GET /sessions?limit=10&offset=10` is requested
- **THEN** response has `offset: 10`
- **AND** response `items` has at most 10 entries

#### Scenario: Limit exceeds maximum
- **WHEN** `GET /sessions?limit=200` is requested
- **THEN** the effective limit is capped at `100`
- **AND** response `limit` is `100`

#### Scenario: Negative offset
- **WHEN** `GET /sessions?offset=-1` is requested
- **THEN** response status is `400`

#### Scenario: Non-integer limit
- **WHEN** `GET /sessions?limit=abc` is requested
- **THEN** response status is `400`

---

### Requirement: GET /history/{session_id} — accept pagination query parameters

**Previously:** `GET /history/{session_id}` returned a bare JSON array of all messages.

**Now:** `GET /history/{session_id}` accepts optional `limit` and `offset` query parameters and returns a paginated envelope.

- **Query parameters:**
  | Param | Type | Default | Max |
  |-------|------|---------|-----|
  | `limit` | integer | 50 | 200 |
  | `offset` | integer | 0 | — |

- **Response (200):**
  ```json
  {
    "items": [{ "role": "...", "content": "...", "timestamp": "..." }],
    "total": 128,
    "limit": 50,
    "offset": 0,
    "has_more": true
  }
  ```

- If `limit` exceeds 200, it **MUST** be capped at 200.
- If `limit` or `offset` is negative, the handler **MUST** return `400 Bad Request`.
- If `limit` or `offset` is not an integer, the handler **MUST** return `400 Bad Request`.
- The handler **MUST** pass `limit` and `offset` to `get_history(session_id, limit, offset)`.

#### Scenario: Default request
- **GIVEN** session `"s1"` has 60 messages
- **WHEN** `GET /history/s1` is requested with no query params
- **THEN** response status is `200`
- **AND** response `items` has at most 50 entries
- **AND** response `total: 60`, `has_more: true`

#### Scenario: Load all messages in one request
- **WHEN** `GET /history/s1?limit=200` is requested
- **THEN** all messages up to the max limit are returned

#### Scenario: Pagination with offset
- **WHEN** `GET /history/s1?limit=50&offset=50` is requested
- **THEN** response `offset` is `50`
- **AND** remaining messages are returned

#### Scenario: Non-integer offset
- **WHEN** `GET /history/s1?offset=abc` is requested
- **THEN** response status is `400`

#### Scenario: Session with no messages
- **GIVEN** session `"empty"` has no messages
- **WHEN** `GET /history/empty` is requested
- **THEN** response status is `200`
- **AND** response `items` is `[]`, `total` is `0`, `has_more` is `false`

---

### Requirement: POST /chat — internal get_history call for RAG

The `POST /chat` handler internally calls `get_history(session_id)` to retrieve conversation context for the RAG chain. This call uses the **default** pagination parameters (limit=50). The handler **MUST** extract only the `items` array from the envelope before passing to the RAG chain.

> **Note:** For the initial pagination implementation, the chat endpoint uses the first page (50 most recent messages) as RAG context. A future enhancement may load all history when needed.

#### Scenario: Chat handler extracts items from envelope
- **GIVEN** `get_history` returns `{"items": [...], "total": 50, "limit": 50, "offset": 0, "has_more": false}`
- **WHEN** the chat handler calls `get_history(session_id)`
- **THEN** it passes only the `items` array as `history` to the RAG chain