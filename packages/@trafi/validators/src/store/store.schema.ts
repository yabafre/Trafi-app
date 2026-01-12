import { z } from 'zod';
import { IdSchema, TimestampsSchema, EmailSchema, StatusSchema, SlugSchema } from '../common';
import { CurrencySchema } from '../common/money.schema';

/**
 * Store plan/tier
 */
export const StorePlanSchema = z.enum(['free', 'starter', 'pro', 'enterprise']);
export type StorePlan = z.infer<typeof StorePlanSchema>;

/**
 * Supported locales
 */
export const LocaleSchema = z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/, {
  message: 'Locale must be in format "en" or "en-US"',
});
export type Locale = z.infer<typeof LocaleSchema>;

/**
 * Timezone schema
 */
export const TimezoneSchema = z.string().max(50);
export type Timezone = z.infer<typeof TimezoneSchema>;

/**
 * Store settings schema
 */
export const StoreSettingsSchema = z.object({
  defaultCurrency: CurrencySchema.default('EUR'),
  defaultLocale: LocaleSchema.default('en'),
  timezone: TimezoneSchema.default('UTC'),
  weightUnit: z.enum(['g', 'kg', 'lb', 'oz']).default('g'),
  taxIncluded: z.boolean().default(true).describe('Are prices displayed with tax included'),
  autoArchiveOrders: z.boolean().default(false),
  orderNumberPrefix: z.string().max(10).default('ORD-'),
  lowStockThreshold: z.number().int().nonnegative().default(5),
});
export type StoreSettings = z.infer<typeof StoreSettingsSchema>;

/**
 * Store contact info
 */
export const StoreContactSchema = z.object({
  email: EmailSchema.optional(),
  phone: z.string().max(30).optional(),
  address: z.string().max(500).optional(),
});
export type StoreContact = z.infer<typeof StoreContactSchema>;

/**
 * Store branding
 */
export const StoreBrandingSchema = z.object({
  logoUrl: z.string().url().optional(),
  faviconUrl: z.string().url().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});
export type StoreBranding = z.infer<typeof StoreBrandingSchema>;

/**
 * Complete store schema
 * Note: Store does NOT extend TenantScopedSchema because it IS the tenant
 */
export const StoreSchema = z.object({
  id: IdSchema,
  name: z.string().min(1).max(255),
  slug: SlugSchema,
  domain: z.string().max(255).optional().describe('Custom domain'),
  ownerId: IdSchema,
  status: StatusSchema.default('active'),
  plan: StorePlanSchema.default('free'),
  settings: StoreSettingsSchema.default({}),
  contact: StoreContactSchema.default({}),
  branding: StoreBrandingSchema.default({}),
  metadata: z.record(z.string()).optional(),
}).merge(TimestampsSchema);

export type Store = z.infer<typeof StoreSchema>;

/**
 * Schema for creating a new store
 */
export const CreateStoreSchema = StoreSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateStoreInput = z.infer<typeof CreateStoreSchema>;

/**
 * Schema for updating a store
 */
export const UpdateStoreSchema = CreateStoreSchema.partial().required({
  ownerId: true,
});
export type UpdateStoreInput = z.infer<typeof UpdateStoreSchema>;
