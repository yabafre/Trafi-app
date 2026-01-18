/**
 * Collection Validators
 *
 * Zod schemas for collection management in Trafi.
 * Collections are flat (no hierarchy) curated product groups.
 * @see Story 3.5 - Collections Management
 */

import { z } from '@trafi/zod';

// =============================================================================
// Constants
// =============================================================================

export const COLLECTION_CONSTANTS = {
  NAME_MIN_LENGTH: 1,
  NAME_MAX_LENGTH: 100,
  SLUG_MAX_LENGTH: 150,
  DESCRIPTION_MAX_LENGTH: 1000,
  IMAGE_URL_MAX_LENGTH: 2048,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// =============================================================================
// Input Schemas (for mutations)
// =============================================================================

/**
 * Schema for creating a new collection
 */
export const CreateCollectionSchema = z.object({
  name: z
    .string()
    .min(COLLECTION_CONSTANTS.NAME_MIN_LENGTH, 'Name is required')
    .max(COLLECTION_CONSTANTS.NAME_MAX_LENGTH, `Name must be at most ${COLLECTION_CONSTANTS.NAME_MAX_LENGTH} characters`),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .max(COLLECTION_CONSTANTS.SLUG_MAX_LENGTH, `Slug must be at most ${COLLECTION_CONSTANTS.SLUG_MAX_LENGTH} characters`)
    .optional(),
  description: z
    .string()
    .max(COLLECTION_CONSTANTS.DESCRIPTION_MAX_LENGTH, `Description must be at most ${COLLECTION_CONSTANTS.DESCRIPTION_MAX_LENGTH} characters`)
    .optional()
    .nullable(),
  imageUrl: z
    .string()
    .url('Invalid URL format')
    .max(COLLECTION_CONSTANTS.IMAGE_URL_MAX_LENGTH, `Image URL must be at most ${COLLECTION_CONSTANTS.IMAGE_URL_MAX_LENGTH} characters`)
    .optional()
    .nullable(),
  isVisible: z.boolean().optional().default(true),
  isFeatured: z.boolean().optional().default(false),
});

/**
 * Schema for updating an existing collection
 */
export const UpdateCollectionSchema = z.object({
  id: z.string(),
  name: z
    .string()
    .min(COLLECTION_CONSTANTS.NAME_MIN_LENGTH)
    .max(COLLECTION_CONSTANTS.NAME_MAX_LENGTH)
    .optional(),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .max(COLLECTION_CONSTANTS.SLUG_MAX_LENGTH)
    .optional(),
  description: z
    .string()
    .max(COLLECTION_CONSTANTS.DESCRIPTION_MAX_LENGTH)
    .optional()
    .nullable(),
  imageUrl: z
    .string()
    .url()
    .max(COLLECTION_CONSTANTS.IMAGE_URL_MAX_LENGTH)
    .optional()
    .nullable(),
  isVisible: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

/**
 * Schema for adding products to a collection
 */
export const AddProductsToCollectionSchema = z.object({
  collectionId: z.string(),
  productIds: z.array(z.string()).min(1, 'At least one product is required'),
});

/**
 * Schema for removing products from a collection
 */
export const RemoveProductsFromCollectionSchema = z.object({
  collectionId: z.string(),
  productIds: z.array(z.string()).min(1, 'At least one product is required'),
});

/**
 * Schema for reordering products within a collection
 */
export const ReorderCollectionProductsSchema = z.object({
  collectionId: z.string(),
  productIds: z.array(z.string()), // Ordered array of product IDs
});

/**
 * Schema for listing collections with pagination and filters
 */
export const ListCollectionsSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(COLLECTION_CONSTANTS.MAX_PAGE_SIZE).optional().default(COLLECTION_CONSTANTS.DEFAULT_PAGE_SIZE),
  isVisible: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  search: z.string().optional(),
});

/**
 * Schema for getting a single collection
 */
export const GetCollectionSchema = z.object({
  id: z.string(),
});

/**
 * Schema for deleting a collection
 */
export const DeleteCollectionSchema = z.object({
  id: z.string(),
});

// =============================================================================
// Response Schemas
// =============================================================================

/**
 * Schema for a single collection response
 */
export const CollectionResponseSchema = z.object({
  id: z.string(),
  storeId: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  isVisible: z.boolean(),
  isFeatured: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  _count: z
    .object({
      products: z.number(),
    })
    .optional(),
});

/**
 * Schema for collection list item (with product count)
 */
export const CollectionListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  isVisible: z.boolean(),
  isFeatured: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  productCount: z.number(),
});

/**
 * Schema for paginated collection list response
 */
export const CollectionListResponseSchema = z.object({
  collections: z.array(CollectionListItemSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

/**
 * Schema for collection product (within a collection)
 */
export const CollectionProductSchema = z.object({
  productId: z.string(),
  position: z.number(),
  product: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    priceInCents: z.number(),
    status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']),
    media: z.array(z.object({
      id: z.string(),
      url: z.string(),
      alt: z.string().nullable(),
      position: z.number(),
    })).optional(),
  }),
});

/**
 * Schema for collection with products response
 */
export const CollectionWithProductsSchema = z.object({
  id: z.string(),
  storeId: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  isVisible: z.boolean(),
  isFeatured: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  products: z.array(CollectionProductSchema),
});

// =============================================================================
// Inferred Types
// =============================================================================

export type CreateCollectionInput = z.input<typeof CreateCollectionSchema>;
export type UpdateCollectionInput = z.infer<typeof UpdateCollectionSchema>;
export type AddProductsToCollectionInput = z.infer<typeof AddProductsToCollectionSchema>;
export type RemoveProductsFromCollectionInput = z.infer<typeof RemoveProductsFromCollectionSchema>;
export type ReorderCollectionProductsInput = z.infer<typeof ReorderCollectionProductsSchema>;
export type ListCollectionsInput = z.infer<typeof ListCollectionsSchema>;
export type GetCollectionInput = z.infer<typeof GetCollectionSchema>;
export type DeleteCollectionInput = z.infer<typeof DeleteCollectionSchema>;
export type CollectionResponse = z.infer<typeof CollectionResponseSchema>;
export type CollectionListItem = z.infer<typeof CollectionListItemSchema>;
export type CollectionListResponse = z.infer<typeof CollectionListResponseSchema>;
export type CollectionProduct = z.infer<typeof CollectionProductSchema>;
export type CollectionWithProducts = z.infer<typeof CollectionWithProductsSchema>;
