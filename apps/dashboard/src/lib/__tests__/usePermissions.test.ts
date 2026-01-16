import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePermissions } from '../hooks/usePermissions'
import { AuthContext, type AuthContextValue } from '../hooks/useAuth'
import type { AuthUser } from '../auth'
import { createElement } from 'react'
import type { ReactNode } from 'react'

// Mock the ROLE_PERMISSIONS from @trafi/types
vi.mock('@trafi/types', () => ({
  ROLE_PERMISSIONS: {
    OWNER: [
      'users:read',
      'users:invite',
      'users:manage',
      'products:read',
      'products:create',
      'products:update',
      'products:delete',
      'orders:read',
      'orders:update',
      'orders:refund',
      'customers:read',
      'customers:manage',
      'settings:read',
      'settings:update',
      'settings:billing',
      'api-keys:read',
      'api-keys:manage',
      'ownership:transfer',
    ],
    ADMIN: [
      'users:read',
      'users:invite',
      'users:manage',
      'products:read',
      'products:create',
      'products:update',
      'products:delete',
      'orders:read',
      'orders:update',
      'orders:refund',
      'customers:read',
      'customers:manage',
      'settings:read',
      'settings:update',
      'api-keys:read',
      'api-keys:manage',
    ],
    EDITOR: [
      'products:read',
      'products:create',
      'products:update',
      'orders:read',
      'orders:update',
      'customers:read',
      'customers:manage',
    ],
    VIEWER: [
      'users:read',
      'products:read',
      'orders:read',
      'customers:read',
      'settings:read',
    ],
  },
}))

describe('usePermissions', () => {
  const createMockUser = (role: string): AuthUser => ({
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role,
    tenantId: 'store-123',
    permissions: [],
  })

  const createWrapper = (user: AuthUser | null) => {
    const authValue: AuthContextValue = {
      user,
      isLoading: false,
      isAuthenticated: !!user,
      logout: vi.fn(),
    }

    return function Wrapper({ children }: { children: ReactNode }) {
      return createElement(
        AuthContext.Provider,
        { value: authValue },
        children
      )
    }
  }

  describe('hasPermission', () => {
    it('should return true when OWNER has any permission', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(createMockUser('OWNER')),
      })

      expect(result.current.hasPermission('ownership:transfer')).toBe(true)
      expect(result.current.hasPermission('products:delete')).toBe(true)
    })

    it('should return true when ADMIN has products:read permission', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(createMockUser('ADMIN')),
      })

      expect(result.current.hasPermission('products:read')).toBe(true)
    })

    it('should return false when ADMIN tries ownership:transfer', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(createMockUser('ADMIN')),
      })

      expect(result.current.hasPermission('ownership:transfer')).toBe(false)
    })

    it('should return true when VIEWER has products:read permission', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(createMockUser('VIEWER')),
      })

      expect(result.current.hasPermission('products:read')).toBe(true)
    })

    it('should return false when VIEWER tries products:delete', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(createMockUser('VIEWER')),
      })

      expect(result.current.hasPermission('products:delete')).toBe(false)
    })

    it('should return false when user is null', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(null),
      })

      expect(result.current.hasPermission('products:read')).toBe(false)
    })
  })

  describe('hasAnyPermission', () => {
    it('should return true when user has at least one permission', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(createMockUser('VIEWER')),
      })

      expect(
        result.current.hasAnyPermission('products:read', 'products:delete')
      ).toBe(true)
    })

    it('should return false when user has none of the permissions', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(createMockUser('VIEWER')),
      })

      expect(
        result.current.hasAnyPermission('products:delete', 'users:manage')
      ).toBe(false)
    })
  })

  describe('hasAllPermissions', () => {
    it('should return true when user has all permissions', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(createMockUser('ADMIN')),
      })

      expect(
        result.current.hasAllPermissions('products:read', 'products:delete')
      ).toBe(true)
    })

    it('should return false when user is missing one permission', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(createMockUser('VIEWER')),
      })

      expect(
        result.current.hasAllPermissions('products:read', 'products:delete')
      ).toBe(false)
    })
  })

  describe('role', () => {
    it('should return the current user role', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(createMockUser('ADMIN')),
      })

      expect(result.current.role).toBe('ADMIN')
    })

    it('should return null when user is not authenticated', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(null),
      })

      expect(result.current.role).toBe(null)
    })
  })

  describe('hasRole', () => {
    it('should return true when user has the specified role', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(createMockUser('ADMIN')),
      })

      expect(result.current.hasRole('ADMIN')).toBe(true)
    })

    it('should return false when user has a different role', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(createMockUser('VIEWER')),
      })

      expect(result.current.hasRole('ADMIN')).toBe(false)
    })
  })

  describe('hasAnyRole', () => {
    it('should return true when user has one of the specified roles', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(createMockUser('ADMIN')),
      })

      expect(result.current.hasAnyRole('OWNER', 'ADMIN')).toBe(true)
    })

    it('should return false when user has none of the specified roles', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(createMockUser('VIEWER')),
      })

      expect(result.current.hasAnyRole('OWNER', 'ADMIN')).toBe(false)
    })
  })

  describe('permissions array', () => {
    it('should return all permissions for OWNER', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(createMockUser('OWNER')),
      })

      expect(result.current.permissions).toContain('ownership:transfer')
      expect(result.current.permissions).toContain('products:read')
    })

    it('should return limited permissions for VIEWER', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(createMockUser('VIEWER')),
      })

      expect(result.current.permissions).toContain('products:read')
      expect(result.current.permissions).not.toContain('products:delete')
      expect(result.current.permissions).not.toContain('ownership:transfer')
    })

    it('should return empty array when user is not authenticated', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(null),
      })

      expect(result.current.permissions).toEqual([])
    })
  })
})
