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
      {/* Sidebar - renders its own collapsed/expanded state */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        collapsed={!sidebarOpen}
        onNewChat={createNewChat}
        onSelectSession={switchSession}
        onDeleteSession={deleteChat}
        onToggle={toggle}
      />

      <ChatArea
        messages={messages}
        loading={loading}
        onSend={sendMessage}
        onUpload={uploadFile}
      />
    </div>
  )
}
