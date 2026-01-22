'use client'

import { useServerActionQuery } from '@/lib/server-action-hooks'
import { getGiftCardListAction } from '../_actions/gift-card-actions'

interface UseGiftCardListOptions {
  status?: 'PENDING' | 'ACTIVE' | 'DISABLED' | 'EXPIRED' | 'DEPLETED'
  templateId?: string
  search?: string
  fromDate?: Date
  toDate?: Date
  hasBalance?: boolean
  page?: number
  limit?: number
}

/**
 * Hook for fetching paginated list of gift cards
 *
 * @see Story 3.10 - Gift Cards
 */
export function useGiftCardList(options: UseGiftCardListOptions = {}) {
  return useServerActionQuery(getGiftCardListAction, {
    input: options,
    queryKey: ['giftCards', 'list', options],
  })
}
