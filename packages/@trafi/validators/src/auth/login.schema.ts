import { z } from 'zod';
import { EmailSchema } from '../common/base.schema';

/**
 * Login credentials schema
 * Used for admin dashboard authentication
 */
export const LoginSchema = z.object({
  email: EmailSchema,
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .max(128, { message: 'Password must be at most 128 characters' }),
});

export type LoginInput = z.infer<typeof LoginSchema>;

/**
 * Login response schema
 * Contains JWT tokens for session management
 */
export const LoginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
  tokenType: z.literal('Bearer'),
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;

/**
 * Refresh token request schema
 * Used for refreshing access tokens
 */
export const RefreshTokenRequestSchema = z.object({
  refreshToken: z.string().min(1, { message: 'Refresh token is required' }),
});

export type RefreshTokenRequestInput = z.infer<typeof RefreshTokenRequestSchema>;
