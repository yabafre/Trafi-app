import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { UsersTable } from '../UsersTable'
import type { UserResponse, UsersListResponse } from '@trafi/validators'

// Mock the hooks
vi.mock('../../_hooks', () => ({
  useUsers: vi.fn(),
}))

vi.mock('@/lib/hooks', () => ({
  usePermissions: vi.fn(() => ({
    hasPermission: vi.fn((permission: string) => permission === 'users:manage'),
    permissions: ['users:read', 'users:manage'],
    role: 'ADMIN',
    userRole: 'ADMIN',
  })),
}))

// Import the mocked hook
import { useUsers } from '../../_hooks'

const mockUseUsers = vi.mocked(useUsers)

// Test data
const mockUsers: UserResponse[] = [
  {
    id: 'user-1',
    email: 'owner@test.com',
    name: 'Owner User',
    role: 'OWNER',
    status: 'ACTIVE',
    lastLoginAt: new Date('2024-01-10'),
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'user-2',
    email: 'admin@test.com',
    name: 'Admin User',
    role: 'ADMIN',
    status: 'ACTIVE',
    lastLoginAt: null,
    createdAt: new Date('2024-01-02'),
  },
  {
    id: 'user-3',
    email: 'invited@test.com',
    name: null,
    role: 'EDITOR',
    status: 'INVITED',
    lastLoginAt: null,
    createdAt: new Date('2024-01-03'),
  },
]

const mockUsersResponse: UsersListResponse = {
  users: mockUsers,
  total: 3,
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
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }
}

describe('UsersTable', () => {
  const mockOnEditRole = vi.fn()
  const mockOnDeactivate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Loading State', () => {
    it('should render skeleton when loading', () => {
      mockUseUsers.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as ReturnType<typeof useUsers>)

      render(
        <UsersTable onEditRole={mockOnEditRole} onDeactivate={mockOnDeactivate} />,
        { wrapper: createWrapper() }
      )

      // Skeleton should show animated pulse elements
      const skeletonElements = document.querySelectorAll('.animate-pulse')
      expect(skeletonElements.length).toBeGreaterThan(0)
    })
  })

  describe('Error State', () => {
    it('should render error message when fetch fails', () => {
      mockUseUsers.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Network error'),
      } as ReturnType<typeof useUsers>)

      render(
        <UsersTable onEditRole={mockOnEditRole} onDeactivate={mockOnDeactivate} />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByText(/ERREUR/i)).toBeInTheDocument()
      expect(screen.getByText(/Network error/i)).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('should render empty message when no users', () => {
      mockUseUsers.mockReturnValue({
        data: { users: [], total: 0, page: 1, limit: 20, totalPages: 0 },
        isLoading: false,
        error: null,
      } as ReturnType<typeof useUsers>)

      render(
        <UsersTable onEditRole={mockOnEditRole} onDeactivate={mockOnDeactivate} />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByText(/AUCUN UTILISATEUR TROUVE/i)).toBeInTheDocument()
    })
  })

  describe('Data Display', () => {
    beforeEach(() => {
      mockUseUsers.mockReturnValue({
        data: mockUsersResponse,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useUsers>)
    })

    it('should render table headers', () => {
      render(
        <UsersTable onEditRole={mockOnEditRole} onDeactivate={mockOnDeactivate} />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByText('EMAIL')).toBeInTheDocument()
      expect(screen.getByText('NOM')).toBeInTheDocument()
      expect(screen.getByText('ROLE')).toBeInTheDocument()
      expect(screen.getByText('STATUT')).toBeInTheDocument()
      expect(screen.getByText('ACTIONS')).toBeInTheDocument()
    })

    it('should render all users with their data', () => {
      render(
        <UsersTable onEditRole={mockOnEditRole} onDeactivate={mockOnDeactivate} />,
        { wrapper: createWrapper() }
      )

      // Check emails are rendered
      expect(screen.getByText('owner@test.com')).toBeInTheDocument()
      expect(screen.getByText('admin@test.com')).toBeInTheDocument()
      expect(screen.getByText('invited@test.com')).toBeInTheDocument()

      // Check names (including placeholder for null)
      expect(screen.getByText('Owner User')).toBeInTheDocument()
      expect(screen.getByText('Admin User')).toBeInTheDocument()

      // Check roles are displayed
      expect(screen.getByText('OWNER')).toBeInTheDocument()
      expect(screen.getByText('ADMIN')).toBeInTheDocument()
      expect(screen.getByText('EDITOR')).toBeInTheDocument()
    })

    it('should render pagination info', () => {
      render(
        <UsersTable onEditRole={mockOnEditRole} onDeactivate={mockOnDeactivate} />,
        { wrapper: createWrapper() }
      )

      expect(screen.getByText('3 utilisateurs')).toBeInTheDocument()
      expect(screen.getByText('Page 1/1')).toBeInTheDocument()
    })
  })

  describe('Actions Menu', () => {
    beforeEach(() => {
      mockUseUsers.mockReturnValue({
        data: mockUsersResponse,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useUsers>)
    })

    it('should open actions dropdown when clicking menu button', async () => {
      const user = userEvent.setup()

      render(
        <UsersTable onEditRole={mockOnEditRole} onDeactivate={mockOnDeactivate} />,
        { wrapper: createWrapper() }
      )

      // Find and click the first user's actions button
      const actionsButton = screen.getByTestId('user-actions-user-1')
      await user.click(actionsButton)

      // Dropdown should appear with options
      expect(screen.getByText('Modifier le rôle')).toBeInTheDocument()
      expect(screen.getByText('Désactiver')).toBeInTheDocument()
    })

    it('should call onEditRole when clicking edit role option', async () => {
      const user = userEvent.setup()

      render(
        <UsersTable onEditRole={mockOnEditRole} onDeactivate={mockOnDeactivate} />,
        { wrapper: createWrapper() }
      )

      // Open dropdown
      const actionsButton = screen.getByTestId('user-actions-user-1')
      await user.click(actionsButton)

      // Click edit role
      await user.click(screen.getByText('Modifier le rôle'))

      expect(mockOnEditRole).toHaveBeenCalledWith(mockUsers[0])
    })

    it('should call onDeactivate when clicking deactivate option', async () => {
      const user = userEvent.setup()

      render(
        <UsersTable onEditRole={mockOnEditRole} onDeactivate={mockOnDeactivate} />,
        { wrapper: createWrapper() }
      )

      // Open dropdown
      const actionsButton = screen.getByTestId('user-actions-user-1')
      await user.click(actionsButton)

      // Click deactivate
      await user.click(screen.getByText('Désactiver'))

      expect(mockOnDeactivate).toHaveBeenCalledWith(mockUsers[0])
    })

    it('should not show deactivate option for INVITED users', async () => {
      const user = userEvent.setup()

      render(
        <UsersTable onEditRole={mockOnEditRole} onDeactivate={mockOnDeactivate} />,
        { wrapper: createWrapper() }
      )

      // Open dropdown for invited user
      const actionsButton = screen.getByTestId('user-actions-user-3')
      await user.click(actionsButton)

      // Edit role should be visible
      expect(screen.getByText('Modifier le rôle')).toBeInTheDocument()

      // Deactivate should NOT be visible (user status is INVITED, not ACTIVE)
      expect(screen.queryByText('Désactiver')).not.toBeInTheDocument()
    })
  })
})
