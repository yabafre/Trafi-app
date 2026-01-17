'use client'

import { useServerActionQuery } from '@/lib/server-action-hooks'
import { getPendingTransferAction } from '../_actions/ownership-actions'

/**
 * Hook for fetching pending ownership transfer
 * Polls every 60 seconds to check for updates
 *
 * Returns null if no pending transfer exists
 */
export function usePendingTransfer() {
  return useServerActionQuery(getPendingTransferAction, {
    queryKey: ['pending-transfer'],
    input: undefined,
    refetchInterval: 60000, // Check every minute
  })
}
