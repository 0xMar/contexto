'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import ChatArea from '@/components/ChatArea'
import { useChat } from '@/hooks/useChat'

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { sessions, activeSessionId, messages, loading, createNewChat, switchSession, deleteChat, sendMessage, uploadFile } = useChat()

  useEffect(() => {
    const stored = localStorage.getItem('sidebarOpen')
    if (stored !== null) setSidebarOpen(stored === 'true')
  }, [])

  const toggle = () =>
    setSidebarOpen(prev => {
      localStorage.setItem('sidebarOpen', String(!prev))
      return !prev
    })

  return (
    <div className="flex h-screen overflow-hidden bg-[#212121] text-white">
      {/* Mobile backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggle}
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        isOpen={sidebarOpen}
        onNewChat={createNewChat}
        onSelectSession={switchSession}
        onDeleteSession={deleteChat}
        onClose={toggle}
      />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Navbar — only shows hamburger when sidebar is closed */}
        <header className="flex items-center h-14 px-3 flex-shrink-0">
          <AnimatePresence>
            {!sidebarOpen && (
              <motion.button
                key="hamburger"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                onClick={toggle}
                className="p-2 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Open sidebar"
              >
                <Menu className="w-5 h-5" />
              </motion.button>
            )}
          </AnimatePresence>
        </header>

        {/* Chat */}
        <main className="flex-1 overflow-hidden">
          <ChatArea messages={messages} loading={loading} onSend={sendMessage} onUpload={uploadFile} />
        </main>
      </div>
    </div>
  )
}
