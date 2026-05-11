# Spec: Frontend UI Components — Load More Buttons

## Domains
`frontend/src/components/Sidebar.tsx`, `frontend/src/components/ChatArea.tsx`

---

## ADDED Requirements

### Requirement: Sidebar "Load more sessions" button

The Sidebar component **MUST** accept a new `onLoadMore` callback prop and render a "Load more" button when sessions are paginated.

- **New prop:**
  | Prop | Type | Required |
  |------|------|----------|
  | `onLoadMore` | `() => void` | Yes |
  | `hasMoreSessions` | `boolean` | Yes |

- When `hasMoreSessions` is `true`, a "Load more" button **MUST** be rendered at the bottom of the session list, before the closing `</nav>`.
- The button **MUST** call `onLoadMore()` on click.
- The button **MUST** be visually consistent with the existing UI (uses same `Button` component, ghost variant).
- When `hasMoreSessions` is `false`, the button **MUST NOT** be rendered.

#### Scenario: Load more button rendered when more sessions exist
- **GIVEN** `hasMoreSessions` is `true` and `onLoadMore` is provided
- **WHEN** the Sidebar renders
- **THEN** a "Load more" button is visible at the bottom of the session list
- **AND** clicking it calls `onLoadMore()`

#### Scenario: Load more button hidden when all sessions loaded
- **GIVEN** `hasMoreSessions` is `false`
- **WHEN** the Sidebar renders
- **THEN** no "Load more" button is visible

#### Scenario: Button is disabled/loading during fetch
- **GIVEN** a fetch is in progress
- **WHEN** the user clicks "Load more"
- **THEN** the click handler is naturally debounced by the hook (duplicate calls are prevented by the `sessionsHasMore` guard)

---

### Requirement: ChatArea "Load older messages" button

The ChatArea component **MUST** accept new props for loading older messages and conditionally render a "Load older messages" button above the message list.

- **New props:**
  | Prop | Type | Required |
  |------|------|----------|
  | `onLoadMore` | `() => void` | Yes |
  | `hasMoreMessages` | `boolean` | Yes |

- When `hasMoreMessages` is `true`, a "Load older messages" button **MUST** be rendered at the **top** of the `<div className="flex-1 overflow-y-auto px-4 py-6">` container, before the `<div className="max-w-2xl mx-auto">` wrapper.
- The button **MUST** call `onLoadMore()` on click.
- The button **MUST** use the `ghost` variant of the `Button` component, be full-width, and have understated styling (similar to the "New chat" button in the sidebar header).
- When `hasMoreMessages` is `false`, the button **MUST NOT** be rendered.

#### Scenario: Load older messages button renders when history is paginated
- **GIVEN** the active session has more than 50 messages and `hasMoreMessages` is `true`
- **WHEN** the ChatArea renders
- **THEN** a "Load older messages" button is visible at the top of the message container
- **AND** clicking it calls `onLoadMore()`

#### Scenario: No button when all messages loaded
- **GIVEN** all messages for the session fit in one page (<= 50)
- **WHEN** the ChatArea renders
- **THEN** no "Load older messages" button is visible

---

## MODIFIED Requirements

### Requirement: Auto-scroll behavior respects user scroll position

**Previously:** `ChatArea` always auto-scrolled to the bottom whenever `messages` or `loading` changed.

**Now:** Auto-scroll to bottom **MUST NOT** trigger if the user has scrolled up to view older messages. The auto-scroll **SHOULD** only trigger when:
1. The user is already at (or within 200px of) the bottom of the message list, OR
2. A new message arrives (from the assistant's streaming response), OR
3. The user sends a new message

> **Note:** For this initial pagination implementation, auto-scroll after loading is preserved (previous behavior). The scroll-position-aware behavior is a recommended refinement that the implementer **SHOULD** apply if straightforward to implement with `useRef` + scroll position checking. If not, the existing auto-scroll behavior is acceptable for the first iteration.

#### Scenario: Auto-scroll works normally for new messages
- **GIVEN** user is viewing the latest messages (at or near bottom)
- **WHEN** a new assistant message arrives via streaming
- **THEN** the view auto-scrolls to show the new message

#### Scenario: Auto-scroll still works on send
- **GIVEN** user has scrolled up to view older messages
- **WHEN** user sends a new message
- **THEN** the view auto-scrolls to the bottom (since user initiated the action)