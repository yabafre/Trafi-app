'use client'

import { useServerActionQuery } from '@/lib/server-action-hooks'
import { getProductAction } from '../_actions/product-actions'

/**
 * Hook for fetching a single product by ID
 * Handles loading, error states, and caching automatically
 *
 * @see Story 3.1 - Product Model and Basic CRUD
 */
export function useProduct(productId: string) {
  return useServerActionQuery(getProductAction, {
    input: { id: productId },
    queryKey: ['product', productId],
    enabled: !!productId,
  })
}
