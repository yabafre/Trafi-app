import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TransferConfirmationDialog } from '../TransferConfirmationDialog'

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

// Mock the transfer ownership hook
const mockMutate = vi.fn()
vi.mock('../../_hooks', () => ({
  useTransferOwnership: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}))

// Test data
const mockTargetUser = {
  id: 'admin-123',
  name: 'Admin User',
  email: 'admin@test.com',
  role: 'ADMIN',
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

describe('TransferConfirmationDialog', () => {
  const mockOnOpenChange = vi.fn()
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('AC #2 - Password Validation', () => {
    it('should render dialog with password input', () => {
      render(
        <TransferConfirmationDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          targetUser={mockTargetUser}
          onSuccess={mockOnSuccess}
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByText('CONFIRMER LE TRANSFERT')).toBeInTheDocument()
      expect(screen.getByLabelText(/MOT DE PASSE ACTUEL/i)).toBeInTheDocument()
    })

    it('should disable confirm button when password is empty', () => {
      render(
        <TransferConfirmationDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          targetUser={mockTargetUser}
          onSuccess={mockOnSuccess}
        />,
        { wrapper: createWrapper() }
      )

      const confirmButton = screen.getByRole('button', { name: /CONFIRMER/i })
      expect(confirmButton).toBeDisabled()
    })

    it('should enable confirm button when password is entered', async () => {
      const user = userEvent.setup()

      render(
        <TransferConfirmationDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          targetUser={mockTargetUser}
          onSuccess={mockOnSuccess}
        />,
        { wrapper: createWrapper() }
      )

      const passwordInput = screen.getByLabelText(/MOT DE PASSE ACTUEL/i)
      await user.type(passwordInput, 'mypassword')

      const confirmButton = screen.getByRole('button', { name: /CONFIRMER/i })
      expect(confirmButton).not.toBeDisabled()
    })

    it('should call transfer mutation with password when confirmed', async () => {
      const user = userEvent.setup()

      render(
        <TransferConfirmationDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          targetUser={mockTargetUser}
          onSuccess={mockOnSuccess}
        />,
        { wrapper: createWrapper() }
      )

      const passwordInput = screen.getByLabelText(/MOT DE PASSE ACTUEL/i)
      await user.type(passwordInput, 'correctpassword')

      const confirmButton = screen.getByRole('button', { name: /CONFIRMER/i })
      await user.click(confirmButton)

      expect(mockMutate).toHaveBeenCalledWith(
        {
          targetUserId: 'admin-123',
          password: 'correctpassword',
        },
        expect.any(Object)
      )
    })

    it('should clear password when dialog is closed', async () => {
      const user = userEvent.setup()

      render(
        <TransferConfirmationDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          targetUser={mockTargetUser}
          onSuccess={mockOnSuccess}
        />,
        { wrapper: createWrapper() }
      )

      const passwordInput = screen.getByLabelText(/MOT DE PASSE ACTUEL/i)
      await user.type(passwordInput, 'mypassword')

      const cancelButton = screen.getByRole('button', { name: /ANNULER/i })
      await user.click(cancelButton)

      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })
  })

  describe('Target User Display', () => {
    it('should display target user name in description', () => {
      render(
        <TransferConfirmationDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          targetUser={mockTargetUser}
          onSuccess={mockOnSuccess}
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByText('Admin User')).toBeInTheDocument()
    })

    it('should display target user email when name is null', () => {
      const userWithoutName = { ...mockTargetUser, name: null }

      render(
        <TransferConfirmationDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          targetUser={userWithoutName}
          onSuccess={mockOnSuccess}
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByText('admin@test.com')).toBeInTheDocument()
    })
  })

  describe('Warning Message', () => {
    it('should display 72-hour warning', () => {
      render(
        <TransferConfirmationDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          targetUser={mockTargetUser}
          onSuccess={mockOnSuccess}
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByText(/72 heures/i)).toBeInTheDocument()
    })

    it('should mention demotion to Admin role', () => {
      render(
        <TransferConfirmationDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          targetUser={mockTargetUser}
          onSuccess={mockOnSuccess}
        />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByText(/retrograde au role Admin/i)).toBeInTheDocument()
    })
  })
})
