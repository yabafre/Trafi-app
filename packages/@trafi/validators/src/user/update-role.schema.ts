import { z } from '@trafi/zod';
import { UserRoleSchema } from '../auth';

/**
 * Schema for updating a user's role
 */
export const UpdateUserRoleSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  role: UserRoleSchema,
});

export type UpdateUserRoleInput = z.infer<typeof UpdateUserRoleSchema>;
