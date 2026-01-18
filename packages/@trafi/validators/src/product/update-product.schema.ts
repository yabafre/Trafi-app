import { z } from '@trafi/zod';
import { CreateProductSchema } from './create-product.schema';

/**
 * Schema for updating a product
 * All fields are optional - partial updates allowed
 * storeId is NOT included (injected from tenant context)
 *
 * @example
 * {
 *   name: "Updated T-Shirt Name",
 *   status: "active"
 * }
 */
export const UpdateProductSchema = CreateProductSchema.partial();

export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
