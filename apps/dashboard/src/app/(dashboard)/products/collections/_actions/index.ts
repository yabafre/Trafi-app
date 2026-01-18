/**
 * Collection Actions - Barrel Export
 *
 * Re-exports all collection server actions for clean imports.
 * @see Story 3.5 - Collections Management
 */

export {
  getCollectionListAction,
  getCollectionAction,
  getCollectionWithProductsAction,
  createCollectionAction,
  updateCollectionAction,
  deleteCollectionAction,
  addProductsToCollectionAction,
  removeProductsFromCollectionAction,
  reorderCollectionProductsAction,
  getCollectionProductCountAction,
  getProductCollectionsAction,
  type CollectionWithProductCount,
} from './collection-actions'
