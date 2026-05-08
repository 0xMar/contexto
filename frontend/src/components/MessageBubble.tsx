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
              ? 'bg-red-50 text-red-700 border border-red-200 rounded-bl-sm'
              : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm'
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
                  <code className="bg-gray-100 text-red-600 px-1.5 py-0.5 rounded font-mono text-xs">
                    {children}
                  </code>
                ),
                pre: ({ children }) => (
                  <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto my-2 font-mono text-xs">
                    {children}
                  </pre>
                ),
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                h1: ({ children }) => <h1 className="text-lg font-bold my-2">{children}</h1>,
                h2: ({ children }) => <h2 className="text-base font-bold my-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-bold my-1">{children}</h3>,
                a: ({ href, children }) => (
                  <a href={href} className="text-indigo-600 hover:underline">
                    {children}
                  </a>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>

        {/* Source Citations */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {message.sources.map((source, idx) => (
              <a
                key={idx}
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  console.log(`Source: ${source.source}, Page: ${source.page}`)
                }}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  isUser
                    ? 'bg-indigo-500/20 text-indigo-700 hover:bg-indigo-500/30'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                }`}
              >
                <span className="truncate max-w-xs">{source.source}</span>
                <span className="text-indigo-500 font-semibold">p{source.page}</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
