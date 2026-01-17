import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { OwnershipTransferCard } from '../OwnershipTransferCard'

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
const mockMutate = vi.fn()
const mockUseUsers = vi.fn()

vi.mock('../../../users/_hooks', () => ({
  useUsers: () => mockUseUsers(),
}))

// Test data
const mockUsers = {
  users: [
    { id: 'admin-1', name: 'Admin User', email: 'admin@test.com', role: 'ADMIN' },
    { id: 'editor-1', name: 'Editor User', email: 'editor@test.com', role: 'EDITOR' },
    { id: 'viewer-1', name: 'Viewer User', email: 'viewer@test.com', role: 'VIEWER' },
  ],
  page: 1,
  limit: 20,
  total: 3,
  totalPages: 1,
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

describe('OwnershipTransferCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMutate.mockClear()

    // Default mock implementations
    mockUseUsers.mockReturnValue({
      data: mockUsers,
      isLoading: false,
    })
  })

  describe('AC #1 - Eligible Users Dropdown', () => {
    it('should render card with title', () => {
      render(<OwnershipTransferCard />, { wrapper: createWrapper() })

      expect(screen.getByText('TRANSFERT DE PROPRIETE')).toBeInTheDocument()
    })

    it('should show warning about irreversible action', () => {
      render(<OwnershipTransferCard />, { wrapper: createWrapper() })

      expect(screen.getByText('Action irreversible')).toBeInTheDocument()
      expect(
        screen.getByText(/Le nouveau proprietaire aura le controle total/i)
      ).toBeInTheDocument()
    })

    it('should filter users to only show admins and editors in dropdown', async () => {
      const user = userEvent.setup()

      render(<OwnershipTransferCard />, { wrapper: createWrapper() })

      // Open the select dropdown
      const selectTrigger = screen.getByRole('combobox')
      await user.click(selectTrigger)

      // Should show admin and editor
      await waitFor(() => {
        expect(screen.getByText(/Admin User/i)).toBeInTheDocument()
        expect(screen.getByText(/Editor User/i)).toBeInTheDocument()
      })

      // Should NOT show viewer
      expect(screen.queryByText(/Viewer User/i)).not.toBeInTheDocument()
    })

    it('should display user email and role in dropdown options', async () => {
      const user = userEvent.setup()

      render(<OwnershipTransferCard />, { wrapper: createWrapper() })

      const selectTrigger = screen.getByRole('combobox')
      await user.click(selectTrigger)

      await waitFor(() => {
        expect(
          screen.getByText(/admin@test.com.*ADMIN/i)
        ).toBeInTheDocument()
        expect(
          screen.getByText(/editor@test.com.*EDITOR/i)
        ).toBeInTheDocument()
      })
    })
  })

  describe('Transfer Button State', () => {
    it('should have transfer button disabled when no user selected', () => {
      render(<OwnershipTransferCard />, { wrapper: createWrapper() })

      const transferButton = screen.getByRole('button', { name: /INITIER LE TRANSFERT/i })
      expect(transferButton).toBeDisabled()
    })

    it('should enable transfer button when user is selected', async () => {
      const user = userEvent.setup()

      render(<OwnershipTransferCard />, { wrapper: createWrapper() })

      // Select a user
      const selectTrigger = screen.getByRole('combobox')
      await user.click(selectTrigger)

      await waitFor(() => {
        expect(screen.getByText(/Admin User/i)).toBeInTheDocument()
      })

      const adminOption = screen.getByText(/Admin User/i)
      await user.click(adminOption)

      // Button should now be enabled
      const transferButton = screen.getByRole('button', { name: /INITIER LE TRANSFERT/i })
      expect(transferButton).not.toBeDisabled()
    })
  })

  describe('Loading State', () => {
    it('should disable select when users are loading', () => {
      mockUseUsers.mockReturnValue({
        data: undefined,
        isLoading: true,
      })

      render(<OwnershipTransferCard />, { wrapper: createWrapper() })

      const selectTrigger = screen.getByRole('combobox')
      expect(selectTrigger).toHaveAttribute('data-disabled')
    })
  })

  describe('Empty State', () => {
    it('should handle empty eligible users list', async () => {
      mockUseUsers.mockReturnValue({
        data: { users: [{ id: 'viewer-1', name: 'Viewer', email: 'v@test.com', role: 'VIEWER' }], page: 1, limit: 20, total: 1, totalPages: 1 },
        isLoading: false,
      })
      const user = userEvent.setup()

      render(<OwnershipTransferCard />, { wrapper: createWrapper() })

      const selectTrigger = screen.getByRole('combobox')
      await user.click(selectTrigger)

      // No options should be shown (only viewer exists, which is filtered out)
      await waitFor(() => {
        expect(screen.queryByText(/Viewer/i)).not.toBeInTheDocument()
      })
    })
  })
})
