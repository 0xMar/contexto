'use client'

import { useState, useEffect, useCallback } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export interface Source {
  source: string
  page: number
}

export interface Message {
  role: 'user' | 'assistant' | 'error'
  content: string
  sources?: Source[]
}

export interface Session {
  session_id: string
  title: string
  created_at: string
}

export function useChat() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string>('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [sessionsPage, setSessionsPage] = useState(0)
  const [sessionsHasMore, setSessionsHasMore] = useState(false)
  const [historyPage, setHistoryPage] = useState(0)
  const [historyHasMore, setHistoryHasMore] = useState(false)

  const SESSIONS_LIMIT = 20
  const HISTORY_LIMIT = 50

  // Load sessions from backend on mount
  useEffect(() => {
    fetch(`${API_URL}/sessions?limit=${SESSIONS_LIMIT}&offset=0`)
      .then(r => r.json())
      .then((data: { items: Session[]; has_more: boolean }) => {
        setSessions(data.items)
        setSessionsHasMore(data.has_more)
        setSessionsPage(0)
        if (data.items.length > 0) {
          switchSession(data.items[0].session_id)
        } else {
          createNewChat()
        }
      })
      .catch(() => createNewChat())
  }, [])

  const switchSession = useCallback(async (sessionId: string) => {
    setActiveSessionId(sessionId)
    setMessages([])
    try {
      const res = await fetch(`${API_URL}/history/${sessionId}?limit=${HISTORY_LIMIT}&offset=0`)
      const history = await res.json()
      setMessages(history.items.map((m: { role: string; content: string }) => ({
        role: m.role as Message['role'],
        content: m.content,
      })))
      setHistoryHasMore(history.has_more)
      setHistoryPage(0)
    } catch {
      setMessages([{ role: 'error', content: 'Could not load chat history.' }])
    }
  }, [])

  const createNewChat = useCallback(async () => {
    const sessionId = crypto.randomUUID()
    try {
      await fetch(`${API_URL}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      })
    } catch { /* will still work locally */ }

    const newSession: Session = {
      session_id: sessionId,
      title: 'New Chat',
      created_at: new Date().toISOString(),
    }
    setSessions(prev => [newSession, ...prev])
    setActiveSessionId(sessionId)
    setMessages([])
    setSessionsPage(0)
    setSessionsHasMore(false)
    return sessionId
  }, [])

  const deleteChat = useCallback(async (sessionId: string) => {
    await fetch(`${API_URL}/sessions/${sessionId}`, { method: 'DELETE' })
    setSessions(prev => prev.filter(s => s.session_id !== sessionId))
    if (activeSessionId === sessionId) {
      const remaining = sessions.filter(s => s.session_id !== sessionId)
      if (remaining.length > 0) {
        switchSession(remaining[0].session_id)
      } else {
        createNewChat()
      }
    }
    setHistoryPage(0)
  }, [activeSessionId, sessions, switchSession, createNewChat])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !activeSessionId) return

    setMessages(prev => [...prev, { role: 'user', content: text }])
    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, session_id: activeSessionId }),
      })
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail ?? 'Request failed')
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No reader')

      const decoder = new TextDecoder()
      let assistantContent = ''
      
      // Initial empty assistant message
      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      let currentEvent = 'message'

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim()
          } else if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()

            if (currentEvent === 'done') break

            if (currentEvent === 'error') {
              const err = JSON.parse(data)
              setMessages(prev => {
                const msgs = [...prev]
                if (msgs[msgs.length - 1]?.role === 'assistant') msgs.pop()
                return [...msgs, { role: 'error' as const, content: err.detail ?? 'An error occurred' }]
              })
              break
            }

            if (currentEvent === 'metadata') {
              const metadata = JSON.parse(data)
              setMessages(prev => {
                const newMessages = [...prev]
                const last = newMessages[newMessages.length - 1]
                if (last.role === 'assistant') {
                  last.sources = metadata.sources
                }
                return newMessages
              })
            } else {
              assistantContent += data
              setMessages(prev => {
                const newMessages = [...prev]
                const last = newMessages[newMessages.length - 1]
                if (last.role === 'assistant') {
                  last.content = assistantContent
                }
                return newMessages
              })
            }
          }
        }
      }

      // Update title after first message
      setSessions(prev => prev.map(s =>
        s.session_id === activeSessionId && s.title === 'New Chat'
          ? { ...s, title: text.slice(0, 50) }
          : s
      ))
    } catch (e: unknown) {
      setMessages(prev => [...prev, {
        role: 'error',
        content: e instanceof Error ? e.message : 'Could not reach the server',
      }])
    } finally {
      setLoading(false)
    }
  }, [activeSessionId])

  const uploadFile = useCallback(async (file: File): Promise<void> => {
    if (!activeSessionId) return
    const formData = new FormData()
    formData.append('file', file)
    formData.append('session_id', activeSessionId)

    const res = await fetch(`${API_URL}/upload`, { method: 'POST', body: formData })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail ?? 'Upload failed')
    }
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `Document uploaded: ${file.name}`,
    }])
  }, [activeSessionId])

  const loadMoreSessions = useCallback(async () => {
    if (!sessionsHasMore) return
    const nextOffset = (sessionsPage + 1) * SESSIONS_LIMIT
    try {
      const res = await fetch(`${API_URL}/sessions?limit=${SESSIONS_LIMIT}&offset=${nextOffset}`)
      const data = await res.json()
      setSessions(prev => [...prev, ...data.items])
      setSessionsPage(prev => prev + 1)
      setSessionsHasMore(data.has_more)
    } catch { /* silently fail */ }
  }, [sessionsPage, sessionsHasMore])

  const loadMoreHistory = useCallback(async () => {
    if (!historyHasMore || !activeSessionId) return
    const nextOffset = (historyPage + 1) * HISTORY_LIMIT
    try {
      const res = await fetch(`${API_URL}/history/${activeSessionId}?limit=${HISTORY_LIMIT}&offset=${nextOffset}`)
      const data = await res.json()
      setMessages(prev => [...data.items, ...prev])
      setHistoryPage(prev => prev + 1)
      setHistoryHasMore(data.has_more)
    } catch { /* silently fail */ }
  }, [activeSessionId, historyPage, historyHasMore])

  return {
    sessions,
    activeSessionId,
    messages,
    loading,
    sessionsHasMore,
    historyHasMore,
    createNewChat,
    switchSession,
    deleteChat,
    sendMessage,
    uploadFile,
    loadMoreSessions,
    loadMoreHistory,
  }
}
