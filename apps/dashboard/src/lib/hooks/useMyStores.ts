'use client'

import { useMemo } from 'react'
import { useServerActionQuery } from '@/lib/server-action-hooks'
import { getMyStoresAction, type StoreInfo } from '@/app/(dashboard)/_actions'

/**
 * Query key for my stores
 */
export const MY_STORES_QUERY_KEY = ['auth', 'myStores'] as const

/**
 * Return type for useMyStores hook
 */
export interface UseMyStoresReturn {
  /** All stores the user has access to */
  stores: StoreInfo[]
  /** ID of the currently active store */
  currentStoreId: string | null
  /** Currently active store info */
  currentStore: StoreInfo | null
  /** Whether the user has multiple stores */
  hasMultipleStores: boolean
  /** Loading state */
  isLoading: boolean
  /** Error state */
  error: Error | null
  /** Refetch stores */
  refetch: () => void
}

/**
 * Hook to get all stores the current user has access to
 * Uses zsa pattern: Server Action -> tRPC -> auth.myStores
 *
 * @see Story 2-R2 - Store Switching UI (AC: 1, 4)
 */
export function useMyStores(): UseMyStoresReturn {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useServerActionQuery(getMyStoresAction, {
    queryKey: MY_STORES_QUERY_KEY,
    input: undefined,
  })

  // Memoize derived values to prevent unnecessary re-renders
  const stores = useMemo(() => data?.stores ?? [], [data?.stores])

  const currentStore = useMemo(
    () => stores.find((store) => store.isCurrent) ?? null,
    [stores]
  )

  const currentStoreId = useMemo(
    () => currentStore?.id ?? null,
    [currentStore]
  )

  const hasMultipleStores = useMemo(
    () => stores.length > 1,
    [stores.length]
  )

  return {
    stores,
    currentStoreId,
    currentStore,
    hasMultipleStores,
    isLoading,
    // Safely cast error - useServerActionQuery returns unknown error type
    error: error instanceof Error ? error : error ? new Error(String(error)) : null,
    refetch,
  }
}
