import { z } from '@trafi/zod';
import { IdSchema } from '../common/base.schema';
import { UserRoleSchema } from './register.schema';

/**
 * Token type enum
 */
export const TokenTypeSchema = z.enum(['session', 'api_key']);
export type TokenType = z.infer<typeof TokenTypeSchema>;

/**
 * JWT Payload schema matching architecture specification
 *
 * @see architecture.md#JWT-Token-Structure
 */
export const JwtPayloadSchema = z.object({
  /** Subject - User ID */
  sub: IdSchema,
  /** Tenant ID - Store/Organization ID */
  tenantId: IdSchema,
  /** User role */
  role: UserRoleSchema,
  /** Granular permissions array */
  permissions: z.array(z.string()),
  /** Token type */
  type: TokenTypeSchema,
  /** Issued at timestamp (Unix) */
  iat: z.number(),
  /** Expiration timestamp (Unix) */
  exp: z.number(),
});

export type JwtPayload = z.infer<typeof JwtPayloadSchema>;

/**
 * Refresh token payload (minimal)
 */
export const RefreshTokenPayloadSchema = z.object({
  /** Subject - User ID */
  sub: IdSchema,
  /** Tenant ID - Store/Organization ID */
  tenantId: IdSchema,
  /** Token type identifier */
  type: z.literal('refresh'),
  /** Issued at timestamp (Unix) */
  iat: z.number(),
  /** Expiration timestamp (Unix) */
  exp: z.number(),
});

export type RefreshTokenPayload = z.infer<typeof RefreshTokenPayloadSchema>;

/**
 * Token pair response schema
 */
export const TokenPairSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  accessTokenExpiresAt: z.date(),
  refreshTokenExpiresAt: z.date(),
});

export type TokenPair = z.infer<typeof TokenPairSchema>;
