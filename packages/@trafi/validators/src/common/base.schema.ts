import { z } from 'zod';

/**
 * ID schema with CUID format
 * Used for all entity identifiers in the Trafi platform
 */
export const IdSchema = z.string().cuid();
export type Id = z.infer<typeof IdSchema>;

/**
 * Timestamp fields for all entities
 */
export const TimestampsSchema = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Timestamps = z.infer<typeof TimestampsSchema>;

/**
 * Tenant-scoped base schema
 * All entities belong to a store (tenant isolation is CRITICAL)
 */
export const TenantScopedSchema = z.object({
  storeId: IdSchema,
});
export type TenantScoped = z.infer<typeof TenantScopedSchema>;

/**
 * Base entity schema combining ID, tenant scope, and timestamps
 * Use this as the base for all domain entities
 */
export const BaseEntitySchema = TenantScopedSchema.extend({
  id: IdSchema,
}).merge(TimestampsSchema);

export type BaseEntity = z.infer<typeof BaseEntitySchema>;

/**
 * Slug schema for URL-friendly identifiers
 */
export const SlugSchema = z.string().min(1).max(255).regex(/^[a-z0-9-]+$/, {
  message: 'Slug must contain only lowercase letters, numbers, and hyphens',
});
export type Slug = z.infer<typeof SlugSchema>;

/**
 * Email schema with validation
 */
export const EmailSchema = z.string().email().max(255);
export type Email = z.infer<typeof EmailSchema>;

/**
 * Status enum for entities with lifecycle
 */
export const StatusSchema = z.enum(['active', 'inactive', 'archived']);
export type Status = z.infer<typeof StatusSchema>;
