import { z } from 'zod';
import { UserStatusSchema } from '../auth';

/**
 * Schema for listing users with pagination and optional status filter
 */
export const ListUsersSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  status: UserStatusSchema.optional(),
});

export type ListUsersInput = z.infer<typeof ListUsersSchema>;
