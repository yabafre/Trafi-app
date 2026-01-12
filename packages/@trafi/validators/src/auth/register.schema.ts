import { z } from 'zod';
import { EmailSchema, IdSchema } from '../common/base.schema';

/**
 * User role enum matching Prisma UserRole
 */
export const UserRoleSchema = z.enum(['OWNER', 'ADMIN', 'EDITOR', 'VIEWER']);
export type UserRole = z.infer<typeof UserRoleSchema>;

/**
 * User status enum matching Prisma UserStatus
 */
export const UserStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'INVITED']);
export type UserStatus = z.infer<typeof UserStatusSchema>;

/**
 * Password validation schema with security requirements
 */
export const PasswordSchema = z
  .string()
  .min(8, { message: 'Password must be at least 8 characters' })
  .max(128, { message: 'Password must be at most 128 characters' })
  .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
  .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
  .regex(/[0-9]/, { message: 'Password must contain at least one number' });

/**
 * Register/Create admin user schema
 */
export const RegisterSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  name: z.string().min(1).max(255).optional(),
  role: UserRoleSchema.optional().default('EDITOR'),
  storeId: IdSchema,
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

/**
 * Invite user schema (no password required, sent via email)
 */
export const InviteUserSchema = z.object({
  email: EmailSchema,
  name: z.string().min(1).max(255).optional(),
  role: UserRoleSchema.optional().default('EDITOR'),
  storeId: IdSchema,
});

export type InviteUserInput = z.infer<typeof InviteUserSchema>;

/**
 * Set password schema (for invited users or password reset)
 */
export const SetPasswordSchema = z.object({
  token: z.string().min(1),
  password: PasswordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type SetPasswordInput = z.infer<typeof SetPasswordSchema>;
