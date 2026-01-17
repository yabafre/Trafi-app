import { z } from '@trafi/zod';
import { IdSchema, TimestampsSchema, TenantScopedSchema, EmailSchema, StatusSchema } from '../common';
import { AddressSchema } from '../order/order.schema';

/**
 * Customer authentication provider
 */
export const AuthProviderSchema = z.enum(['email', 'google', 'apple']);
export type AuthProvider = z.infer<typeof AuthProviderSchema>;

/**
 * Saved address with optional default flag
 */
export const SavedAddressSchema = AddressSchema.extend({
  id: IdSchema,
  label: z.string().max(50).optional().describe('e.g., "Home", "Work"'),
  isDefault: z.boolean().default(false),
});
export type SavedAddress = z.infer<typeof SavedAddressSchema>;

/**
 * Customer schema
 */
export const CustomerSchema = TenantScopedSchema.extend({
  id: IdSchema,
  email: EmailSchema,
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().max(30).optional(),
  status: StatusSchema.default('active'),
  authProvider: AuthProviderSchema.optional(),
  externalId: z.string().max(255).optional().describe('External auth provider ID'),
  acceptsMarketing: z.boolean().default(false),
  marketingOptInAt: z.date().optional(),
  totalOrders: z.number().int().nonnegative().default(0),
  totalSpent: z.number().int().nonnegative().default(0).describe('Total spent in cents'),
  lastOrderAt: z.date().optional(),
  addresses: z.array(SavedAddressSchema).default([]),
  tags: z.array(z.string().max(50)).default([]),
  notes: z.string().max(1000).optional(),
  metadata: z.record(z.string()).optional(),
}).merge(TimestampsSchema);

export type Customer = z.infer<typeof CustomerSchema>;

/**
 * Schema for creating a new customer
 */
export const CreateCustomerSchema = CustomerSchema.omit({
  id: true,
  totalOrders: true,
  totalSpent: true,
  lastOrderAt: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;

/**
 * Schema for updating a customer
 */
export const UpdateCustomerSchema = CreateCustomerSchema.partial().required({
  storeId: true,
});
export type UpdateCustomerInput = z.infer<typeof UpdateCustomerSchema>;

/**
 * Schema for customer registration
 */
export const CustomerRegistrationSchema = z.object({
  storeId: IdSchema,
  email: EmailSchema,
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  acceptsMarketing: z.boolean().default(false),
});
export type CustomerRegistrationInput = z.infer<typeof CustomerRegistrationSchema>;

/**
 * Schema for customer login
 */
export const CustomerLoginSchema = z.object({
  storeId: IdSchema,
  email: EmailSchema,
  password: z.string().min(1),
});
export type CustomerLoginInput = z.infer<typeof CustomerLoginSchema>;
