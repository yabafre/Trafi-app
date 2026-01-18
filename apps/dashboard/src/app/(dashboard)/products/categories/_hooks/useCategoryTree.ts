'use client'

import { useServerActionQuery } from '@/lib/server-action-hooks'
import { getCategoryTreeAction } from '../_actions/category-actions'

/**
 * Hook for fetching the full category tree
 * Returns nested tree structure with children
 *
 * @see Story 3.4 - Categories Management
 */
export function useCategoryTree() {
  return useServerActionQuery(getCategoryTreeAction, {
    input: undefined,
    queryKey: ['categories', 'tree'],
  })
}
