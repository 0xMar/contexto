# Spec: Frontend useChat Hook — Pagination State and Load-More Functions

## Domain
`frontend/src/hooks/useChat.ts`

---

## ADDED Requirements

### Requirement: Pagination state for sessions list

The hook **MUST** track pagination state for session listing.

- **New state variables:**
  - `sessionsPage: number` — current page offset, initialized to `0`
  - `sessionsHasMore: boolean` — whether more sessions are available, initialized based on first fetch response

### Requirement: Paginated session fetching

The initial session fetch on mount **MUST** request `/sessions?limit=20&offset=0`.

The response envelope **MUST** be handled:
- `items` array is used to populate `sessions` state (replaces on initial load, appends on load-more)
- `has_more` value is stored in `sessionsHasMore`

#### Scenario: Initial load with pagination
- **GIVEN** the hook mounts with 25 total sessions
- **WHEN** the initial `/sessions?limit=20&offset=0` fetch completes
- **THEN** `sessions` contains 20 session objects
- **AND** `sessionsHasMore` is `true`

#### Scenario: Load more sessions
- **GIVEN** `sessions` already holds 20 items, `sessionsHasMore` is `true`, `sessionsPage` is `0`
- **WHEN** `loadMoreSessions()` is called
- **THEN** a fetch to `/sessions?limit=20&offset=20` is made
- **AND** on response, the new items are **appended** to existing `sessions`
- **AND** `sessionsPage` is updated to `20`
- **AND** `sessionsHasMore` is updated from the response `has_more` field

### Requirement: loadMoreSessions function

The hook **MUST** expose a `loadMoreSessions(): void` function that:
1. Is only effective when `sessionsHasMore` is `true`
2. Increments the page offset by the current limit
3. Fetches the next page from `/sessions`
4. Appends returned items to existing `sessions` array
5. Updates `sessionsHasMore` from response

#### Scenario: No-op when all sessions loaded
- **GIVEN** `sessionsHasMore` is `false`
- **WHEN** `loadMoreSessions()` is called
- **THEN** no fetch is made

---

### Requirement: Pagination state for message history

The hook **MUST** track pagination state for message history.

- **New state variables:**
  - `historyPage: number` — current page offset, initialized to `0`
  - `historyHasMore: boolean` — whether more messages are available, initialized based on first fetch response

### Requirement: Paginated history fetching

The `switchSession` function **MUST** request `/history/{sessionId}?limit=50&offset=0`.

The response envelope **MUST** be handled:
- `items` array is used to populate `messages` state
- `has_more` value is stored in `historyHasMore`

#### Scenario: Switch session loads first page of history
- **GIVEN** session `"s1"` has 120 messages, `activeSessionId` is empty
- **WHEN** user calls `switchSession("s1")`
- **THEN** a fetch to `/history/s1?limit=50&offset=0` is made
- **AND** `messages` contains the first 50 messages (oldest first, since messages are ordered `ORDER BY id ASC` and offset starts at 0)
- **AND** `historyHasMore` is `true`
- **AND** `historyPage` is `0`

### Requirement: loadMoreHistory function

The hook **MUST** expose a `loadMoreHistory(): void` function that:
1. Is only effective when `historyHasMore` is `true`
2. Fetches the next page from `/history/{sessionId}`
3. Prepends returned items to existing `messages` array (older messages go at the top)
4. Updates `historyPage` and `historyHasMore`

#### Scenario: Load older messages
- **GIVEN** `messages` contains 50 items (most recent page), `historyHasMore` is `true`, `historyPage` is `0`
- **WHEN** `loadMoreHistory()` is called
- **THEN** a fetch to `/history/{sessionId}?limit=50&offset=50` is made
- **AND** the returned 50 older messages are **prepended** to `messages`
- **AND** `historyPage` is updated to `100` (next batch offset)

#### Scenario: No-op when all history loaded
- **GIVEN** `historyHasMore` is `false`
- **WHEN** `loadMoreHistory()` is called
- **THEN** no fetch is made

---

### Requirement: Returned interface

The hook **MUST** return the following new values in its return object:

| Property | Type | Description |
|----------|------|-------------|
| `sessionsHasMore` | `boolean` | True if more sessions can be loaded |
| `historyHasMore` | `boolean` | True if older messages exist for current session |
| `loadMoreSessions` | `() => void` | Callback to load the next page of sessions |
| `loadMoreHistory` | `() => void` | Callback to load older messages |

---

### Requirement: Session creation resets pagination state

When `createNewChat()` is called, pagination state **MUST** be reset:
- `sessionsPage` reset to `0`
- `sessionsHasMore` set based on whether the newly prepended session fills the current page or implies more exist

> **Implementation note:** After creating a session, the simplest correct approach is to reload sessions from page 0.

---

### Requirement: Session deletion resets pagination state

When `deleteChat(sessionId)` is called, if the deleted session was the active one and the user navigates to another session:
- `historyPage` **MUST** reset to `0`
- `historyHasMore` **MUST** be reset based on the new session's history

---

## MODIFIED Requirements

### Requirement: switchSession behavior (previously: load all messages)

**Previously:** `switchSession` fetched all messages and set them as a flat array.

**Now:** `switchSession` resets `historyPage` to `0`, fetches the first page of messages via `/history/{sessionId}?limit=50&offset=0`, and sets `messages` from the envelope `items`.

#### Scenario: Switching between sessions preserves pagination isolation
- **GIVEN** user viewed session `"s1"` and loaded 100 messages (page 0 and page 1)
- **WHEN** user switches to session `"s2"` via `switchSession("s2")`
- **THEN** `messages` is reset and contains only the first page of `"s2"` messages
- **AND** `historyPage` is `0`
- **AND** `historyHasMore` reflects `"s2"`'s total message count