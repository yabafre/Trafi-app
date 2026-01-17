'use client'

import { useServerActionQuery } from '@/lib/server-action-hooks'
import { getStoreSettingsAction } from '../_actions/settings-actions'

/**
 * Hook for fetching store settings with React Query
 * Handles loading, error states, and caching automatically
 *
 * Returns default settings if none have been configured yet
 */
export function useStoreSettings() {
  return useServerActionQuery(getStoreSettingsAction, {
    queryKey: ['store-settings'],
  })
}
