# Spec: Test Scenarios — Pagination for Sessions and History

## Domain
All test files: `backend/tests/test_api.py`, `backend/tests/test_db.py`, `frontend/src/hooks/useChat.test.ts`, `frontend/src/components/Sidebar.test.tsx`, `frontend/src/components/ChatArea.test.tsx`

---

## ADDED Requirements

### Requirement: Backend tests for paginated sessions

New tests in `backend/tests/test_db.py`:

#### Scenario: get_sessions_count returns zero for empty db
- **GIVEN** an empty database (via `tmp_path` fixture)
- **WHEN** `get_sessions_count()` is called
- **THEN** it returns `0`

#### Scenario: get_sessions_count returns correct count
- **GIVEN** 7 sessions have been created
- **WHEN** `get_sessions_count()` is called
- **THEN** it returns `7`

#### Scenario: get_sessions pagination — first page
- **GIVEN** 25 sessions exist
- **WHEN** `get_sessions()` is called (defaults: limit=20, offset=0)
- **THEN** `items` has length `20`
- **AND** `total` equals `25`
- **AND** `has_more` is `True`

#### Scenario: get_sessions pagination — second page
- **GIVEN** 25 sessions exist
- **WHEN** `get_sessions(limit=20, offset=20)` is called
- **THEN** `items` has length `5`
- **AND** `total` equals `25`
- **AND** `has_more` is `False`

#### Scenario: get_sessions pagination — limit=0
- **GIVEN** 5 sessions exist
- **WHEN** `get_sessions(limit=0)` is called
- **THEN** `items` is `[]`
- **AND** `total` equals `5`

#### Scenario: get_sessions pagination — offset beyond total
- **GIVEN** 3 sessions exist
- **WHEN** `get_sessions(offset=100)` is called
- **THEN** `items` is `[]`
- **AND** `has_more` is `False`

#### Scenario: get_history_count for empty session
- **GIVEN** session `"s1"` exists with no messages
- **WHEN** `get_history_count("s1")` is called
- **THEN** it returns `0`

#### Scenario: get_history_count for session with messages
- **GIVEN** session `"s1"` has 10 messages
- **WHEN** `get_history_count("s1")` is called
- **THEN** it returns `10`

#### Scenario: get_history pagination — first page
- **GIVEN** session `"s1"` has 55 messages
- **WHEN** `get_history("s1")` is called (defaults: limit=50, offset=0)
- **THEN** `items` has length `50`
- **AND** `total` equals `55`
- **AND** `has_more` is `True`

#### Scenario: get_history pagination — second page
- **GIVEN** session `"s1"` has 55 messages
- **WHEN** `get_history("s1", limit=50, offset=50)` is called
- **THEN** `items` has length `5`
- **AND** `total` equals `55`
- **AND** `has_more` is `False`

#### Scenario: get_history maintains sort order (oldest first)
- **GIVEN** session `"s1"` has messages created in order: msg1, msg2, msg3
- **WHEN** `get_history("s1", limit=10, offset=0)` is called
- **THEN** `items[0].content` matches msg1 (oldest)
- **AND** `items[-1].content` matches msg3 (newest)

#### Scenario: get_history for non-existent session
- **GIVEN** no session with id `"ghost"` exists
- **WHEN** `get_history("ghost")` is called
- **THEN** `items` is `[]`
- **AND** `total` equals `0`

### Requirement: Backend API route tests for pagination

New tests in `backend/tests/test_api.py`:

#### Scenario: GET /sessions default pagination
- **GIVEN** the API is running (via `client` fixture)
- **WHEN** `GET /sessions` is requested with no query params
- **THEN** status is `200`
- **AND** the response is an envelope with `items`, `total`, `limit`, `offset`, `has_more` keys
- **AND** `limit` is `20`, `offset` is `0`

#### Scenario: GET /sessions with limit and offset
- **WHEN** `GET /sessions?limit=5&offset=3` is requested
- **THEN** `limit` in response is `5`
- **AND** `offset` in response is `3`

#### Scenario: GET /sessions limit capped at 100
- **WHEN** `GET /sessions?limit=200` is requested
- **THEN** response `limit` is `100`

#### Scenario: GET /sessions rejects negative offset
- **WHEN** `GET /sessions?offset=-5` is requested
- **THEN** status is `400`

#### Scenario: GET /sessions rejects non-integer limit
- **WHEN** `GET /sessions?limit=abc` is requested
- **THEN** status is `400`

#### Scenario: GET /history/{session_id} default pagination
- **GIVEN** `get_history` mock returns the envelope format
- **WHEN** `GET /history/s1` is requested
- **THEN** status is `200`
- **AND** the response is an envelope with expected keys

#### Scenario: GET /history/{session_id} with pagination
- **WHEN** `GET /history/s1?limit=10&offset=20` is requested
- **THEN** `limit` in response is `10`, `offset` is `20`

#### Scenario: GET /history/{session_id} rejects invalid params
- **WHEN** `GET /history/s1?limit=abc` is requested
- **THEN** status is `400`

