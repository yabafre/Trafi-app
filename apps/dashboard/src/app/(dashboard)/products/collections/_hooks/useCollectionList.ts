'use client'

import { useServerActionQuery } from '@/lib/server-action-hooks'
import { getCollectionListAction } from '../_actions/collection-actions'
import type { CollectionListResponse } from '@trafi/validators'

interface UseCollectionListOptions {
  page?: number
  limit?: number
  isVisible?: boolean
  isFeatured?: boolean
  search?: string
}

/**
 * Hook for fetching paginated list of collections
 * Returns list with product counts
 *
 * @see Story 3.5 - Collections Management
 */
export function useCollectionList(options: UseCollectionListOptions = {}) {
  return useServerActionQuery(getCollectionListAction, {
    input: options,
    queryKey: ['collections', 'list', options],
  })
}
