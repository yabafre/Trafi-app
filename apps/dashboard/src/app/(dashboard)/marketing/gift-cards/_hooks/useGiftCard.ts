'use client'

import { useServerActionQuery } from '@/lib/server-action-hooks'
import { getGiftCardAction, getGiftCardTransactionsAction } from '../_actions/gift-card-actions'

/**
 * Hook for fetching a single gift card by ID
 *
 * @see Story 3.10 - Gift Cards
 */
export function useGiftCard(id: string | undefined) {
  return useServerActionQuery(getGiftCardAction, {
    input: { id: id ?? '' },
    queryKey: ['giftCards', 'detail', id],
    enabled: !!id,
  })
}

/**
 * Hook for fetching gift card transactions
 *
 * @see Story 3.10 - Gift Cards
 */
export function useGiftCardTransactions(
  giftCardId: string | undefined,
  options: { page?: number; limit?: number } = {},
) {
  return useServerActionQuery(getGiftCardTransactionsAction, {
    input: { giftCardId: giftCardId ?? '', ...options },
    queryKey: ['giftCards', 'transactions', giftCardId, options],
    enabled: !!giftCardId,
  })
}
