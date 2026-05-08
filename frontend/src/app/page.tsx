'use client'

import Sidebar from '@/components/Sidebar'
import ChatArea from '@/components/ChatArea'
import { useChat } from '@/hooks/useChat'

export default function Home() {
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

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onNewChat={createNewChat}
        onSelectSession={switchSession}
        onDeleteSession={deleteChat}
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
