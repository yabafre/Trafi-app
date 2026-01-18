'use client'

import { useServerActionQuery } from '@/lib/server-action-hooks'
import { getCategoryListAction } from '../_actions/category-actions'

/**
 * Hook for fetching a flat list of categories
 * Useful for dropdowns and select components
 *
 * @see Story 3.4 - Categories Management
 */
export function useCategoryList() {
  return useServerActionQuery(getCategoryListAction, {
    input: undefined,
    queryKey: ['categories', 'list'],
  })
}
