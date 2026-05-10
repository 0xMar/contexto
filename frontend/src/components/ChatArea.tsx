'use client'

import { useState, useRef, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ArrowUp, Paperclip, X } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import MessageBubble from './MessageBubble'
import { Message } from '@/hooks/useChat'
import { cn } from '@/lib/utils'

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
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' })
  }, [messages, loading, reducedMotion])

  const { getRootProps, getInputProps, isDragActive, open: openFilePicker } = useDropzone({
    accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'] },
    noClick: true,
    onDrop: async (files) => {
      if (!files[0]) return
      setUploadError(null)
      setUploading(true)
      try { await onUpload(files[0]) }
      catch (e: unknown) { setUploadError(e instanceof Error ? e.message : 'Upload failed') }
      finally { setUploading(false) }
    },
  })

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || loading) return
    onSend(input)
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const t = e.target
    t.style.height = 'auto'
    t.style.height = `${Math.min(t.scrollHeight, 200)}px`
  }

  const isEmpty = messages.length === 0
  const canSend = input.trim().length > 0 && !loading && !uploading

  return (
    <div
      {...getRootProps()}
      className={cn(
        'flex flex-col h-full relative transition-colors duration-200',
        isDragActive && 'bg-indigo-950/20'
      )}
    >
      <label className="sr-only">
        Upload PDF or TXT file
        <input {...getInputProps()} />
      </label>

      {/* Drag overlay */}
      <AnimatePresence>
        {isDragActive && (
          <motion.div
            initial={{ opacity: reducedMotion ? 1 : 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: reducedMotion ? 1 : 0 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#212121]/90 backdrop-blur-sm border-2 border-dashed border-indigo-500 m-4 rounded-xl pointer-events-none"
          >
            <Paperclip className="w-8 h-8 text-indigo-400 mb-2" aria-hidden="true" />
            <p className="text-indigo-300 font-semibold">Drop your file here</p>
            <p className="text-indigo-400 text-xs mt-1">PDF or TXT</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {isEmpty && (
            <div className="flex flex-col items-center justify-center text-center py-20">
              <div className="w-14 h-14 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mb-4">
                <span className="text-indigo-400 text-xl font-bold">C</span>
              </div>
              <h2 className="text-lg font-semibold text-white mb-1">How can I help you?</h2>
              <p className="text-sm text-gray-500 max-w-xs">
                Upload a PDF or TXT file, then ask questions. Sources are cited automatically.
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}

          {loading && (
            <div className="flex justify-start mb-4">
              <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-1">
                AI
              </div>
              <div className="bg-[#2f2f2f] border border-white/10 px-4 py-3 rounded-2xl rounded-bl-sm">
                <div className="flex gap-1.5">
                  {[0, 150, 300].map(delay => (
                    <span
                      key={delay}
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Upload error */}
          <div aria-live="polite" aria-atomic="true">
            <AnimatePresence>
              {uploadError && (
                <motion.div
                  initial={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 8 }}
                  className="mb-4 p-3 rounded-lg bg-red-950/50 border border-red-800 flex items-start gap-2"
                >
                  <p className="text-sm text-red-300 flex-1">{uploadError}</p>
                  <button
                    onClick={() => setUploadError(null)}
                    className="text-red-400 hover:text-red-200"
                    aria-label="Dismiss error"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input area — Claude style */}
      <div className="px-4 pb-6 pt-2">
        <div className="max-w-2xl mx-auto">
          <div className="relative bg-[#2f2f2f] border border-white/10 rounded-2xl shadow-lg hover:border-white/20 focus-within:border-indigo-500/50 transition-colors">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={autoResize}
              onKeyDown={handleKeyDown}
              rows={1}
              name="message"
              autoComplete="off"
              spellCheck={false}
              placeholder="Ask a question about your document…"
              disabled={loading || uploading}
              className="w-full bg-transparent text-white placeholder:text-gray-500 text-sm leading-relaxed px-4 pt-3.5 pb-12 max-h-[200px] border-0 focus-visible:ring-0"
            />

            {/* Bottom toolbar */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <button
                type="button"
                onClick={openFilePicker}
                disabled={uploading}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                aria-label="Upload file"
                title="Upload PDF or TXT"
              >
                {uploading ? (
                  <motion.div
                    animate={reducedMotion ? {} : { rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"
                  />
                ) : (
                  <Paperclip className="w-4 h-4" aria-hidden="true" />
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!canSend}
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center transition-all',
                  canSend
                    ? 'bg-white text-black hover:bg-gray-200'
                    : 'bg-white/10 text-gray-600 cursor-not-allowed'
                )}
                aria-label="Send message"
              >
                <ArrowUp className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-2 text-center">
            Drag & drop files · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  )
}
