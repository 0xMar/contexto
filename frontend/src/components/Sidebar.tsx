'use client'

import { Session } from '@/hooks/useChat'

interface Props {
  sessions: Session[]
  activeSessionId: string
  collapsed: boolean
  onNewChat: () => void
  onSelectSession: (id: string) => void
  onDeleteSession: (id: string) => void
  onToggle: () => void
}

export default function Sidebar({
  sessions,
  activeSessionId,
  collapsed,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  onToggle,
}: Props) {
  // Collapsed: narrow icon strip
  if (collapsed) {
    return (
      <aside className="w-14 h-screen bg-[#1a1a2e] flex flex-col items-center py-3 flex-shrink-0">
        {/* Logo */}
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white text-xs font-bold mb-4">
          C
        </div>

        {/* Toggle (open sidebar) */}
        <button
          onClick={onToggle}
          className="p-2 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-colors mb-2"
          aria-label="Open sidebar"
          title="Open sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* New chat icon */}
        <button
          onClick={onNewChat}
          className="p-2 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-colors mb-2"
          aria-label="New chat"
          title="New chat"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>

        {/* Search icon */}
        <button
          className="p-2 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-colors"
          aria-label="Search chats"
          title="Search chats"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </aside>
    )
  }

  // Expanded: full sidebar
  return (
    <aside className="w-64 h-screen bg-[#1a1a2e] flex flex-col flex-shrink-0">
      {/* Header */}
      <div className="p-3 flex items-center justify-between">
        {/* Logo */}
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white text-xs font-bold">
          C
        </div>

        {/* Toggle (close sidebar) */}
        <button
          onClick={onToggle}
          className="p-2 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-colors"
          aria-label="Close sidebar"
          title="Close sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Quick actions */}
      <div className="px-3 pb-3 space-y-2">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/20 text-white/80 hover:bg-white/10 transition-colors text-sm"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New chat
        </button>

        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-colors text-sm">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Search chats
        </button>
      </div>

      {/* Divider */}
      <div className="px-3 mb-2">
        <div className="h-px bg-white/10" />
      </div>

      {/* Chat list and sections */}
      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        {/* Recents section */}
        {sessions.length > 0 && (
          <div>
            <p className="text-white/40 text-xs uppercase tracking-wider font-semibold px-2 py-2 mb-2">
              Recents
            </p>
            {sessions.slice(0, 5).map(session => (
              <div
                key={session.session_id}
                onClick={() => onSelectSession(session.session_id)}
                className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer mb-1 transition-colors ${
                  session.session_id === activeSessionId
                    ? 'bg-white/15 text-white'
                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="text-sm truncate flex-1">{session.title}</span>
                <button
                  onClick={e => { e.stopPropagation(); onDeleteSession(session.session_id) }}
                  className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-white/80 ml-2 text-xs transition-opacity"
                  title="Delete chat"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {sessions.length === 0 && (
          <p className="text-white/30 text-xs text-center mt-4">No chats yet</p>
        )}
      </nav>
    </aside>
  )
}
