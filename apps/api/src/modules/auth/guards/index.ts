/**
 * Auth guards for RBAC
 *
 * @see epic-02-admin-auth.md#Story-2.3
 */

export * from './permissions.guard';
export * from './roles.guard';

// Re-export LocalAuthGuard for convenience
export * from './local-auth.guard';
