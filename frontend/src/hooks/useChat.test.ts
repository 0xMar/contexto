import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useChat } from './useChat'

// Mock global fetch
global.fetch = vi.fn()

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString()
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
  }
})()

Object.defineProperty(global, 'localStorage', { value: localStorageMock })

describe('useChat hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('should initialize and load history', async () => {
    const mockSession = [{ session_id: '123', title: 'Test Chat', created_at: '' }]
    const mockHistory = [{ role: 'user', content: 'hello' }]
    
    ;(fetch as any)
      .mockResolvedValueOnce({ ok: true, json: async () => mockSession })
      .mockResolvedValueOnce({ ok: true, json: async () => mockHistory })

    const { result } = renderHook(() => useChat())
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50))
    })

    expect(result.current.messages.length).toBe(1)
  })

  it('should send a message and handle streaming', async () => {
    const mockSession = [{ session_id: '123', title: 'New Chat', created_at: '' }]
    
    // Mock SSE Stream
    const mockStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: AI \n\n'))
        controller.enqueue(new TextEncoder().encode('data: response\n\n'))
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
        controller.close()
      }
    })

    ;(fetch as any)
      .mockResolvedValueOnce({ ok: true, json: async () => mockSession }) // /sessions
      .mockResolvedValueOnce({ ok: true, json: async () => [] }) // /history
      .mockResolvedValueOnce({
        ok: true,
        body: mockStream
      })

    const { result } = renderHook(() => useChat())

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50))
    })

    await act(async () => {
      await result.current.sendMessage('test message')
    })

    expect(result.current.messages).toContainEqual(expect.objectContaining({ 
      role: 'user', content: 'test message' 
    }))
    expect(result.current.messages).toContainEqual(expect.objectContaining({ 
      role: 'assistant', content: 'AIresponse' 
    }))
  })
})
