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
    <div className="relative h-screen overflow-hidden">
      {/* Sidebar overlay backdrop on mobile */}
      {sidebarOpen && (
        <div
          onClick={toggle}
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        isOpen={sidebarOpen}
        onNewChat={createNewChat}
        onSelectSession={switchSession}
        onDeleteSession={deleteChat}
      />

      {/* Main chat area */}
      <div className="flex flex-col h-screen">
        <ChatArea
          messages={messages}
          loading={loading}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={toggle}
          onSend={sendMessage}
          onUpload={uploadFile}
        />
      </div>
    </div>
  )
}
