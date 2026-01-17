import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TransferHistoryTable } from '../TransferHistoryTable'

// Mock the hooks
const mockUseTransferHistory = vi.fn()

vi.mock('../../_hooks', () => ({
  useTransferHistory: () => mockUseTransferHistory(),
}))

// Test data - direct array since useTransferHistory returns TransferResponse[]
const mockTransfers = [
  {
    id: 'transfer-1',
    storeId: 'store-123',
    fromUser: { id: 'owner-1', email: 'owner@test.com', name: 'Owner' },
    toUser: { id: 'admin-1', email: 'admin@test.com', name: 'Admin' },
    status: 'confirmed',
    reason: null,
    expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date().toISOString(),
    createdAt: new Date('2024-01-15').toISOString(),
  },
  {
    id: 'transfer-2',
    storeId: 'store-123',
    fromUser: { id: 'admin-1', email: 'admin@test.com', name: 'Admin' },
    toUser: { id: 'editor-1', email: 'editor@test.com', name: 'Editor' },
    status: 'cancelled',
    reason: 'Changed my mind',
    expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    completedAt: null,
    createdAt: new Date('2024-01-10').toISOString(),
  },
]

// Wrapper component with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
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

describe('TransferHistoryTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock implementations
    mockUseTransferHistory.mockReturnValue({
      data: mockTransfers,
      isLoading: false,
    })
  })

  describe('AC #6 - Audit Trail', () => {
    it('should render history section with title', () => {
      render(<TransferHistoryTable />, { wrapper: createWrapper() })

      expect(screen.getByText('HISTORIQUE')).toBeInTheDocument()
    })

    it('should display transfer records', () => {
      render(<TransferHistoryTable />, { wrapper: createWrapper() })

      // Check first transfer - Owner appears twice (as fromUser in transfer-1 and toUser in transfer-2)
      expect(screen.getAllByText('Owner').length).toBeGreaterThanOrEqual(1)
      // Admin appears as toUser in transfer-1 and fromUser in transfer-2
      expect(screen.getAllByText('Admin').length).toBeGreaterThanOrEqual(1)

      // Check second transfer
      expect(screen.getByText('Editor')).toBeInTheDocument()
    })

    it('should display status badges with correct labels', () => {
      render(<TransferHistoryTable />, { wrapper: createWrapper() })

      expect(screen.getByText('CONFIRME')).toBeInTheDocument()
      expect(screen.getByText('ANNULE')).toBeInTheDocument()
    })

    it('should display dates in French format', () => {
      render(<TransferHistoryTable />, { wrapper: createWrapper() })

      // Check for date format (dd/mm/yyyy)
      expect(screen.getByText('15/01/2024')).toBeInTheDocument()
      expect(screen.getByText('10/01/2024')).toBeInTheDocument()
    })

    it('should display completion date for completed transfers', () => {
      render(<TransferHistoryTable />, { wrapper: createWrapper() })

      // CONFIRMED transfer should have completion date
      expect(screen.getByText(/Termine le/i)).toBeInTheDocument()
    })

    it('should display reason if provided', () => {
      render(<TransferHistoryTable />, { wrapper: createWrapper() })

      expect(screen.getByText(/Raison: Changed my mind/i)).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('should show loading indicator while fetching', () => {
      mockUseTransferHistory.mockReturnValue({
        data: undefined,
        isLoading: true,
      })

      render(<TransferHistoryTable />, { wrapper: createWrapper() })

      expect(screen.getByText('Chargement...')).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('should show empty message when no transfers exist', () => {
      mockUseTransferHistory.mockReturnValue({
        data: [],
        isLoading: false,
      })

      render(<TransferHistoryTable />, { wrapper: createWrapper() })

      expect(screen.getByText("Aucun transfert dans l'historique")).toBeInTheDocument()
    })
  })

  describe('Status Badge Colors (AC #7)', () => {
    it('should render CONFIRMED badge with green colors', () => {
      mockUseTransferHistory.mockReturnValue({
        data: [
          {
            ...mockTransfers[0],
            status: 'confirmed',
          },
        ],
        isLoading: false,
      })

      render(<TransferHistoryTable />, { wrapper: createWrapper() })

      const badge = screen.getByText('CONFIRME')
      expect(badge).toHaveClass('text-[#00FF94]')
    })

    it('should render CANCELLED badge with gray colors', () => {
      mockUseTransferHistory.mockReturnValue({
        data: [
          {
            ...mockTransfers[1],
            status: 'cancelled',
          },
        ],
        isLoading: false,
      })

      render(<TransferHistoryTable />, { wrapper: createWrapper() })

      const badge = screen.getByText('ANNULE')
      expect(badge).toHaveClass('text-[#666666]')
    })

    it('should render PENDING badge with yellow colors', () => {
      mockUseTransferHistory.mockReturnValue({
        data: [
          {
            ...mockTransfers[0],
            status: 'pending',
            expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
          },
        ],
        isLoading: false,
      })

      render(<TransferHistoryTable />, { wrapper: createWrapper() })

      const badge = screen.getByText('EN ATTENTE')
      expect(badge).toHaveClass('text-[#CCFF00]')
    })

    it('should render EXPIRED badge for pending transfers past expiration', () => {
      mockUseTransferHistory.mockReturnValue({
        data: [
          {
            ...mockTransfers[0],
            status: 'pending',
            expiresAt: new Date(Date.now() - 1000).toISOString(), // Expired
          },
        ],
        isLoading: false,
      })

      render(<TransferHistoryTable />, { wrapper: createWrapper() })

      const badge = screen.getByText('EXPIRE')
      expect(badge).toHaveClass('text-[#FF3366]')
    })
  })
})
