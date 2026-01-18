/**
 * Collection Types
 *
 * TypeScript types for collection management.
 * Re-exports inferred types from @trafi/validators for convenience.
 * @see Story 3.5 - Collections Management
 */

export type {
  CreateCollectionInput,
  UpdateCollectionInput,
  AddProductsToCollectionInput,
  RemoveProductsFromCollectionInput,
  ReorderCollectionProductsInput,
  ListCollectionsInput,
  GetCollectionInput,
  DeleteCollectionInput,
  CollectionResponse,
  CollectionListItem,
  CollectionListResponse,
  CollectionProduct,
  CollectionWithProducts,
} from '@trafi/validators';

export { COLLECTION_CONSTANTS } from '@trafi/validators';
