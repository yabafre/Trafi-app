import { z } from 'zod';
import { ProductSchema } from './product.schema';

/**
 * Schema for creating a new product
 * Omits auto-generated fields (id, timestamps)
 */
export const CreateProductSchema = ProductSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
