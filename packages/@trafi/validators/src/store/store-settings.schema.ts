import { z } from '@trafi/zod';
import { EmailSchema } from '../common';
import { CurrencySchema } from '../common/money.schema';
import { LocaleSchema, TimezoneSchema } from './store.schema';

/**
 * Store contact address schema (simplified version for store settings)
 * Different from shipping/billing Address which has firstName, lastName, etc.
 */
export const StoreAddressSchema = z.object({
  street: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().max(2).optional(), // ISO 3166-1 alpha-2
});
export type StoreAddress = z.infer<typeof StoreAddressSchema>;

/**
 * Weight unit schema
 */
export const WeightUnitSchema = z.enum(['g', 'kg', 'lb', 'oz']);
export type WeightUnit = z.infer<typeof WeightUnitSchema>;

/**
 * Hex color schema (#RRGGBB format)
 */
export const HexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, {
  message: 'Color must be a valid hex color (e.g., #CCFF00)',
});
export type HexColor = z.infer<typeof HexColorSchema>;

/**
 * Slug schema (lowercase, hyphens, numbers only)
 */
export const StoreSettingsSlugSchema = z.string().max(100).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
  message: 'Slug must be lowercase with hyphens and numbers only',
});

/**
 * Complete store settings response schema
 */
export const StoreSettingsResponseSchema = z.object({
  id: z.string(),
  storeId: z.string(),

  // General
  name: z.string(),
  description: z.string().nullable(),
  slug: z.string().nullable(),

  // Localization
  defaultCurrency: CurrencySchema,
  defaultLocale: z.string(),
  timezone: z.string(),
  weightUnit: z.string(),

  // Business
  taxIncluded: z.boolean(),
  autoArchiveOrders: z.boolean(),
  orderNumberPrefix: z.string(),
  lowStockThreshold: z.number().int().nonnegative(),

  // Contact
  contactEmail: z.string().nullable(),
  supportEmail: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  address: StoreAddressSchema.nullable(),

  // Brand
  primaryColor: z.string(),
  logoUrl: z.string().nullable(),
  faviconUrl: z.string().nullable(),

  // Timestamps
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type StoreSettingsResponse = z.infer<typeof StoreSettingsResponseSchema>;

/**
 * Update store settings schema
 * All fields are optional for partial updates
 */
export const UpdateStoreSettingsSchema = z.object({
  // General
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  slug: StoreSettingsSlugSchema.optional(),

  // Localization
  defaultCurrency: CurrencySchema.optional(),
  defaultLocale: LocaleSchema.optional(),
  timezone: TimezoneSchema.optional(),
  weightUnit: WeightUnitSchema.optional(),

  // Business
  taxIncluded: z.boolean().optional(),
  autoArchiveOrders: z.boolean().optional(),
  orderNumberPrefix: z.string().max(10).optional(),
  lowStockThreshold: z.number().int().nonnegative().optional(),

  // Contact
  contactEmail: EmailSchema.optional(),
  supportEmail: EmailSchema.optional(),
  phoneNumber: z.string().max(30).optional(),
  address: StoreAddressSchema.optional(),

  // Brand
  primaryColor: HexColorSchema.optional(),
  logoUrl: z.string().max(500).optional(),
  faviconUrl: z.string().max(500).optional(),
});
export type UpdateStoreSettingsInput = z.infer<typeof UpdateStoreSettingsSchema>;
