'use client'

import { useMemo } from 'react'
import { useAuth } from './useAuth'
import {
  ROLE_PERMISSIONS,
  type Permission,
  type Role,
} from '@trafi/types'

export interface UsePermissionsResult {
  /**
   * All permissions available to the current user based on their role
   */
  permissions: Permission[]

  /**
   * Check if user has a specific permission
   */
  hasPermission: (permission: Permission) => boolean

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission: (...permissions: Permission[]) => boolean

  /**
   * Check if user has all of the specified permissions
   */
  hasAllPermissions: (...permissions: Permission[]) => boolean

  /**
   * Current user's role
   */
  role: Role | null

  /**
   * Alias for role (for convenience)
   */
  userRole: Role | null

  /**
   * Check if user has a specific role
   */
  hasRole: (role: Role) => boolean

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole: (...roles: Role[]) => boolean
}

/**
 * Hook for checking user permissions in dashboard components
 *
 * Uses the current user's role to determine their permissions based on
 * the ROLE_PERMISSIONS mapping.
 *
 * @example
 * ```tsx
 * function ProductActions() {
 *   const { hasPermission, hasAnyPermission } = usePermissions()
 *
 *   return (
 *     <div>
 *       {hasPermission('products:read') && <ProductList />}
 *       {hasPermission('products:create') && <CreateButton />}
 *       {hasAnyPermission('products:update', 'products:delete') && <EditMenu />}
 *     </div>
 *   )
 * }
 * ```
 *
 * @see epic-02-admin-auth.md#Story-2.3
 */
export function usePermissions(): UsePermissionsResult {
  const { user } = useAuth()

  const role = useMemo<Role | null>(() => {
    if (!user?.role) return null
    return user.role as Role
  }, [user?.role])

  const permissions = useMemo<Permission[]>(() => {
    if (!role) return []
    return ROLE_PERMISSIONS[role] || []
  }, [role])

  const hasPermission = useMemo(
    () => (permission: Permission): boolean => {
      return permissions.includes(permission)
    },
    [permissions]
  )

  const hasAnyPermission = useMemo(
    () =>
      (...perms: Permission[]): boolean => {
        return perms.some((p) => permissions.includes(p))
      },
    [permissions]
  )

  const hasAllPermissions = useMemo(
    () =>
      (...perms: Permission[]): boolean => {
        return perms.every((p) => permissions.includes(p))
      },
    [permissions]
  )

  const hasRole = useMemo(
    () =>
      (checkRole: Role): boolean => {
        return role === checkRole
      },
    [role]
  )

  const hasAnyRole = useMemo(
    () =>
      (...roles: Role[]): boolean => {
        return role !== null && roles.includes(role)
      },
    [role]
  )

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    role,
    userRole: role,
    hasRole,
    hasAnyRole,
  }
}
