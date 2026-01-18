'use client'

import { useServerActionQuery } from '@/lib/server-action-hooks'
import { getProductsAction } from '../_actions/product-actions'
import type { ListProductsInput } from '@trafi/validators'

/**
 * Hook for fetching products list with React Query
 * Handles loading, error states, and caching automatically
 *
 * @see Story 3.1 - Product Model and Basic CRUD
 */
export function useProducts(
  input: ListProductsInput = { page: 1, limit: 20, sortOrder: 'desc' }
) {
  return useServerActionQuery(getProductsAction, {
    input,
    queryKey: ['products', input],
  })
}
