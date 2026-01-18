/**
 * Product Detail Page Hooks
 *
 * @see Story 3.2 - Product Variants Management
 * @see Story 3.3 - Product Media Upload
 */

// Variant Hooks
export { useVariants, VARIANTS_QUERY_KEY } from './useVariants';
export type { UseVariantsOptions } from './useVariants';

export { useCreateVariant } from './useCreateVariant';
export type { UseCreateVariantOptions } from './useCreateVariant';

export { useBulkCreateVariants } from './useBulkCreateVariants';
export type { UseBulkCreateVariantsOptions } from './useBulkCreateVariants';

export { useUpdateVariant } from './useUpdateVariant';
export type { UseUpdateVariantOptions } from './useUpdateVariant';

export { useDeleteVariant } from './useDeleteVariant';
export type { UseDeleteVariantOptions } from './useDeleteVariant';

// Media Hooks
export { useMedia, MEDIA_QUERY_KEY } from './useMedia';
export type { UseMediaOptions } from './useMedia';

export { useUploadMedia } from './useUploadMedia';
export type { UseUploadMediaOptions, UseUploadMediaReturn } from './useUploadMedia';

export { useUpdateMedia } from './useUpdateMedia';
export type { UseUpdateMediaOptions } from './useUpdateMedia';

export { useReorderMedia } from './useReorderMedia';
export type { UseReorderMediaOptions } from './useReorderMedia';

export { useDeleteMedia } from './useDeleteMedia';
export type { UseDeleteMediaOptions } from './useDeleteMedia';

// Category Hooks
export { useProductCategories, PRODUCT_CATEGORIES_QUERY_KEY } from './useProductCategories';
export type { UseProductCategoriesOptions } from './useProductCategories';
