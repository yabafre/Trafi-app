'use client'

import { useServerActionQuery } from '@/lib/server-action-hooks'
import { getCategoryAction } from '../_actions/category-actions'

/**
 * Hook for fetching a single category by ID
 *
 * @see Story 3.4 - Categories Management
 */
export function useCategory(id: string) {
  return useServerActionQuery(getCategoryAction, {
    input: { id },
    queryKey: ['categories', id],
    enabled: !!id,
  })
}
