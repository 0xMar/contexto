# Specs: Pagination for Sessions and History

## Change ID
`0002-pagination-sessions-history`

## Summary

Add pagination to `GET /sessions` and `GET /history/{session_id}` endpoints using a "Load more" button pattern with an envelope response format. Backward compatible — defaults return the first page if no query params are provided.

| Property | Value |
|----------|-------|
| **Defaults** | Sessions: limit=20, History: limit=50 |
| **Limits** | Sessions: max 100, History: max 200 |
| **Pattern** | Explicit "Load more" button (no infinite scroll) |
| **Response shape** | Envelope with `items`, `total`, `limit`, `offset`, `has_more` |

---

## Domains

| # | Domain | File | Type | Added | Modified | Removed |
|---|--------|------|------|-------|----------|---------|
| 1 | `app/core/db.py` | `backend-db.md` | Delta | 5 | 2 | 0 |
| 2 | `app/main.py` (API routes) | `backend-routes.md` | Delta | 0 | 2 | 0 |
| 3 | `frontend/src/hooks/useChat.ts` | `frontend-usechat.md` | Delta | 7 | 3 | 0 |
| 4 | `frontend/src/components/Sidebar.tsx` / `ChatArea.tsx` | `frontend-ui.md` | Delta | 3 | 1 | 0 |
| 5 | All test files | `test-scenarios.md` | Delta | 14 | 3 | 0 |

---

## Key Architectural Decisions

1. **LIMIT/OFFSET over cursor-based** — Chose LIMIT/OFFSET over keyset/cursor pagination because:
   - Data volume is low (~1000 sessions max) → O(n) OFFSET is negligible
   - Simpler to implement, test, and debug
   - No cursor encoding/decoding overhead
   - Uses existing indexes (`id` on conversations, `created_at` on sessions)
   - If the project scales significantly, cursor-based can be adopted later without API breakage

2. **Envelope response format** — Every paginated response wraps the array in an object with metadata (`items`, `total`, `limit`, `offset`, `has_more`). Cleaner than response headers and self-documenting.

3. **Two-query pattern** — Each paginated DB call executes two queries: one `COUNT(*)` for `total`, one `SELECT ... LIMIT ? OFFSET ?` for `items`. Simple and correct for expected data volumes.

4. **History order preserved** — Messages remain `ORDER BY id ASC` (oldest first). Pagination loads older messages via `loadMoreHistory()` which prepends to the message list. Newest messages are always visible on initial load.

5. **Chat endpoint RAG context** — `POST /chat` calls `get_history(session_id)` with default params (first 50 messages). The handler extracts `.items` from the envelope. Preserves the existing RAG flow for the common case of shorter conversations.

6. **"Load more" over infinite scroll** — Explicit buttons only. No intersection observers, no sentinel elements. Matches the project's portfolio-app simplicity goal.

---

## Coverage Summary

| Path | Happy paths | Edge cases | Error states |
|------|-------------|------------|--------------|
| `db.py` — sessions pagination | ✓ | ✓ (limit=0, offset>=total, custom limit) | — |
| `db.py` — history pagination | ✓ | ✓ (limit=0, offset>=total, non-existent session, empty session) | — |
| `main.py` — /sessions route | ✓ | ✓ (limit capped, negative/non-integer params) | — |
| `main.py` — /history route | ✓ | ✓ (invalid params, empty session) | — |
| `main.py` — /chat with envelope | ✓ | — | — |
| `useChat.ts` — session pagination | ✓ | ✓ (load-more, no-op guard) | — |
| `useChat.ts` — history pagination | ✓ | ✓ (session switch resets state) | — |
| `Sidebar.tsx` — load more button | ✓ | ✓ (hidden when no more) | — |
| `ChatArea.tsx` — load older button | ✓ | ✓ (hidden when no more) | — |

---

## Backward Compatibility

Both `limit` and `offset` default to sensible values (20 and 0), so omitting them returns the first page. The response shape changes from bare array to envelope — this is a **breaking change** for any consumer expecting a flat array. Since the frontend is the sole consumer and is being updated in the same change, this is acceptable.

---

## Next Step

Ready for design: `sdd-design` for the four domain files.