'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useServerActionMutation } from '@/lib/server-action-hooks'
import {
  issueGiftCardAction,
  adjustGiftCardBalanceAction,
  disableGiftCardAction,
  enableGiftCardAction,
} from '../_actions/gift-card-actions'
import { toast } from 'sonner'

/**
 * Hook for issuing a new gift card
 * Automatically invalidates gift cards cache on success
 *
 * @see Story 3.10 - Gift Cards
 */
export function useIssueGiftCard() {
  const queryClient = useQueryClient()

  return useServerActionMutation(issueGiftCardAction, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['giftCards'] })
      toast.success('Gift card issued successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to issue gift card')
    },
  })
}

/**
 * Hook for adjusting gift card balance
 * Automatically invalidates gift cards cache on success
 */
export function useAdjustGiftCardBalance() {
  const queryClient = useQueryClient()

  return useServerActionMutation(adjustGiftCardBalanceAction, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['giftCards'] })
      toast.success('Balance adjusted successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to adjust balance')
    },
  })
}

/**
 * Hook for disabling a gift card
 * Automatically invalidates gift cards cache on success
 */
export function useDisableGiftCard() {
  const queryClient = useQueryClient()

  return useServerActionMutation(disableGiftCardAction, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['giftCards'] })
      toast.success('Gift card disabled')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to disable gift card')
    },
  })
}

/**
 * Hook for enabling a disabled gift card
 * Automatically invalidates gift cards cache on success
 */
export function useEnableGiftCard() {
  const queryClient = useQueryClient()

  return useServerActionMutation(enableGiftCardAction, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['giftCards'] })
      toast.success('Gift card enabled')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to enable gift card')
    },
  })
}
