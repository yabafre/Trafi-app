/**
 * Categories hooks exports
 *
 * Client-side hooks for category CRUD operations.
 * Uses React Query via zsa-react for caching and state management.
 *
 * @see Story 3.4 - Categories Management
 */

export { useCategoryTree } from './useCategoryTree'
export { useCategoryList } from './useCategoryList'
export { useCategory } from './useCategory'
export { useCreateCategory } from './useCreateCategory'
export { useUpdateCategory } from './useUpdateCategory'
export { useDeleteCategory } from './useDeleteCategory'
export { useReorderCategory } from './useReorderCategory'
export { useAssignProductsToCategory, useRemoveProductsFromCategory } from './useCategoryProducts'
