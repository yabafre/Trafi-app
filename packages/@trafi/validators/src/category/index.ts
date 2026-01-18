/**
 * Category Validators
 *
 * Zod schemas for category management in Trafi.
 * Categories support hierarchical organization up to 3 levels.
 * @see Story 3.4 - Categories Management
 */

import { z } from '@trafi/zod';

// =============================================================================
// Constants
// =============================================================================

export const CATEGORY_CONSTANTS = {
  NAME_MIN_LENGTH: 1,
  NAME_MAX_LENGTH: 100,
  SLUG_MAX_LENGTH: 150,
  DESCRIPTION_MAX_LENGTH: 500,
  IMAGE_URL_MAX_LENGTH: 2048,
  MAX_DEPTH: 2, // 0, 1, 2 = 3 levels total
} as const;

// =============================================================================
// Input Schemas (for mutations)
// =============================================================================

/**
 * Schema for creating a new category
 */
export const CreateCategorySchema = z.object({
  name: z
    .string()
    .min(CATEGORY_CONSTANTS.NAME_MIN_LENGTH, 'Name is required')
    .max(CATEGORY_CONSTANTS.NAME_MAX_LENGTH, `Name must be at most ${CATEGORY_CONSTANTS.NAME_MAX_LENGTH} characters`),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .max(CATEGORY_CONSTANTS.SLUG_MAX_LENGTH, `Slug must be at most ${CATEGORY_CONSTANTS.SLUG_MAX_LENGTH} characters`)
    .optional(),
  description: z
    .string()
    .max(CATEGORY_CONSTANTS.DESCRIPTION_MAX_LENGTH, `Description must be at most ${CATEGORY_CONSTANTS.DESCRIPTION_MAX_LENGTH} characters`)
    .optional()
    .nullable(),
  parentId: z.string().optional().nullable(),
  imageUrl: z
    .string()
    .url('Invalid URL format')
    .max(CATEGORY_CONSTANTS.IMAGE_URL_MAX_LENGTH, `Image URL must be at most ${CATEGORY_CONSTANTS.IMAGE_URL_MAX_LENGTH} characters`)
    .optional()
    .nullable(),
  position: z.number().int().nonnegative().optional().default(0),
});

/**
 * Schema for updating an existing category
 */
export const UpdateCategorySchema = z.object({
  id: z.string(),
  name: z
    .string()
    .min(CATEGORY_CONSTANTS.NAME_MIN_LENGTH)
    .max(CATEGORY_CONSTANTS.NAME_MAX_LENGTH)
    .optional(),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .max(CATEGORY_CONSTANTS.SLUG_MAX_LENGTH)
    .optional(),
  description: z
    .string()
    .max(CATEGORY_CONSTANTS.DESCRIPTION_MAX_LENGTH)
    .optional()
    .nullable(),
  imageUrl: z
    .string()
    .url()
    .max(CATEGORY_CONSTANTS.IMAGE_URL_MAX_LENGTH)
    .optional()
    .nullable(),
});

/**
 * Schema for reordering a category (move to new parent/position)
 */
export const ReorderCategorySchema = z.object({
  categoryId: z.string(),
  parentId: z.string().nullable(),
  position: z.number().int().nonnegative(),
});

/**
 * Schema for assigning products to a category
 */
export const AssignProductsToCategorySchema = z.object({
  categoryId: z.string(),
  productIds: z.array(z.string()).min(1, 'At least one product is required'),
});

/**
 * Schema for removing products from a category
 */
export const RemoveProductsFromCategorySchema = z.object({
  categoryId: z.string(),
  productIds: z.array(z.string()).min(1, 'At least one product is required'),
});

/**
 * Schema for deleting a category
 */
export const DeleteCategorySchema = z.object({
  id: z.string(),
});

// =============================================================================
// Response Schemas
// =============================================================================

/**
 * Schema for a single category response (flat)
 */
export const CategoryResponseSchema = z.object({
  id: z.string(),
  storeId: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  parentId: z.string().nullable(),
  imageUrl: z.string().nullable(),
  depth: z.number(),
  position: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
  _count: z
    .object({
      products: z.number(),
    })
    .optional(),
});

/**
 * Schema for category tree node (with nested children)
 */
export const CategoryTreeNodeSchema: z.ZodType<CategoryTreeNode> = z.lazy(() =>
  z.object({
    id: z.string(),
    storeId: z.string(),
    name: z.string(),
    slug: z.string(),
    description: z.string().nullable(),
    parentId: z.string().nullable(),
    imageUrl: z.string().nullable(),
    depth: z.number(),
    position: z.number(),
    createdAt: z.date(),
    updatedAt: z.date(),
    productCount: z.number().optional(),
    children: z.array(CategoryTreeNodeSchema),
  }),
);

/**
 * Schema for category tree response (array of root nodes)
 */
export const CategoryTreeResponseSchema = z.array(CategoryTreeNodeSchema);

/**
 * Schema for flat category list (for selects/dropdowns)
 */
export const CategoryListResponseSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    depth: z.number(),
    parentId: z.string().nullable(),
  }),
);

// =============================================================================
// Inferred Types
// =============================================================================

export type CreateCategoryInput = z.input<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
export type ReorderCategoryInput = z.infer<typeof ReorderCategorySchema>;
export type AssignProductsToCategoryInput = z.infer<typeof AssignProductsToCategorySchema>;
export type RemoveProductsFromCategoryInput = z.infer<typeof RemoveProductsFromCategorySchema>;
export type DeleteCategoryInput = z.infer<typeof DeleteCategorySchema>;
export type CategoryResponse = z.infer<typeof CategoryResponseSchema>;
export type CategoryListItem = z.infer<typeof CategoryListResponseSchema>[number];

/**
 * Category tree node type (with nested children)
 */
export interface CategoryTreeNode {
  id: string;
  storeId: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  imageUrl: string | null;
  depth: number;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  productCount?: number;
  children: CategoryTreeNode[];
}
