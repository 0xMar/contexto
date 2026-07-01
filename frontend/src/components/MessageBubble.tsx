'use client'

import { useState } from 'react'
import { Message } from '@/hooks/useChat'
import ReactMarkdown from 'react-markdown'
import { Copy, Check } from 'lucide-react'

interface Props {
  message: Message
  loading?: boolean
}

export default function MessageBubble({ message, loading }: Props) {
  const isUser = message.role === 'user'
  const isError = message.role === 'error'
  const [copied, setCopied] = useState(false)

  const isStreaming = loading && message.role === 'assistant' && !message.content

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* silently fail */ }
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 group`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-1">
          AI
        </div>
      )}
      <div className={`flex flex-col max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`relative px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-indigo-600 text-white rounded-br-sm'
              : isError
              ? 'bg-red-950/50 text-red-300 border border-red-800 rounded-bl-sm'
              : 'bg-[#2f2f2f] text-gray-100 border border-white/10 rounded-bl-sm'
          }`}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap">{message.content}</div>
          ) : isStreaming ? (
            <div className="flex gap-1.5 py-1">
              {[0, 150, 300].map(delay => (
                <span
                  key={delay}
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
          ) : (
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="my-1">{children}</p>,
                ul: ({ children }) => <ul className="my-2 pl-4 list-disc">{children}</ul>,
                ol: ({ children }) => <ol className="my-2 pl-4 list-decimal">{children}</ol>,
                li: ({ children }) => <li className="my-0.5">{children}</li>,
                code: ({ children }) => (
                  <code className="bg-black/30 text-indigo-300 px-1.5 py-0.5 rounded font-mono text-xs">
                    {children}
                  </code>
                ),
                pre: ({ children }) => (
                  <pre className="bg-black/40 text-gray-200 p-3 rounded-lg overflow-x-auto my-2 font-mono text-xs border border-white/10">
                    {children}
                  </pre>
                ),
                strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                a: ({ href, children }) => (
                  <a href={href} className="text-indigo-400 hover:underline">{children}</a>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}

          {/* Copy button */}
          {!isStreaming && message.content && (
            <button
              onClick={handleCopy}
              className="absolute -top-2 -right-2 p-1 rounded-full bg-[#1f1f1f] border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#3f3f3f]"
              aria-label={copied ? 'Copied' : 'Copy message'}
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-green-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-gray-400" />
              )}
            </button>
          )}
        </div>

        {message.sources && message.sources.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {message.sources.map((source, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/20"
              >
                <span className="truncate max-w-[160px]">{source.source}</span>
                <span className="text-indigo-400 font-semibold">p{source.page}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
