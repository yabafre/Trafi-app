'use client'

import { useServerActionQuery } from '@/lib/server-action-hooks'
import { getCouponListAction } from '../_actions/coupon-actions'

interface UseCouponListOptions {
  promotionId?: string
  isActive?: boolean
  search?: string
  includeExpired?: boolean
  page?: number
  limit?: number
}

/**
 * Hook for fetching paginated list of coupons
 *
 * @see Story 3.9 - Promotions & Discounts Foundation
 */
export function useCouponList(options: UseCouponListOptions = {}) {
  return useServerActionQuery(getCouponListAction, {
    input: options,
    queryKey: ['coupons', 'list', options],
  })
}
