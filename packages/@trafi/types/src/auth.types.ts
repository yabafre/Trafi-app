/**
 * Authentication types for the Trafi platform
 *
 * Types are re-exported from @trafi/validators where they are inferred from Zod schemas
 */

// Import types for use in this file
import type { UserRole as UserRoleType } from '@trafi/validators';

// Re-export types from validators (already inferred from Zod schemas there)
export type {
  LoginInput,
  LoginResponse,
  RegisterInput,
  InviteUserInput,
  SetPasswordInput,
  UserRole,
  UserStatus,
  JwtPayload,
  RefreshTokenPayload,
  TokenPair,
  TokenType,
} from '@trafi/validators';

/**
 * Authenticated user context
 * Available via @CurrentUser() decorator in controllers
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRoleType;
  storeId: string;
  permissions: string[];
}

/**
 * Auth response with user info and tokens
 */
export interface AuthResponse {
  user: AuthenticatedUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Refresh token request
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Role permission mapping
 * Used for RBAC implementation
 */
export type RolePermissions = Record<UserRoleType, string[]>;

/**
 * Default permissions per role
 */
export const DEFAULT_ROLE_PERMISSIONS: RolePermissions = {
  OWNER: ['*'], // Full access
  ADMIN: [
    'users:read',
    'users:write',
    'users:invite',
    'settings:read',
    'settings:write',
    'products:read',
    'products:write',
    'orders:read',
    'orders:write',
    'customers:read',
    'customers:write',
  ],
  EDITOR: [
    'products:read',
    'products:write',
    'orders:read',
    'orders:write',
    'customers:read',
    'customers:write',
  ],
  VIEWER: [
    'products:read',
    'orders:read',
    'customers:read',
  ],
};
