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
  const [uploading, setUploading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'] },
    noClick: true,
    onDrop: async (files) => {
      if (!files[0]) return
      setUploadError(null)
      setUploading(true)
      try {
        await onUpload(files[0])
      } catch (e: unknown) {
        setUploadError(e instanceof Error ? e.message : 'Upload failed')
      } finally {
        setUploading(false)
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

  const isEmpty = messages.length === 0

  return (
    <div
      {...getRootProps()}
      className={`flex flex-col flex-1 h-screen relative transition-colors duration-200 ${
        isDragActive ? 'bg-indigo-50' : 'bg-white'
      }`}
    >
      <input {...getInputProps()} />

      {isDragActive && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-indigo-50/95 backdrop-blur-sm border-2 border-dashed border-indigo-300 rounded-lg m-4 pointer-events-none">
          <svg className="w-8 h-8 text-indigo-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-indigo-700 font-semibold">Drop your file here</p>
          <p className="text-indigo-600 text-xs mt-1">PDF or TXT files only</p>
        </div>
      )}

      {/* Messages Container */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        <div className="max-w-2xl mx-auto">
          {isEmpty && (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center mb-4 border border-indigo-200">
                <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Start a conversation</h2>
              <p className="text-sm text-gray-500 max-w-xs">
                Upload a PDF or TXT file, then ask questions about it. Sources will be cited automatically.
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}

          {loading && (
            <div className="flex justify-start mb-4 group">
              <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-1">
                AI
              </div>
              <div className="bg-white border border-gray-200 shadow-sm px-4 py-3 rounded-2xl rounded-bl-sm">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          {uploadError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">{uploadError}</p>
              </div>
              <button
                onClick={() => setUploadError(null)}
                className="text-red-500 hover:text-red-700 flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white px-4 sm:px-6 py-4 sm:py-6">
        <div className="max-w-2xl mx-auto">
          <form
            onSubmit={handleSubmit}
            className="flex items-end gap-3 bg-white border border-gray-200 rounded-2xl shadow-md px-4 py-3 hover:border-gray-300 focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-200 transition-all"
          >
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Ask a question about your document…"
              disabled={loading || uploading}
              className="flex-1 resize-none outline-none text-sm text-gray-800 placeholder-gray-400 max-h-40 leading-relaxed bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ height: 'auto' }}
              onInput={e => {
                const t = e.currentTarget
                t.style.height = 'auto'
                t.style.height = `${Math.min(t.scrollHeight, 160)}px`
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim() || uploading}
              className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center transition-colors flex-shrink-0"
              aria-label="Send message"
            >
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.5 3v14l15-7L2.5 3z" />
              </svg>
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-2 ml-1">
            Tip: Drag and drop files to upload, or use Shift+Enter for a new line
          </p>
        </div>
      </div>
    </div>
  )
}
