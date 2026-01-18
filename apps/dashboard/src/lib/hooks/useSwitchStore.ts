'use client'

import { useCallback, useState } from 'react'
import { useServerActionMutation } from '@/lib/server-action-hooks'
import { switchStoreAction } from '@/app/(dashboard)/_actions'
import { toast } from 'sonner'

/**
 * Return type for useSwitchStore hook
 */
export interface UseSwitchStoreReturn {
  /** Switch to a different store */
  switchStore: (storeId: string) => Promise<void>
  /** Loading state */
  isLoading: boolean
  /** Error state */
  error: Error | null
  /** Clear error */
  clearError: () => void
}

/**
 * Hook to switch between stores
 * Uses zsa pattern: Server Action -> tRPC -> auth.switchStore
 *
 * After successful switch:
 * 1. New tokens are stored in cookies (handled by server action)
 * 2. Page is refreshed to reinitialize auth context
 *
 * Note: We use window.location.reload() instead of React Query invalidation
 * because switching stores changes the entire auth context - all cached data
 * belongs to the old store and must be discarded completely.
 *
 * @see Story 2-R2 - Store Switching UI (AC: 2)
 */
export function useSwitchStore(): UseSwitchStoreReturn {
  const [error, setError] = useState<Error | null>(null)

  const { mutateAsync, isPending } = useServerActionMutation(switchStoreAction, {
    onError: (err: unknown) => {
      // Safely extract error message
      const errorMessage = err instanceof Error ? err.message : 'Failed to switch store'
      setError(err instanceof Error ? err : new Error(errorMessage))
      // AC2.5: Display error toast if switch fails
      toast.error(errorMessage)
    },
  })

  const switchStore = useCallback(
    async (storeId: string) => {
      setError(null)

      try {
        await mutateAsync({ storeId })

        // Full page refresh to reinitialize auth context with new store
        // Using window.location.reload() ensures all cached data is cleared
        // and the app starts fresh with the new store context
        window.location.reload()
      } catch (err) {
        // Error is already handled by onError callback
        // Re-throw for caller to handle if needed
        throw err
      }
    },
    [mutateAsync]
  )

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    switchStore,
    isLoading: isPending,
    error,
    clearError,
  }
}
