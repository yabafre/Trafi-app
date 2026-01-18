/**
 * Product server actions
 *
 * Server-side actions for product CRUD operations.
 * Uses tRPC for type-safe API communication.
 *
 * @see Story 3.1 - Product Model and Basic CRUD
 */

export {
  getProductsAction,
  getProductAction,
  createProductAction,
  updateProductAction,
  deleteProductAction,
  type PaginatedProductsResponse,
} from './product-actions'
