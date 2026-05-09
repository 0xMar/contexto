'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, PanelLeftClose } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Session } from '@/hooks/useChat'
import { cn } from '@/lib/utils'

interface Props {
  sessions: Session[]
  activeSessionId: string
  isOpen: boolean
  onNewChat: () => void
  onSelectSession: (id: string) => void
  onDeleteSession: (id: string) => void
  onClose: () => void
}

export default function Sidebar({ sessions, activeSessionId, isOpen, onNewChat, onSelectSession, onDeleteSession, onClose }: Props) {
  return (
    <>
      {/* Desktop: part of flex flow — animates width */}
      <motion.aside
        animate={{ width: isOpen ? 260 : 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="hidden lg:flex flex-col overflow-hidden flex-shrink-0 bg-[#171717]"
        aria-hidden={!isOpen}
      >
        <SidebarContent
          sessions={sessions}
          activeSessionId={activeSessionId}
          onNewChat={onNewChat}
          onSelectSession={onSelectSession}
          onDeleteSession={onDeleteSession}
          onClose={onClose}
        />
      </motion.aside>

      {/* Mobile: fixed overlay drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            key="mobile-sidebar"
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            exit={{ x: -260 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="lg:hidden fixed left-0 top-0 h-screen w-[260px] z-40 flex flex-col bg-[#171717]"
          >
            <SidebarContent
              sessions={sessions}
              activeSessionId={activeSessionId}
              onNewChat={onNewChat}
              onSelectSession={onSelectSession}
              onDeleteSession={onDeleteSession}
              onClose={onClose}
            />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}

function SidebarContent({ sessions, activeSessionId, onNewChat, onSelectSession, onDeleteSession, onClose }: Omit<Props, 'isOpen'>) {
  return (
    <div className="flex flex-col h-full w-[260px]">
      {/* Header */}
      <div className="flex items-center justify-between p-3 pt-4">
        <Button
          onClick={onNewChat}
          variant="ghost"
          className="flex-1 justify-start gap-2 text-gray-300 hover:text-white hover:bg-white/10 h-10"
          aria-label="New chat"
        >
          <Plus className="w-4 h-4" />
          New chat
        </Button>
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close sidebar"
        >
          <PanelLeftClose className="w-5 h-5" />
        </button>
      </div>

      {/* Sessions list */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5" aria-label="Chat history">
        {sessions.length === 0 && (
          <p className="text-xs text-gray-500 text-center py-4">No chats yet</p>
        )}
        {sessions.map(session => (
          <div
            key={session.session_id}
            onClick={() => onSelectSession(session.session_id)}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && onSelectSession(session.session_id)}
            className={cn(
              'group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm',
              session.session_id === activeSessionId
                ? 'bg-white/15 text-white'
                : 'text-gray-400 hover:bg-white/10 hover:text-white'
            )}
          >
            <span className="truncate flex-1">{session.title}</span>
            <button
              onClick={e => { e.stopPropagation(); onDeleteSession(session.session_id) }}
              className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-200 ml-1 p-0.5 rounded transition-opacity"
              aria-label={`Delete ${session.title}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </nav>
    </div>
  )
}
