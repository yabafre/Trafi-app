'use client'

import { useServerActionQuery } from '@/lib/server-action-hooks'
import { getCollectionAction, getCollectionWithProductsAction } from '../_actions/collection-actions'

/**
 * Hook for fetching a single collection by ID (without products)
 *
 * @see Story 3.5 - Collections Management
 */
export function useCollection(id: string) {
  return useServerActionQuery(getCollectionAction, {
    input: { id },
    queryKey: ['collections', id],
    enabled: !!id,
  })
}

/**
 * Hook for fetching a single collection by ID with products
 * Includes full product details for display
 *
 * @see Story 3.5 - Collections Management
 */
export function useCollectionWithProducts(id: string) {
  return useServerActionQuery(getCollectionWithProductsAction, {
    input: { id },
    queryKey: ['collections', id, 'products'],
    enabled: !!id,
  })
}
