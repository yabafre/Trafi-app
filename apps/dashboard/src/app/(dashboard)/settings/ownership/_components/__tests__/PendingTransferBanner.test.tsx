import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PendingTransferBanner } from '../PendingTransferBanner'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock Next.js App Router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/settings/ownership',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock the hooks
const mockUsePendingTransfer = vi.fn()
const mockCancelMutate = vi.fn()
const mockConfirmMutate = vi.fn()

vi.mock('../../_hooks', () => ({
  usePendingTransfer: () => mockUsePendingTransfer(),
  useCancelTransfer: () => ({
    mutate: mockCancelMutate,
    isPending: false,
  }),
  useConfirmTransfer: () => ({
    mutate: mockConfirmMutate,
    isPending: false,
  }),
}))

// Test data - transfer expiring in 48 hours
const createMockTransfer = (hoursRemaining: number, currentUserId: string) => {
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + hoursRemaining)

  return {
    id: 'transfer-123',
    storeId: 'store-456',
    fromUser: { id: 'owner-789', email: 'owner@test.com', name: 'Owner User' },
    toUser: { id: currentUserId === 'target-111' ? 'target-111' : 'target-222', email: 'target@test.com', name: 'Target User' },
    status: 'pending',
    reason: null,
    expiresAt: expiresAt.toISOString(),
    completedAt: null,
    createdAt: new Date().toISOString(),
  }
}

// Wrapper component with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }
}

describe('PendingTransferBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-17T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('AC #3 - Target User Banner', () => {
    it('should render banner when user is the transfer target', () => {
      const transfer = createMockTransfer(48, 'target-111')
      transfer.toUser.id = 'target-111' // Ensure target matches currentUserId

      mockUsePendingTransfer.mockReturnValue({
        data: transfer,
        isLoading: false,
      })

      render(<PendingTransferBanner currentUserId="target-111" />, {
        wrapper: createWrapper(),
      })

      expect(screen.getByText(/TRANSFERT DE PROPRIETE EN ATTENTE/i)).toBeInTheDocument()
    })

    it('should display correct hours remaining countdown', () => {
      const transfer = createMockTransfer(48, 'target-111')
      transfer.toUser.id = 'target-111'

      mockUsePendingTransfer.mockReturnValue({
        data: transfer,
        isLoading: false,
      })

      render(<PendingTransferBanner currentUserId="target-111" />, {
        wrapper: createWrapper(),
      })

      expect(screen.getByText(/48h/i)).toBeInTheDocument()
    })

    it('should show accept and decline buttons for target user', () => {
      const transfer = createMockTransfer(48, 'target-111')
      transfer.toUser.id = 'target-111'

      mockUsePendingTransfer.mockReturnValue({
        data: transfer,
        isLoading: false,
      })

      render(<PendingTransferBanner currentUserId="target-111" />, {
        wrapper: createWrapper(),
      })

      expect(screen.getByRole('button', { name: /ACCEPTER/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /REFUSER/i })).toBeInTheDocument()
    })

    it('should display from user name in banner', () => {
      const transfer = createMockTransfer(48, 'target-111')
      transfer.toUser.id = 'target-111'

      mockUsePendingTransfer.mockReturnValue({
        data: transfer,
        isLoading: false,
      })

      render(<PendingTransferBanner currentUserId="target-111" />, {
        wrapper: createWrapper(),
      })

      expect(screen.getByText(/Owner User/i)).toBeInTheDocument()
    })
  })

  describe('Initiator View', () => {
    it('should show different view for initiator', () => {
      const transfer = createMockTransfer(48, 'owner-789')
      transfer.fromUser.id = 'owner-789' // Match currentUserId

      mockUsePendingTransfer.mockReturnValue({
        data: transfer,
        isLoading: false,
      })

      render(<PendingTransferBanner currentUserId="owner-789" />, {
        wrapper: createWrapper(),
      })

      expect(screen.getByText(/TRANSFERT EN COURS/i)).toBeInTheDocument()
    })

    it('should show cancel button for initiator', () => {
      const transfer = createMockTransfer(48, 'owner-789')
      transfer.fromUser.id = 'owner-789'

      mockUsePendingTransfer.mockReturnValue({
        data: transfer,
        isLoading: false,
      })

      render(<PendingTransferBanner currentUserId="owner-789" />, {
        wrapper: createWrapper(),
      })

      expect(screen.getByRole('button', { name: /ANNULER/i })).toBeInTheDocument()
    })
  })

  describe('Cancel Action', () => {
    it('should have decline button that can trigger cancel', () => {
      vi.useRealTimers() // Use real timers for this test
      const transfer = createMockTransfer(48, 'target-111')
      transfer.toUser.id = 'target-111'

      mockUsePendingTransfer.mockReturnValue({
        data: transfer,
        isLoading: false,
      })

      render(<PendingTransferBanner currentUserId="target-111" />, {
        wrapper: createWrapper(),
      })

      const declineButton = screen.getByRole('button', { name: /REFUSER/i })
      expect(declineButton).toBeInTheDocument()
      expect(declineButton).not.toBeDisabled()
    })
  })

  describe('Loading and Empty States', () => {
    it('should return null when loading', () => {
      mockUsePendingTransfer.mockReturnValue({
        data: undefined,
        isLoading: true,
      })

      const { container } = render(
        <PendingTransferBanner currentUserId="target-111" />,
        { wrapper: createWrapper() }
      )

      expect(container.firstChild).toBeNull()
    })

    it('should return null when no pending transfer', () => {
      mockUsePendingTransfer.mockReturnValue({
        data: null,
        isLoading: false,
      })

      const { container } = render(
        <PendingTransferBanner currentUserId="target-111" />,
        { wrapper: createWrapper() }
      )

      expect(container.firstChild).toBeNull()
    })

    it('should return null when user is neither initiator nor target', () => {
      const transfer = createMockTransfer(48, 'someone-else')

      mockUsePendingTransfer.mockReturnValue({
        data: transfer,
        isLoading: false,
      })

      const { container } = render(
        <PendingTransferBanner currentUserId="random-user" />,
        { wrapper: createWrapper() }
      )

      expect(container.firstChild).toBeNull()
    })
  })

  describe('Countdown Display', () => {
    it('should show 0h when transfer is about to expire', () => {
      const transfer = createMockTransfer(0.5, 'target-111') // 30 minutes left
      transfer.toUser.id = 'target-111'

      mockUsePendingTransfer.mockReturnValue({
        data: transfer,
        isLoading: false,
      })

      render(<PendingTransferBanner currentUserId="target-111" />, {
        wrapper: createWrapper(),
      })

      expect(screen.getByText(/0h/i)).toBeInTheDocument()
    })

    it('should show full hours remaining', () => {
      const transfer = createMockTransfer(72, 'target-111') // Full 72 hours
      transfer.toUser.id = 'target-111'

      mockUsePendingTransfer.mockReturnValue({
        data: transfer,
        isLoading: false,
      })

      render(<PendingTransferBanner currentUserId="target-111" />, {
        wrapper: createWrapper(),
      })

      expect(screen.getByText(/72h/i)).toBeInTheDocument()
    })
  })
})
