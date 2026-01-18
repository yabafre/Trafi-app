import { z } from '@trafi/zod';
import { ProductSchema } from './product.schema';

/**
 * Schema for creating a new product
 * Omits auto-generated fields (id, timestamps) and storeId (injected from context)
 *
 * @example
 * {
 *   name: "Premium T-Shirt",
 *   slug: "premium-t-shirt", // Optional - auto-generated from name if not provided
 *   description: "A high-quality cotton t-shirt",
 *   priceInCents: 2999, // $29.99
 *   status: "draft",
 *   productType: "Physical",
 *   vendor: "Trafi Apparel",
 *   tags: ["clothing", "summer"]
 * }
 */
export const CreateProductSchema = ProductSchema.omit({
  id: true,
  storeId: true, // Injected from tenant context
  createdAt: true,
  updatedAt: true,
}).extend({
  // Slug is optional - will be auto-generated from name if not provided
  slug: z.string().min(1).max(255).optional(),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
