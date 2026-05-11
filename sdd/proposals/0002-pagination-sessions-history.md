# SDD Change Proposal: Add Pagination to Sessions and History

**Author:** Victor  
**Date:** 2026-05-11  
**Status:** Proposed  
**Priority:** Medium  

---

## 1. Problem Statement

`get_sessions()` and `get_history()` return ALL records with no limit. As users accumulate sessions and long conversations, this creates:

- **Performance problem:** Full table scans and unbounded payloads on every request.
- **UX problem:** Flat lists with no scrolling/loading affordance in the sidebar and chat view.

Both the sessions list (sidebar) and the chat history (messages view) need pagination.

---

## 2. Scope

Paginate **both** endpoints:

| Endpoint | What changes |
|---|---|
| `GET /sessions` | Paginate the sessions list in the sidebar |
| `GET /history/{session_id}` | Paginate the message history in the chat view |

---

## 3. API Changes

### 3.1 `GET /sessions`

**New query parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `limit` | int | 20 | Max sessions per page |
| `offset` | int | 0 | Number of sessions to skip |

**New response fields (envelope):**

```jsonc
{
  "sessions": [ ... ],          // existing array, now paginated
  "total": 42,                  // total count across all sessions
  "limit": 20,                  // echoed back
  "offset": 0,                  // echoed back
  "has_more": true              // true if offset + limit < total
}
```

**SQL change** — add `LIMIT ? OFFSET ?` to the query:

```sql
SELECT session_id, title, created_at
FROM sessions
ORDER BY created_at DESC
LIMIT ? OFFSET ?
```

Add a separate `COUNT(*)` query for `total`.

### 3.2 `GET /history/{session_id}`

**New query parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `limit` | int | 50 | Max messages per page |
| `offset` | int | 0 | Number of messages to skip |

**New response fields (envelope):**

```jsonc
{
  "messages": [ ... ],          // existing array, now paginated
  "total": 128,                 // total messages in session
  "limit": 50,                  // echoed back
  "offset": 0,                  // echoed back
  "has_more": true              // true if offset + limit < total
}
```

**SQL change** — add `LIMIT ? OFFSET ?`:

```sql
SELECT role, content, timestamp
FROM conversations
WHERE session_id = ?
ORDER BY id
LIMIT ? OFFSET ?
```

Add a separate `COUNT(*)` query for `total`.

---

## 4. Backend Changes

### 4.1 `app/core/db.py`

- Modify `get_sessions()` to accept `limit` and `offset` params; return an object `{"sessions": [...], "total": N, ...}` instead of a bare list.
- Modify `get_history()` to accept `limit` and `offset` params; return an object `{"messages": [...], "total": N, ...}` instead of a bare list.
- Both functions execute two queries: one `COUNT(*)` for the total, and the main `SELECT ... LIMIT ? OFFSET ?`.

### 4.2 `app/main.py`

- `GET /sessions` handler: parse `limit`/`offset` from query params with defaults; pass to `get_sessions()`.
- `GET /history/{session_id}` handler: parse `limit`/`offset` from query params with defaults; pass to `get_history()`.

---

## 5. Frontend Changes

### 5.1 `useChat` hook (`src/hooks/useChat.ts`)

- Add `sessionsPage` / `historyPage` state to track current page offsets.
- `fetchSessions(page?)` — fetches `/sessions?limit=20&offset=N`; appends to existing `sessions` array when loading more.
- `fetchHistory(sessionId, page?)` — fetches `/history/{id}?limit=50&offset=N`; appends messages when loading more.
- Expose `loadMoreSessions()` and `loadMoreHistory()` callbacks.
- Expose `hasMoreSessions` / `hasMoreHistory` booleans.

### 5.2 Sidebar (`src/components/Sidebar.tsx`)

- After the session list, render a "Load more" button (or sentinel element) when `hasMoreSessions` is true.
- Wire it to `loadMoreSessions()`.

### 5.3 ChatArea / Message list (`src/components/ChatArea.tsx`)

