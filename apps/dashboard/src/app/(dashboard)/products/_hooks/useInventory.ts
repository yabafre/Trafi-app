'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useServerActionMutation, useServerActionQuery } from '@/lib/server-action-hooks'
import {
  adjustInventoryAction,
  setInventoryAction,
  updateInventorySettingsAction,
  getVariantInventoryAction,
  getInventoryHistoryAction,
} from '../_actions/inventory-actions'
import { toast } from 'sonner'

/**
 * Hook for adjusting inventory by a delta amount
 * Automatically invalidates variants cache on success
 *
 * @see Story 3.7 - Inventory Tracking
 */
export function useAdjustInventory() {
  const queryClient = useQueryClient()

  return useServerActionMutation(adjustInventoryAction, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['variants'] })
      await queryClient.invalidateQueries({ queryKey: ['products'] })
      await queryClient.invalidateQueries({ queryKey: ['inventory'] })
      toast.success('Inventory adjusted')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to adjust inventory')
    },
  })
}

/**
 * Hook for setting inventory to an absolute value
 * Automatically invalidates variants cache on success
 */
export function useSetInventory() {
  const queryClient = useQueryClient()

  return useServerActionMutation(setInventoryAction, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['variants'] })
      await queryClient.invalidateQueries({ queryKey: ['products'] })
      await queryClient.invalidateQueries({ queryKey: ['inventory'] })
      toast.success('Inventory updated')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update inventory')
    },
  })
}

/**
 * Hook for updating inventory settings (trackInventory, lowStockThreshold, allowOversell)
 * Automatically invalidates variants cache on success
 */
export function useUpdateInventorySettings() {
  const queryClient = useQueryClient()

  return useServerActionMutation(updateInventorySettingsAction, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['variants'] })
      await queryClient.invalidateQueries({ queryKey: ['products'] })
      await queryClient.invalidateQueries({ queryKey: ['inventory'] })
      toast.success('Inventory settings updated')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update settings')
    },
  })
}

/**
 * Hook for fetching variant inventory info
 *
 * @param variantId - The variant ID to fetch inventory for
 */
export function useVariantInventory(variantId: string) {
  return useServerActionQuery(getVariantInventoryAction, {
    input: { variantId },
    queryKey: ['inventory', variantId],
    enabled: !!variantId,
  })
}

/**
 * Hook for fetching paginated inventory history
 *
 * @param variantId - The variant ID to fetch history for
 * @param page - Page number (default: 1)
 * @param limit - Page size (default: 20)
 */
export function useInventoryHistory(
  variantId: string,
  page: number = 1,
  limit: number = 20,
) {
  return useServerActionQuery(getInventoryHistoryAction, {
    input: { variantId, page, limit },
    queryKey: ['inventory', 'history', variantId, page, limit],
    enabled: !!variantId,
  })
}
