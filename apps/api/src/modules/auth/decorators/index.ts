/**
 * Auth decorators for RBAC
 *
 * @see epic-02-admin-auth.md#Story-2.3
 */

// Permission and role decorators
export * from './permissions.decorator';
export * from './roles.decorator';

// Re-export CurrentUser from common decorators for convenience
export { CurrentUser } from '../../../common/decorators/current-user.decorator';
