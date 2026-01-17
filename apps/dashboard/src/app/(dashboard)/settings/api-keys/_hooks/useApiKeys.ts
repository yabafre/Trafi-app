'use client'

import { useServerActionQuery } from '@/lib/server-action-hooks'
import { getApiKeysAction } from '../_actions/api-key-actions'
import type { ListApiKeysInput } from '@trafi/validators'

/**
 * Hook for fetching API keys list with React Query
 * Handles loading, error states, and caching automatically
 */
export function useApiKeys(input: ListApiKeysInput = { page: 1, limit: 20, includeRevoked: false }) {
  return useServerActionQuery(getApiKeysAction, {
    input,
    queryKey: ['api-keys', input],
  })
}