- After the message list, render a "Load more" button or infinite scroll sentinel when `hasMoreHistory` is true.
- Wire it to `loadMoreHistory()`.

**Design note:** Use a "Load more" button rather than infinite scroll to keep it simple and explicit — this is a portfolio app.

---

## 6. Impact on Existing Tests

### 6.1 `backend/tests/test_api.py`

- **`test_list_sessions`**: Response shape changes from `[]` to `{"sessions": [], "total": 0, "limit": 20, "offset": 0, "has_more": false}`. Test must be updated.
- **`test_get_history_empty`**: Same envelope change — test must be updated.
- **`test_get_history_populated`**: Response is now `{"messages": [...], ...}` — test must be updated.
- **`test_chat_auto_titles_first_message`**: Uses `get_history.return_value = []` — mock now returns the envelope shape: `{"messages": [], "total": 0, ...}`. The chat handler calls `get_history(session_id)` and then passes the list portion to the RAG chain, so the mock must match the new shape.

**Strategy:** The mock_db fixture patches `main_module.get_sessions` and `main_module.get_history` — these mocks return a plain list today. After the change, the *backend* functions return the envelope, but the *route handlers* unwrap it. Since the API tests mock at the function level, we need to either:
1. Update mocks to return the envelope shape, OR
2. Keep mocks as-is and ensure the handler still works by adjusting the handler to call `.get("sessions")` / `.get("messages")` on the return value.

Option 1 is cleaner — update the mock fixtures to return the new shape.

### 6.2 `backend/tests/test_db.py`

- Tests call `get_sessions()` and `get_history()` directly with no args. New signature has `limit`/`offset` with defaults, so all existing calls still work.
- Add new tests:
  - `test_get_sessions_pagination` — create 25 sessions, fetch with limit=20, assert 20 returned + `has_more=True`.
  - `test_get_history_pagination` — create 55 messages, fetch with limit=50, assert 50 returned + `has_more=True`.

### 6.3 `frontend/src/hooks/useChat.test.ts`

- Mock fetch responses to include the new envelope format.
- Add tests for "load more" behavior (appending results, tracking `hasMore`).

---

## 7. Backward Compatibility

- Both `limit` and `offset` default to sensible values (20 and 0), so omitting them returns the first page — backward compatible.
- Any external consumer of the API that expects a bare array will break. Since this is a portfolio app with a single frontend consumer, this is acceptable. Document the breaking change if the API is ever shared.

---

## 8. Estimated Complexity & Risk

| Area | Effort | Risk |
|---|---|---|
| `db.py` — pagination queries | Low (~1 hr) | Low — straightforward LIMIT/OFFSET with aiosqlite |
| `main.py` — query param parsing | Low (~30 min) | Low — FastAPI handles this natively |
| `useChat.ts` — page state & load-more | Medium (~2 hrs) | Medium — need to handle append vs. replace correctly |
| Sidebar "Load more" UI | Low (~1 hr) | Low — simple button addition |
| ChatArea "Load more" UI | Low (~1 hr) | Low — similar to sidebar |
| Test updates | Medium (~1 hr) | Low — mechanical changes |

**Total estimate:** ~6 hours  
**Overall risk:** Low — SQLite has native LIMIT/OFFSET, FastAPI handles query params, and the UI is a simple button.

---

## 9. Key Decisions

1. **Both endpoints get paginated** — even though the problem statement mentions both, it's worth confirming because the frontend patterns differ (sidebar vs. chat message list).
2. **"Load more" button over infinite scroll** — keeps it simple and explicit, no intersection observer complexity.
3. **Envelope response format** — wrapping the list in an object lets us add `total`, `has_more`, etc. without changing the array itself. This is cleaner than adding metadata to the response headers.
4. **Default limit of 20 for sessions, 50 for history** — sessions are low-volume; history messages are more numerous, so a higher default makes sense.

---

## 10. Next Steps

1. Write the delta spec with exact code changes (the apply phase).
2. Implement backend pagination in `db.py` and `main.py`.
3. Update frontend `useChat` hook and UI components.
4. Update and add tests.
5. Verify all existing tests pass.