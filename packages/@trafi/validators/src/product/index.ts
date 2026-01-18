/**
 * Product validation schemas
 *
 * @module @trafi/validators/product
 * @see Story 3.1 - Product Model and Basic CRUD
 */

export * from './product.schema';
export * from './create-product.schema';
export * from './update-product.schema';

// Re-export commonly used types for convenience
export type {
  Product,
  ProductStatus,
  ListProductsInput,
  ProductResponse,
} from './product.schema';
export type { CreateProductInput } from './create-product.schema';
export type { UpdateProductInput } from './update-product.schema';
