import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Sidebar from '@/components/Sidebar'
import type { Session } from '@/hooks/useChat'

vi.mock('framer-motion', () => ({
  motion: {
    aside: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => <aside {...props}>{children}</aside>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useReducedMotion: () => false,
}))

const sessions: Session[] = [
  { session_id: 's1', title: 'First Chat', created_at: '' },
  { session_id: 's2', title: 'Second Chat', created_at: '' },
]

const defaultProps = {
  sessions,
  activeSessionId: 's1',
  isOpen: true,
  onNewChat: vi.fn(),
  onSelectSession: vi.fn(),
  onDeleteSession: vi.fn(),
  onClose: vi.fn(),
  onLoadMore: vi.fn(),
  hasMoreSessions: false,
}

describe('Sidebar', () => {
  it('renders all session titles', () => {
    render(<Sidebar {...defaultProps} />)
    expect(screen.getAllByText('First Chat').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Second Chat').length).toBeGreaterThan(0)
  })

  it('shows empty state when no sessions', () => {
    render(<Sidebar {...defaultProps} sessions={[]} />)
    expect(screen.getAllByText('No chats yet').length).toBeGreaterThan(0)
  })

  it('calls onNewChat when New chat button is clicked', () => {
    const onNewChat = vi.fn()
    render(<Sidebar {...defaultProps} onNewChat={onNewChat} />)
    fireEvent.click(screen.getAllByRole('button', { name: /new chat/i })[0])
    expect(onNewChat).toHaveBeenCalledOnce()
  })

  it('calls onSelectSession with correct id', () => {
    const onSelectSession = vi.fn()
    render(<Sidebar {...defaultProps} onSelectSession={onSelectSession} />)
    fireEvent.click(screen.getAllByText('Second Chat')[0])
    expect(onSelectSession).toHaveBeenCalledWith('s2')
  })

  it('calls onDeleteSession when delete button is clicked', () => {
    const onDeleteSession = vi.fn()
    render(<Sidebar {...defaultProps} onDeleteSession={onDeleteSession} />)
    const deleteBtn = screen.getAllByRole('button', { name: /delete second chat/i })[0]
    fireEvent.click(deleteBtn)
    expect(onDeleteSession).toHaveBeenCalledWith('s2')
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<Sidebar {...defaultProps} onClose={onClose} />)
    fireEvent.click(screen.getAllByRole('button', { name: /close sidebar/i })[0])
    expect(onClose).toHaveBeenCalledOnce()
  })
})
