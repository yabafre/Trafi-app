'use client'

import { useServerActionQuery } from '@/lib/server-action-hooks'
import { getTransferHistoryAction } from '../_actions/ownership-actions'

/**
 * Hook for fetching ownership transfer history
 * Only accessible by store Owner
 */
export function useTransferHistory() {
  return useServerActionQuery(getTransferHistoryAction, {
    queryKey: ['transfer-history'],
    input: undefined,
  })
}
