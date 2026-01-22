'use client'

import { useServerActionQuery } from '@/lib/server-action-hooks'
import { getPromotionListAction } from '../_actions/promotion-actions'

interface UsePromotionListOptions {
  status?: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'ARCHIVED'
  type?: 'PERCENT' | 'FIXED' | 'FREE_SHIPPING' | 'BUY_X_GET_Y'
  search?: string
  activeOnly?: boolean
  includeExpired?: boolean
  page?: number
  limit?: number
}

/**
 * Hook for fetching paginated list of promotions
 *
 * @see Story 3.9 - Promotions & Discounts Foundation
 */
export function usePromotionList(options: UsePromotionListOptions = {}) {
  return useServerActionQuery(getPromotionListAction, {
    input: options,
    queryKey: ['promotions', 'list', options],
  })
}
