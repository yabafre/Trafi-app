'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useServerActionMutation } from '@/lib/server-action-hooks'
import {
  createPromotionAction,
  updatePromotionAction,
  deletePromotionAction,
  activatePromotionAction,
  pausePromotionAction,
  archivePromotionAction,
} from '../_actions/promotion-actions'
import { toast } from 'sonner'

/**
 * Hook for creating a new promotion
 * Automatically invalidates promotions cache on success
 *
 * @see Story 3.9 - Promotions & Discounts Foundation
 */
export function useCreatePromotion() {
  const queryClient = useQueryClient()

  return useServerActionMutation(createPromotionAction, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['promotions'] })
      toast.success('Promotion created successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create promotion')
    },
  })
}

/**
 * Hook for updating an existing promotion
 * Automatically invalidates promotions cache on success
 */
export function useUpdatePromotion() {
  const queryClient = useQueryClient()

  return useServerActionMutation(updatePromotionAction, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['promotions'] })
      toast.success('Promotion updated successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update promotion')
    },
  })
}

/**
 * Hook for deleting a promotion
 * Automatically invalidates promotions cache on success
 */
export function useDeletePromotion() {
  const queryClient = useQueryClient()

  return useServerActionMutation(deletePromotionAction, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['promotions'] })
      toast.success('Promotion deleted successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete promotion')
    },
  })
}

/**
 * Hook for activating a promotion
 * Automatically invalidates promotions cache on success
 */
export function useActivatePromotion() {
  const queryClient = useQueryClient()

  return useServerActionMutation(activatePromotionAction, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['promotions'] })
      toast.success('Promotion activated')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to activate promotion')
    },
  })
}

/**
 * Hook for pausing a promotion
 * Automatically invalidates promotions cache on success
 */
export function usePausePromotion() {
  const queryClient = useQueryClient()

  return useServerActionMutation(pausePromotionAction, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['promotions'] })
      toast.success('Promotion paused')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to pause promotion')
    },
  })
}

/**
 * Hook for archiving a promotion
 * Automatically invalidates promotions cache on success
 */
export function useArchivePromotion() {
  const queryClient = useQueryClient()

  return useServerActionMutation(archivePromotionAction, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['promotions'] })
      toast.success('Promotion archived')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to archive promotion')
    },
  })
}