#### Scenario: POST /chat still works with paginated get_history
- **GIVEN** `get_history` returns `{"items": [...], "total": 5, "limit": 50, "offset": 0, "has_more": false}`
- **WHEN** `POST /chat` is called with `{text: "hi", session_id: "s1"}`
- **THEN** status is `200`
- **AND** SSE stream contains message chunks

### Requirement: Existing mock fixture updates

The `mock_db` fixture in `backend/tests/test_api.py` **MUST** be updated so that mocked `get_sessions` and `get_history` return the envelope format:

```python
# get_sessions mock
monkeypatch.setattr(main_module, "get_sessions", AsyncMock(return_value={
    "items": [], "total": 0, "limit": 20, "offset": 0, "has_more": False
}))

# get_history mock
monkeypatch.setattr(main_module, "get_history", AsyncMock(return_value={
    "items": [], "total": 0, "limit": 50, "offset": 0, "has_more": False
}))
```

The `test_sse_errors.py` mock fixture **MUST** be updated similarly.

---

### Requirement: Frontend useChat hook tests

New tests in `frontend/src/hooks/useChat.test.ts`:

#### Scenario: useChat initializes with pagination defaults
- **GIVEN** fetch mock returns envelope `{items: [{session_id: "123", ...}], total: 1, limit: 20, offset: 0, has_more: false}`
- **WHEN** the hook is initialized
- **THEN** `sessions` contains the session items
- **AND** `sessionsHasMore` is `false`

#### Scenario: useChat loads more sessions
- **GIVEN** first fetch returns `{items: [s1], total: 2, limit: 1, offset: 0, has_more: true}`
- **AND** `sessionsHasMore` is `true`
- **WHEN** `loadMoreSessions()` is called
- **THEN** a second fetch is made to `/sessions?limit=1&offset=1`
- **AND** the new item is appended to sessions
- **AND** `sessionsHasMore` is updated to `false`

#### Scenario: useChat loads paginated history on session switch
- **GIVEN** history fetch returns `{items: [msg1, msg2], total: 2, limit: 50, offset: 0, has_more: false}`
- **WHEN** `switchSession("s1")` is called
- **THEN** fetch is made to `/history/s1?limit=50&offset=0`
- **AND** `messages` contains the 2 items
- **AND** `historyHasMore` is `false`

#### Scenario: useChat returns loadMoreSessions and loadMoreHistory
- **WHEN** the hook is initialized
- **THEN** the return object includes `loadMoreSessions` (function)
- **AND** the return object includes `loadMoreHistory` (function)
- **AND** the return object includes `sessionsHasMore` (boolean)
- **AND** the return object includes `historyHasMore` (boolean)

### Requirement: Frontend Sidebar component tests

New tests in `frontend/src/components/Sidebar.test.tsx`:

#### Scenario: Load more button renders when hasMoreSessions is true
- **GIVEN** `hasMoreSessions` is `true` and `onLoadMore` is provided
- **WHEN** the Sidebar renders
- **THEN** a "Load more" button is present

#### Scenario: Load more button is hidden when hasMoreSessions is false
- **GIVEN** `hasMoreSessions` is `false`
- **WHEN** the Sidebar renders
- **THEN** no "Load more" button is present

#### Scenario: onLoadMore is called when button is clicked
- **GIVEN** `hasMoreSessions` is `true` and `onLoadMore` is a mock
- **WHEN** the "Load more" button is clicked
- **THEN** `onLoadMore` is called once

### Requirement: Frontend ChatArea component tests

New tests in `frontend/src/components/ChatArea.test.tsx`:

#### Scenario: Load older messages button renders when hasMoreMessages is true
- **GIVEN** `hasMoreMessages` is `true` and `onLoadMore` is provided
- **WHEN** the ChatArea renders
- **THEN** a "Load older messages" button is present at the top of the message container

#### Scenario: Load older messages button is hidden when hasMoreMessages is false
- **GIVEN** `hasMoreMessages` is `false`
- **WHEN** the ChatArea renders
- **THEN** no "Load older messages" button is present

#### Scenario: onLoadMore is called when "Load older messages" is clicked
- **GIVEN** `hasMoreMessages` is `true` and `onLoadMore` is a mock
- **WHEN** the "Load older messages" button is clicked
- **THEN** `onLoadMore` is called once

---

## MODIFIED Requirements

### Requirement: Existing tests updated for envelope response format

All existing tests that assert on the response shape of `GET /sessions` or `GET /history` **MUST** be updated to expect the envelope format instead of a bare array.

#### Scenario: test_list_sessions updated for envelope
- **GIVEN** mock returns empty envelope `{items: [], total: 0, limit: 20, offset: 0, has_more: false}`
- **WHEN** `GET /sessions` is called
- **THEN** response JSON has `items: []`, `total: 0`, `has_more: false`

#### Scenario: test_get_history_empty updated for envelope
- **GIVEN** mock returns empty envelope
- **WHEN** `GET /history/s1` is called
- **THEN** response JSON has `items: []`, `total: 0`, `has_more: false`

#### Scenario: test_get_history_populated updated for envelope
- **GIVEN** mock returns `{items: [{role: "user", content: "hi", timestamp: "..."}], total: 1, ...}`
- **WHEN** `GET /history/s1` is called
- **THEN** response JSON `items[0].role` is `"user"`