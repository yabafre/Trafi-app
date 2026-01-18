import { z } from '@trafi/zod';
import { IdSchema, SlugSchema, TimestampsSchema, TenantScopedSchema, PaginationSchema } from '../common';

/**
 * Product status enum matching Prisma ProductStatus
 * @see apps/api/prisma/schema/product.prisma
 */
export const ProductStatusSchema = z.enum(['draft', 'active', 'archived']);
export type ProductStatus = z.infer<typeof ProductStatusSchema>;

/**
 * Base product schema with all fields
 * Prices are ALWAYS stored as INTEGER cents (ARCH-25)
 *
 * Story 3.1 fields: name, slug, description, status, productType, vendor, tags, priceInCents
 */
export const ProductSchema = TenantScopedSchema.extend({
  id: IdSchema,
  name: z.string().min(1).max(255).describe('Product title/name'),
  slug: SlugSchema,
  description: z.string().max(10000).nullish(),
  priceInCents: z.number().int().nonnegative().describe('Price in cents (ARCH-25): $19.99 = 1999'),
  status: ProductStatusSchema.default('draft'),
  productType: z.string().max(100).nullish().describe('Product type (e.g., Physical, Digital, Service)'),
  vendor: z.string().max(255).nullish().describe('Product vendor/brand'),
  tags: z.array(z.string().max(50)).default([]).describe('Tags for filtering/organization'),
}).merge(TimestampsSchema);

export type Product = z.infer<typeof ProductSchema>;

/**
 * List products query schema with pagination and filtering
 */
export const ListProductsSchema = PaginationSchema.extend({
  status: ProductStatusSchema.optional().describe('Filter by product status'),
  search: z.string().max(100).optional().describe('Search in name, description, vendor'),
  productType: z.string().optional().describe('Filter by product type'),
  vendor: z.string().optional().describe('Filter by vendor'),
  tags: z.array(z.string()).optional().describe('Filter by tags (OR match)'),
});

export type ListProductsInput = z.infer<typeof ListProductsSchema>;

/**
 * Product response schema (what API returns)
 */
export const ProductResponseSchema = ProductSchema;
export type ProductResponse = z.infer<typeof ProductResponseSchema>;
