'use client'

/**
 * Hook to fetch categories for a product
 *
 * @see Story 3.4 - Categories Management
 */

import { useServerActionQuery } from '@/lib/server-action-hooks'
import { getProductCategoriesAction } from '@/app/(dashboard)/products/categories/_actions/category-actions'

export const PRODUCT_CATEGORIES_QUERY_KEY = (productId: string) =>
  ['products', productId, 'categories'] as const

export interface UseProductCategoriesOptions {
  productId: string
  enabled?: boolean
}

export function useProductCategories({
  productId,
  enabled = true,
}: UseProductCategoriesOptions) {
  return useServerActionQuery(getProductCategoriesAction, {
    queryKey: PRODUCT_CATEGORIES_QUERY_KEY(productId),
    input: { productId },
    enabled: enabled && !!productId,
  })
}
