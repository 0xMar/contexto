'use client'

import { Session } from '@/hooks/useChat'

interface Props {
  sessions: Session[]
  activeSessionId: string
  isOpen: boolean
  onNewChat: () => void
  onSelectSession: (id: string) => void
  onDeleteSession: (id: string) => void
}

export default function Sidebar({
  sessions,
  activeSessionId,
  isOpen,
  onNewChat,
  onSelectSession,
  onDeleteSession,
}: Props) {
  return (
    <aside
      className={`fixed left-0 top-0 h-screen w-64 bg-[#1a1a2e] flex flex-col transform transition-transform duration-300 ease-in-out z-40 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/20 text-white/80 hover:bg-white/10 transition-colors text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New chat
        </button>
      </div>

      {/* Chat list */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {sessions.length === 0 && (
          <p className="text-white/30 text-xs text-center">No chats yet</p>
        )}
        {sessions.map(session => (
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
              onClick={e => {
                e.stopPropagation()
                onDeleteSession(session.session_id)
              }}
              className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-white/80 ml-2 text-xs transition-opacity"
              title="Delete chat"
            >
              ✕
            </button>
          </div>
        ))}
      </nav>
    </aside>
  )
}
