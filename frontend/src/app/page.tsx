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
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div
        className={`transition-all duration-300 ease-in-out flex-shrink-0 ${
          sidebarOpen ? 'w-64' : 'w-0'
        } overflow-hidden`}
      >
        <Sidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onNewChat={createNewChat}
          onSelectSession={switchSession}
          onDeleteSession={deleteChat}
          onToggleSidebar={toggle}
        />
      </div>

      {/* Floating toggle button — visible only when sidebar is hidden */}
      {!sidebarOpen && (
        <button
          onClick={toggle}
          className="absolute top-3 left-3 z-20 p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
          aria-label="Show sidebar"
          title="Show sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      <ChatArea
        messages={messages}
        loading={loading}
        onSend={sendMessage}
        onUpload={uploadFile}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={toggle}
      />
    </div>
  )
}
