/**
 * Product Media Validation Schemas
 *
 * @see Story 3.3 - Product Media Upload
 */
import { z } from '@trafi/zod';

// =============================================================================
// Media Type Schema
// =============================================================================

/**
 * Supported media types
 */
export const MediaTypeSchema = z.enum(['IMAGE', 'VIDEO']);
export type MediaType = z.infer<typeof MediaTypeSchema>;

// =============================================================================
// Media Constants
// =============================================================================

/**
 * File validation constants
 */
export const MEDIA_CONSTANTS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_IMAGES_PER_PRODUCT: 10,
  MAX_URL_LENGTH: 2048,
  MAX_ALT_TEXT_LENGTH: 500,
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const,
  OPTIMIZED_MAX_SIZE: 2000, // max dimension
  THUMBNAIL_SIZE: 400, // square thumbnail
  WEBP_QUALITY: 85,
  THUMBNAIL_QUALITY: 80,
} as const;

// =============================================================================
// Update Media Schema
// =============================================================================

/**
 * Schema for updating media metadata (alt text, position, primary status)
 */
export const UpdateMediaSchema = z.object({
  id: z.string().min(1, 'Media ID is required'),
  altText: z.string().max(MEDIA_CONSTANTS.MAX_ALT_TEXT_LENGTH).optional(),
  position: z.number().int().nonnegative().optional(),
  isPrimary: z.boolean().optional(),
});
export type UpdateMediaInput = z.infer<typeof UpdateMediaSchema>;

// =============================================================================
// Reorder Media Schema
// =============================================================================

/**
 * Schema for reordering media items
 */
export const ReorderMediaSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  mediaIds: z
    .array(z.string().min(1))
    .min(1, 'At least one media ID is required')
    .max(MEDIA_CONSTANTS.MAX_IMAGES_PER_PRODUCT),
});
export type ReorderMediaInput = z.infer<typeof ReorderMediaSchema>;

// =============================================================================
// Delete Media Schema
// =============================================================================

/**
 * Schema for deleting media
 */
export const DeleteMediaSchema = z.object({
  id: z.string().min(1, 'Media ID is required'),
});
export type DeleteMediaInput = z.infer<typeof DeleteMediaSchema>;

// =============================================================================
// List Media Schema
// =============================================================================

/**
 * Schema for listing media by product
 */
export const ListMediaSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
});
export type ListMediaInput = z.infer<typeof ListMediaSchema>;

// =============================================================================
// Media Response Schema
// =============================================================================

/**
 * Schema for media response (returned from API)
 */
export const MediaResponseSchema = z.object({
  id: z.string(), // med_xxx
  productId: z.string(),
  variantId: z.string().nullable(),
  url: z.string().url(),
  thumbnailUrl: z.string().url(),
  altText: z.string().nullable(),
  type: MediaTypeSchema,
  position: z.number(),
  isPrimary: z.boolean(),
  width: z.number(),
  height: z.number(),
  sizeInBytes: z.number(),
  mimeType: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type MediaResponse = z.infer<typeof MediaResponseSchema>;

// =============================================================================
// Upload Media Response Schema
// =============================================================================

/**
 * Response from upload endpoint
 */
export const UploadMediaResponseSchema = z.object({
  success: z.boolean(),
  media: MediaResponseSchema.optional(),
  error: z.string().optional(),
});
export type UploadMediaResponse = z.infer<typeof UploadMediaResponseSchema>;
