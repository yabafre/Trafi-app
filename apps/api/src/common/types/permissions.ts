/**
 * RBAC Permission definitions for Trafi platform
 *
 * This file re-exports permission types from @trafi/types to maintain
 * a single source of truth while allowing convenient imports within the API.
 *
 * @see architecture.md#Authentication-&-Authorization
 * @see epic-02-admin-auth.md#Story-2.3
 */

// Re-export everything from @trafi/types - single source of truth
export {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  type Permission,
  type Role,
} from '@trafi/types';
