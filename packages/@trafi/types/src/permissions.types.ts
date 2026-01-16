/**
 * RBAC Permission types for Trafi platform
 *
 * Shared types for both API and Dashboard.
 * This file mirrors the permission definitions in apps/api/src/common/types/permissions.ts
 * to allow the dashboard to use the same types without importing from the API.
 *
 * @see epic-02-admin-auth.md#Story-2.3
 */

/**
 * All available permissions in the system
 * Each permission follows the pattern: resource:action
 */
export const PERMISSIONS = {
  // Users
  'users:read': 'View team members',
  'users:invite': 'Invite new team members',
  'users:manage': 'Edit roles and deactivate users',

  // Products
  'products:read': 'View products',
  'products:create': 'Create products',
  'products:update': 'Edit products',
  'products:delete': 'Delete products',

  // Orders
  'orders:read': 'View orders',
  'orders:update': 'Update order status',
  'orders:refund': 'Process refunds',

  // Customers
  'customers:read': 'View customers',
  'customers:manage': 'Edit customer data',

  // Settings
  'settings:read': 'View store settings',
  'settings:update': 'Update store settings',
  'settings:billing': 'Access billing settings',

  // API Keys
  'api-keys:read': 'View API keys',
  'api-keys:manage': 'Create and revoke API keys',

  // Owner-only
  'ownership:transfer': 'Transfer store ownership',
} as const;

/**
 * Permission type derived from PERMISSIONS keys
 */
export type Permission = keyof typeof PERMISSIONS;

/**
 * Role type matching Prisma UserRole enum (uppercase)
 */
export type Role = 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER';

/**
 * Role-to-permissions mapping
 *
 * Defines which permissions each role has access to:
 * - OWNER: Full access to all permissions
 * - ADMIN: User management, settings, all commerce features (no ownership transfer)
 * - EDITOR: Product, order, customer management (no user management)
 * - VIEWER: Read-only access to all data
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  OWNER: Object.keys(PERMISSIONS) as Permission[],
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
};
