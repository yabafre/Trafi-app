/**
 * Categories Server Actions
 *
 * @see Story 3.4 - Categories Management
 */

export {
  getCategoryTreeAction,
  getCategoryListAction,
  getCategoryAction,
  createCategoryAction,
  updateCategoryAction,
  reorderCategoryAction,
  deleteCategoryAction,
  assignProductsToCategoryAction,
  removeProductsFromCategoryAction,
  getCategoryProductCountAction,
  getProductCategoriesAction,
} from './category-actions'

export type { CategoryWithProductCount } from './category-actions'
