'use client'

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import ChatArea from '@/components/ChatArea'
import { useChat } from '@/hooks/useChat'

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const {
    sessions,
    activeSessionId,
    messages,
    loading,
    createNewChat,
    switchSession,
    deleteChat,
    sendMessage,
    uploadFile,
  } = useChat()

  const toggle = () => setSidebarOpen(o => !o)

  return (
    <div className="relative h-screen overflow-hidden bg-white">
      {/* Sidebar overlay backdrop on mobile */}
      {sidebarOpen && (
        <div
          onClick={toggle}
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Navbar - always on top, z-40 so it's above sidebar */}
      <div className="fixed top-0 left-0 right-0 h-16 border-b border-gray-200 bg-white px-4 sm:px-6 py-3 flex items-center gap-3 z-40">
        {/* Toggle button - shows logo when open, hamburger when closed */}
        <button
          onClick={toggle}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          {sidebarOpen ? (
            // Logo - shown when sidebar is OPEN
            <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
              C
            </div>
          ) : (
            // Hamburger - shown when sidebar is CLOSED
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Sidebar */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        isOpen={sidebarOpen}
        onNewChat={createNewChat}
        onSelectSession={switchSession}
        onDeleteSession={deleteChat}
      />

      {/* Main chat area - positioned below navbar */}
      <div className="pt-16 h-screen">
        <ChatArea
          messages={messages}
          loading={loading}
          onSend={sendMessage}
          onUpload={uploadFile}
        />
      </div>
    </div>
  )
}
