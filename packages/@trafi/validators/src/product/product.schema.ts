import { z } from 'zod';
import { IdSchema, SlugSchema, TimestampsSchema, TenantScopedSchema } from '../common';
import { CurrencySchema } from '../common/money.schema';

/**
 * Product status with additional product-specific states
 */
export const ProductStatusSchema = z.enum(['draft', 'active', 'archived']);
export type ProductStatus = z.infer<typeof ProductStatusSchema>;

/**
 * Base product schema with all fields
 * Prices are ALWAYS stored as INTEGER cents
 */
export const ProductSchema = TenantScopedSchema.extend({
  id: IdSchema,
  name: z.string().min(1).max(255),
  slug: SlugSchema,
  description: z.string().max(10000).optional(),
  price: z.number().int().nonnegative().describe('Price in cents'),
  compareAtPrice: z.number().int().nonnegative().optional().describe('Compare-at price in cents for discounts'),
  currency: CurrencySchema,
  sku: z.string().max(255).optional(),
  barcode: z.string().max(255).optional(),
  status: ProductStatusSchema.default('draft'),
  inventoryQuantity: z.number().int().nonnegative().default(0),
  trackInventory: z.boolean().default(true),
  allowBackorder: z.boolean().default(false),
  weight: z.number().nonnegative().optional().describe('Weight in grams'),
  taxable: z.boolean().default(true),
  metadata: z.record(z.string()).optional(),
}).merge(TimestampsSchema);

export type Product = z.infer<typeof ProductSchema>;
