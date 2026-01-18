/**
 * Products hooks exports
 *
 * Client-side hooks for product CRUD operations.
 * Uses React Query via zsa-react for caching and state management.
 *
 * @see Story 3.1 - Product Model and Basic CRUD
 */

export { useProducts } from './useProducts'
export { useProduct } from './useProduct'
export { useCreateProduct } from './useCreateProduct'
export { useUpdateProduct } from './useUpdateProduct'
export { useDeleteProduct } from './useDeleteProduct'

// Pricing hooks (Story 3.6)
export {
  useUpdateVariantPricing,
  useCalculateTax,
  useCalculateMargin,
  useTaxRulesForSelect,
} from './useVariantPricing'
