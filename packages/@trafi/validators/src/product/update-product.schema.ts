import { z } from 'zod';
import { CreateProductSchema } from './create-product.schema';

/**
 * Schema for updating a product
 * All fields are optional except storeId (tenant scope)
 */
export const UpdateProductSchema = CreateProductSchema.partial().required({
  storeId: true,
});

export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
