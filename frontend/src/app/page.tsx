'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Menu } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import ChatArea from '@/components/ChatArea'
import { useChat } from '@/hooks/useChat'

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mounted, setMounted] = useState(false)
  const { sessions, activeSessionId, messages, loading, sessionsHasMore, historyHasMore, createNewChat, switchSession, deleteChat, sendMessage, uploadFile, loadMoreSessions, loadMoreHistory } = useChat()
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const stored = localStorage.getItem('sidebarOpen')
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored !== null) setSidebarOpen(stored === 'true')
    setMounted(true)
  }, [])

  const toggle = () =>
    setSidebarOpen(prev => {
      localStorage.setItem('sidebarOpen', String(!prev))
      return !prev
    })

  return (
    <div className="flex h-screen overflow-hidden bg-[#212121] text-white">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-lg focus:text-sm"
      >
        Skip to main content
      </a>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: reducedMotion ? 1 : 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: reducedMotion ? 1 : 0 }}
            onClick={toggle}
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        isOpen={mounted ? sidebarOpen : true}
        onNewChat={createNewChat}
        onSelectSession={switchSession}
        onDeleteSession={deleteChat}
        onClose={toggle}
        onLoadMore={loadMoreSessions}
        hasMoreSessions={sessionsHasMore}
      />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Navbar — only shows hamburger when sidebar is closed */}
        <header className="flex items-center h-14 px-3 flex-shrink-0">
          <AnimatePresence>
            {!sidebarOpen && (
              <motion.button
                key="hamburger"
                initial={{ opacity: reducedMotion ? 1 : 0, scale: reducedMotion ? 1 : 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: reducedMotion ? 1 : 0, scale: reducedMotion ? 1 : 0.8 }}
                transition={{ duration: reducedMotion ? 0 : 0.15 }}
                onClick={toggle}
                className="p-2 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Open sidebar"
              >
                <Menu className="w-5 h-5" aria-hidden="true" />
              </motion.button>
            )}
          </AnimatePresence>
        </header>

        {/* Chat */}
        <main id="main-content" className="flex-1 overflow-hidden">
          <ChatArea messages={messages} loading={loading} onSend={sendMessage} onUpload={uploadFile} onLoadMore={loadMoreHistory} hasMoreMessages={historyHasMore} />
        </main>
      </div>
    </div>
  )
}
