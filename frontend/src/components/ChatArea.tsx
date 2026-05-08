'use client'

import { useState, useRef, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import MessageBubble from './MessageBubble'
import { Message } from '@/hooks/useChat'

interface Props {
  messages: Message[]
  loading: boolean
  onSend: (text: string) => void
  onUpload: (file: File) => Promise<void>
}

export default function ChatArea({ messages, loading, onSend, onUpload }: Props) {
  const [input, setInput] = useState('')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'] },
    noClick: true,
    onDrop: async (files) => {
      if (!files[0]) return
      setUploadError(null)
      try {
        await onUpload(files[0])
      } catch (e: unknown) {
        setUploadError(e instanceof Error ? e.message : 'Upload failed')
      }
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return
    onSend(input)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  return (
    <div
      {...getRootProps()}
      className={`flex flex-col flex-1 h-screen relative transition-colors ${
        isDragActive ? 'bg-indigo-50' : 'bg-gray-50'
      }`}
    >
      <input {...getInputProps()} />

      {isDragActive && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-indigo-50/90 border-2 border-dashed border-indigo-400 rounded-lg m-4 pointer-events-none">
          <p className="text-indigo-600 font-medium">Drop your file here</p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mb-3">
              <span className="text-indigo-500 text-xl">💬</span>
            </div>
            <p className="text-sm">Drop a PDF or TXT file, then start chatting</p>
          </div>
        )}
        {messages.map((msg, i) => <MessageBubble key={i} message={msg} />)}
        {loading && (
          <div className="flex justify-start mb-4">
            <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-1">
              AI
            </div>
            <div className="bg-white border border-gray-100 shadow-sm px-4 py-2.5 rounded-2xl rounded-bl-sm">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}
        {uploadError && (
          <div className="text-red-500 text-sm text-center mb-2">{uploadError}</div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 pb-6">
        <form
          onSubmit={handleSubmit}
          className="flex items-end gap-2 bg-white border border-gray-200 rounded-2xl shadow-sm px-4 py-3"
        >
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Ask a question… (drag & drop a file to upload)"
            className="flex-1 resize-none outline-none text-sm text-gray-800 placeholder-gray-400 max-h-32 leading-relaxed"
            style={{ height: 'auto' }}
            onInput={e => {
              const t = e.currentTarget
              t.style.height = 'auto'
              t.style.height = `${t.scrollHeight}px`
            }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4 text-white rotate-90" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  )
}
