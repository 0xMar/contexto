import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import MessageBubble from '@/components/MessageBubble'
import type { Message } from '@/hooks/useChat'

vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => <div data-testid="markdown">{children}</div>,
}))

describe('MessageBubble', () => {
  it('renders user message aligned right', () => {
    const msg: Message = { role: 'user', content: 'Hello!' }
    const { container } = render(<MessageBubble message={msg} />)
    expect(screen.getByText('Hello!')).toBeInTheDocument()
    expect(container.firstChild).toHaveClass('justify-end')
  })

  it('renders assistant message with AI avatar', () => {
    const msg: Message = { role: 'assistant', content: 'Hi there' }
    render(<MessageBubble message={msg} />)
    expect(screen.getByText('AI')).toBeInTheDocument()
    expect(screen.getByTestId('markdown')).toHaveTextContent('Hi there')
  })

  it('renders error message with error styling', () => {
    const msg: Message = { role: 'error', content: 'Something went wrong' }
    const { container } = render(<MessageBubble message={msg} />)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    // error bubble has red styling
    const bubble = container.querySelector('.bg-red-950\\/50')
    expect(bubble).toBeInTheDocument()
  })

  it('renders sources when present', () => {
    const msg: Message = {
      role: 'assistant',
      content: 'Answer',
      sources: [{ source: 'doc.pdf', page: 3 }],
    }
    render(<MessageBubble message={msg} />)
    expect(screen.getByText('doc.pdf')).toBeInTheDocument()
    expect(screen.getByText('p3')).toBeInTheDocument()
  })

  it('does not render sources section when sources is empty', () => {
    const msg: Message = { role: 'assistant', content: 'Answer', sources: [] }
    const { container } = render(<MessageBubble message={msg} />)
    expect(container.querySelector('.flex-wrap')).not.toBeInTheDocument()
  })
})
