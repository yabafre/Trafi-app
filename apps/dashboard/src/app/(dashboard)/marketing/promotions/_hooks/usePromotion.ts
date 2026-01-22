'use client'

import { useServerActionQuery } from '@/lib/server-action-hooks'
import { getPromotionAction } from '../_actions/promotion-actions'

/**
 * Hook for fetching a single promotion by ID
 *
 * @see Story 3.9 - Promotions & Discounts Foundation
 */
export function usePromotion(promotionId: string) {
  return useServerActionQuery(getPromotionAction, {
    input: { id: promotionId },
    queryKey: ['promotions', 'detail', promotionId],
    enabled: !!promotionId,
  })
}
