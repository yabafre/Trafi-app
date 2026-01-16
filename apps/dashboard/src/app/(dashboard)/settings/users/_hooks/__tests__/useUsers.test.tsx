import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useUsers } from '../useUsers'
import type { UsersListResponse } from '@trafi/validators'

// Mock the server action hooks
vi.mock('@/lib/server-action-hooks', () => ({
  useServerActionQuery: vi.fn(),
}))

// Mock the user actions
vi.mock('../../_actions/user-actions', () => ({
  getUsersAction: vi.fn(),
}))

import { useServerActionQuery } from '@/lib/server-action-hooks'

const mockUseServerActionQuery = vi.mocked(useServerActionQuery)

// Test data
const mockUsersResponse: UsersListResponse = {
  users: [
    {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'ADMIN',
      status: 'ACTIVE',
      lastLoginAt: null,
      createdAt: new Date('2024-01-01'),
    },
  ],
  total: 1,
  page: 1,
  limit: 20,
  totalPages: 1,
}

// Wrapper component with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }
}

describe('useUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call useServerActionQuery with correct parameters', () => {
    mockUseServerActionQuery.mockReturnValue({
      data: mockUsersResponse,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useServerActionQuery>)

    renderHook(() => useUsers(), { wrapper: createWrapper() })

    expect(mockUseServerActionQuery).toHaveBeenCalledWith(
      expect.any(Function), // getUsersAction
      expect.objectContaining({
        input: { page: 1, limit: 20 },
        queryKey: ['users', { page: 1, limit: 20 }],
      })
    )
  })

  it('should return users list data structure', () => {
    mockUseServerActionQuery.mockReturnValue({
      data: mockUsersResponse,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useServerActionQuery>)

    const { result } = renderHook(() => useUsers(), { wrapper: createWrapper() })

    expect(result.current.data).toEqual(mockUsersResponse)
    expect(result.current.data?.users).toHaveLength(1)
    expect(result.current.data?.total).toBe(1)
    expect(result.current.data?.page).toBe(1)
    expect(result.current.data?.limit).toBe(20)
    expect(result.current.data?.totalPages).toBe(1)
  })

  it('should support custom pagination input', () => {
    mockUseServerActionQuery.mockReturnValue({
      data: mockUsersResponse,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useServerActionQuery>)

    renderHook(() => useUsers({ page: 2, limit: 50 }), { wrapper: createWrapper() })

    expect(mockUseServerActionQuery).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        input: { page: 2, limit: 50 },
        queryKey: ['users', { page: 2, limit: 50 }],
      })
    )
  })

  it('should support filtering by status', () => {
    mockUseServerActionQuery.mockReturnValue({
      data: mockUsersResponse,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useServerActionQuery>)

    renderHook(() => useUsers({ page: 1, limit: 20, status: 'ACTIVE' }), {
      wrapper: createWrapper(),
    })

    expect(mockUseServerActionQuery).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        input: { page: 1, limit: 20, status: 'ACTIVE' },
        queryKey: ['users', { page: 1, limit: 20, status: 'ACTIVE' }],
      })
    )
  })

  it('should return loading state correctly', () => {
    mockUseServerActionQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as ReturnType<typeof useServerActionQuery>)

    const { result } = renderHook(() => useUsers(), { wrapper: createWrapper() })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()
  })

  it('should return error state correctly', () => {
    const mockError = new Error('Failed to fetch users')
    mockUseServerActionQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: mockError,
    } as ReturnType<typeof useServerActionQuery>)

    const { result } = renderHook(() => useUsers(), { wrapper: createWrapper() })

    expect(result.current.error).toBe(mockError)
    expect(result.current.data).toBeUndefined()
  })
})
