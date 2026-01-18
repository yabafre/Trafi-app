/**
 * Category Types
 *
 * TypeScript types for category management.
 * Re-exports inferred types from @trafi/validators for convenience.
 * @see Story 3.4 - Categories Management
 */

export type {
  CreateCategoryInput,
  UpdateCategoryInput,
  ReorderCategoryInput,
  AssignProductsToCategoryInput,
  RemoveProductsFromCategoryInput,
  DeleteCategoryInput,
  CategoryResponse,
  CategoryTreeNode,
  CategoryListItem,
} from '@trafi/validators';

export { CATEGORY_CONSTANTS } from '@trafi/validators';
