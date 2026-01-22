'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useServerActionMutation } from '@/lib/server-action-hooks'
import {
  createGiftCardTemplateAction,
  updateGiftCardTemplateAction,
  deleteGiftCardTemplateAction,
  activateGiftCardTemplateAction,
  deactivateGiftCardTemplateAction,
} from '../_actions/gift-card-template-actions'
import { toast } from 'sonner'

/**
 * Hook for creating a new gift card template
 * Automatically invalidates templates cache on success
 *
 * @see Story 3.10 - Gift Cards (AC1, AC6)
 */
export function useCreateGiftCardTemplate() {
  const queryClient = useQueryClient()

  return useServerActionMutation(createGiftCardTemplateAction, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['giftCardTemplates'] })
      toast.success('Template created successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create template')
    },
  })
}

/**
 * Hook for updating an existing template
 * Automatically invalidates templates cache on success
 */
export function useUpdateGiftCardTemplate() {
  const queryClient = useQueryClient()

  return useServerActionMutation(updateGiftCardTemplateAction, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['giftCardTemplates'] })
      toast.success('Template updated successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update template')
    },
  })
}

/**
 * Hook for deleting a template
 * Automatically invalidates templates cache on success
 */
export function useDeleteGiftCardTemplate() {
  const queryClient = useQueryClient()

  return useServerActionMutation(deleteGiftCardTemplateAction, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['giftCardTemplates'] })
      toast.success('Template deleted successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete template')
    },
  })
}

/**
 * Hook for activating a template
 * Automatically invalidates templates cache on success
 */
export function useActivateGiftCardTemplate() {
  const queryClient = useQueryClient()

  return useServerActionMutation(activateGiftCardTemplateAction, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['giftCardTemplates'] })
      toast.success('Template activated')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to activate template')
    },
  })
}

/**
 * Hook for deactivating a template
 * Automatically invalidates templates cache on success
 */
export function useDeactivateGiftCardTemplate() {
  const queryClient = useQueryClient()

  return useServerActionMutation(deactivateGiftCardTemplateAction, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['giftCardTemplates'] })
      toast.success('Template deactivated')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to deactivate template')
    },
  })
}
