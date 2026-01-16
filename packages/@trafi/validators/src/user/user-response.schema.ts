import { z } from 'zod';
import { UserRoleSchema, UserStatusSchema } from '../auth';

/**
 * User response schema for API responses
 * Excludes sensitive fields like passwordHash
 */
export const UserResponseSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
  role: UserRoleSchema,
  status: UserStatusSchema,
  lastLoginAt: z.date().nullable(),
  createdAt: z.date(),
});

export type UserResponse = z.infer<typeof UserResponseSchema>;

/**
 * Paginated users list response
 */
export const UsersListResponseSchema = z.object({
  users: z.array(UserResponseSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
});

export type UsersListResponse = z.infer<typeof UsersListResponseSchema>;
