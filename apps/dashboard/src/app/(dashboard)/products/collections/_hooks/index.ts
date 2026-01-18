/**
 * Collections hooks exports
 *
 * Client-side hooks for collection CRUD operations.
 * Uses React Query via zsa-react for caching and state management.
 *
 * @see Story 3.5 - Collections Management
 */

export { useCollectionList } from './useCollectionList'
export { useCollection, useCollectionWithProducts } from './useCollection'
export { useCreateCollection } from './useCreateCollection'
export { useUpdateCollection } from './useUpdateCollection'
export { useDeleteCollection } from './useDeleteCollection'
export {
  useAddProductsToCollection,
  useRemoveProductsFromCollection,
  useReorderCollectionProducts,
} from './useCollectionProducts'
