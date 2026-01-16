import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useInviteUser } from '../useInviteUser'
import { useUpdateUserRole } from '../useUpdateUserRole'
import { useDeactivateUser } from '../useDeactivateUser'
import type { UserResponse } from '@trafi/validators'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock the server action hooks
const mockMutate = vi.fn()
const mockMutateAsync = vi.fn()
const mockMutationState = {
  mutate: mockMutate,
  mutateAsync: mockMutateAsync,
  isPending: false,
  isSuccess: false,
  isError: false,
  error: null,
  data: undefined,
  reset: vi.fn(),
}

vi.mock('@/lib/server-action-hooks', () => ({
  useServerActionMutation: vi.fn(() => mockMutationState),
}))

// Mock the user actions
vi.mock('../../_actions/user-actions', () => ({
  inviteUserAction: vi.fn(),
  updateUserRoleAction: vi.fn(),
  deactivateUserAction: vi.fn(),
}))

import { useServerActionMutation } from '@/lib/server-action-hooks'
import { toast } from 'sonner'
import {
  inviteUserAction,
  updateUserRoleAction,
  deactivateUserAction,
} from '../../_actions/user-actions'

const mockUseServerActionMutation = vi.mocked(useServerActionMutation)

// Test data
const mockUserResponse: UserResponse = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'ADMIN',
  status: 'ACTIVE',
  lastLoginAt: null,
  createdAt: new Date('2024-01-01'),
}

// Wrapper component with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
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

describe('useInviteUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseServerActionMutation.mockReturnValue(mockMutationState as ReturnType<typeof useServerActionMutation>)
  })

  it('should call useServerActionMutation with inviteUserAction', () => {
    renderHook(() => useInviteUser(), { wrapper: createWrapper() })

    expect(mockUseServerActionMutation).toHaveBeenCalledWith(
      inviteUserAction,
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      })
    )
  })

  it('should return mutation functions and state', () => {
    const { result } = renderHook(() => useInviteUser(), { wrapper: createWrapper() })

    expect(result.current.mutate).toBeDefined()
    expect(result.current.isPending).toBe(false)
  })

  it('should invalidate users query on success', async () => {
    // Capture the onSuccess callback
    let capturedOnSuccess: (() => Promise<void>) | undefined

    mockUseServerActionMutation.mockImplementation((action, options) => {
      capturedOnSuccess = options?.onSuccess as () => Promise<void>
      return mockMutationState as ReturnType<typeof useServerActionMutation>
    })

    const queryClient = new QueryClient()
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')

    renderHook(() => useInviteUser(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    })

    // Call the onSuccess callback
    if (capturedOnSuccess) {
      await capturedOnSuccess()
    }

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['users'] })
    expect(toast.success).toHaveBeenCalledWith('Invitation envoyée')
  })

  it('should show error toast on failure', () => {
    // Capture the onError callback
    let capturedOnError: ((error: Error) => void) | undefined

    mockUseServerActionMutation.mockImplementation((action, options) => {
      capturedOnError = options?.onError as (error: Error) => void
      return mockMutationState as ReturnType<typeof useServerActionMutation>
    })

    renderHook(() => useInviteUser(), { wrapper: createWrapper() })

    // Call the onError callback
    if (capturedOnError) {
      capturedOnError(new Error('Email already exists'))
    }

    expect(toast.error).toHaveBeenCalledWith('Email already exists')
  })
})

describe('useUpdateUserRole', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseServerActionMutation.mockReturnValue(mockMutationState as ReturnType<typeof useServerActionMutation>)
  })

  it('should call useServerActionMutation with updateUserRoleAction', () => {
    renderHook(() => useUpdateUserRole(), { wrapper: createWrapper() })

    expect(mockUseServerActionMutation).toHaveBeenCalledWith(
      updateUserRoleAction,
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      })
    )
  })

  it('should return mutation functions and state', () => {
    const { result } = renderHook(() => useUpdateUserRole(), { wrapper: createWrapper() })

    expect(result.current.mutate).toBeDefined()
    expect(result.current.isPending).toBe(false)
  })

  it('should invalidate users query and show success toast on success', async () => {
    let capturedOnSuccess: (() => Promise<void>) | undefined

    mockUseServerActionMutation.mockImplementation((action, options) => {
      capturedOnSuccess = options?.onSuccess as () => Promise<void>
      return mockMutationState as ReturnType<typeof useServerActionMutation>
    })

    const queryClient = new QueryClient()
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')

    renderHook(() => useUpdateUserRole(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    })

    if (capturedOnSuccess) {
      await capturedOnSuccess()
    }

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['users'] })
    expect(toast.success).toHaveBeenCalledWith('Rôle mis à jour')
  })
})

describe('useDeactivateUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseServerActionMutation.mockReturnValue(mockMutationState as ReturnType<typeof useServerActionMutation>)
  })

  it('should call useServerActionMutation with deactivateUserAction', () => {
    renderHook(() => useDeactivateUser(), { wrapper: createWrapper() })

    expect(mockUseServerActionMutation).toHaveBeenCalledWith(
      deactivateUserAction,
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      })
    )
  })

  it('should return mutation functions and state', () => {
    const { result } = renderHook(() => useDeactivateUser(), { wrapper: createWrapper() })

    expect(result.current.mutate).toBeDefined()
    expect(result.current.isPending).toBe(false)
  })

  it('should invalidate users query and show success toast on success', async () => {
    let capturedOnSuccess: (() => Promise<void>) | undefined

    mockUseServerActionMutation.mockImplementation((action, options) => {
      capturedOnSuccess = options?.onSuccess as () => Promise<void>
      return mockMutationState as ReturnType<typeof useServerActionMutation>
    })

    const queryClient = new QueryClient()
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')

    renderHook(() => useDeactivateUser(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    })

    if (capturedOnSuccess) {
      await capturedOnSuccess()
    }

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['users'] })
    expect(toast.success).toHaveBeenCalledWith('Utilisateur désactivé')
  })

  it('should show error toast on failure', () => {
    let capturedOnError: ((error: Error) => void) | undefined

    mockUseServerActionMutation.mockImplementation((action, options) => {
      capturedOnError = options?.onError as (error: Error) => void
      return mockMutationState as ReturnType<typeof useServerActionMutation>
    })

    renderHook(() => useDeactivateUser(), { wrapper: createWrapper() })

    if (capturedOnError) {
      capturedOnError(new Error('Cannot deactivate last Owner'))
    }

    expect(toast.error).toHaveBeenCalledWith('Cannot deactivate last Owner')
  })
})
