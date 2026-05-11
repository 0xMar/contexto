import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ChatArea from '@/components/ChatArea'
import type { Message } from '@/hooks/useChat'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useReducedMotion: () => false,
}))

vi.mock('react-dropzone', () => ({
  useDropzone: () => ({
    getRootProps: () => ({}),
    getInputProps: () => ({}),
    isDragActive: false,
    open: vi.fn(),
  }),
}))

vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => <div>{children}</div>,
}))

const defaultProps = {
  messages: [] as Message[],
  loading: false,
  onSend: vi.fn(),
  onUpload: vi.fn(),
}

describe('ChatArea', () => {
  it('shows empty state when no messages', () => {
    render(<ChatArea {...defaultProps} />)
    expect(screen.getByText('How can I help you?')).toBeInTheDocument()
  })

  it('renders messages when provided', () => {
    const messages: Message[] = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi!' },
    ]
    render(<ChatArea {...defaultProps} messages={messages} />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
    expect(screen.getByText('Hi!')).toBeInTheDocument()
  })

  it('calls onSend when send button is clicked', () => {
    const onSend = vi.fn()
    render(<ChatArea {...defaultProps} onSend={onSend} />)
    const textarea = screen.getByPlaceholderText(/ask a question/i)
    fireEvent.change(textarea, { target: { value: 'test query' } })
    fireEvent.click(screen.getByRole('button', { name: /send message/i }))
    expect(onSend).toHaveBeenCalledWith('test query')
  })

  it('calls onSend on Enter key (not Shift+Enter)', () => {
    const onSend = vi.fn()
    render(<ChatArea {...defaultProps} onSend={onSend} />)
    const textarea = screen.getByPlaceholderText(/ask a question/i)
    fireEvent.change(textarea, { target: { value: 'query' } })
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false })
    expect(onSend).toHaveBeenCalledWith('query')
  })

  it('does not call onSend on Shift+Enter', () => {
    const onSend = vi.fn()
    render(<ChatArea {...defaultProps} onSend={onSend} />)
    const textarea = screen.getByPlaceholderText(/ask a question/i)
    fireEvent.change(textarea, { target: { value: 'query' } })
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true })
    expect(onSend).not.toHaveBeenCalled()
  })

  it('disables send button when loading', () => {
    render(<ChatArea {...defaultProps} loading={true} />)
    expect(screen.getByRole('button', { name: /send message/i })).toBeDisabled()
  })

  it('disables send button when input is empty', () => {
    render(<ChatArea {...defaultProps} />)
    expect(screen.getByRole('button', { name: /send message/i })).toBeDisabled()
  })

  it('shows loading indicator when loading', () => {
    render(<ChatArea {...defaultProps} loading={true} />)
    // The bouncing dots container
    expect(screen.getAllByRole('button', { name: /send message/i })[0]).toBeDisabled()
    // AI avatar appears for loading indicator
    expect(screen.getByText('AI')).toBeInTheDocument()
  })
})
