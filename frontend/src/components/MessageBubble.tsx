'use client'

import { Message } from '@/hooks/useChat'
import ReactMarkdown from 'react-markdown'

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  const isError = message.role === 'error'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 group`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-1">
          AI
        </div>
      )}
      <div className={`flex flex-col max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-indigo-600 text-white rounded-br-sm'
              : isError
              ? 'bg-red-950/50 text-red-300 border border-red-800 rounded-bl-sm'
              : 'bg-[#2f2f2f] text-gray-100 border border-white/10 rounded-bl-sm'
          }`}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap">{message.content}</div>
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
