'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useServerActionMutation } from '@/lib/server-action-hooks'
import {
  createTaxRuleAction,
  updateTaxRuleAction,
  deleteTaxRuleAction,
  setDefaultTaxRuleAction,
} from '../_actions/tax-rule-actions'
import { toast } from 'sonner'

/**
 * Hook for creating a new tax rule
 * Automatically invalidates tax rules cache on success
 *
 * @see Story 3.6 - Product Pricing and Tax Rules
 */
export function useCreateTaxRule() {
  const queryClient = useQueryClient()

  return useServerActionMutation(createTaxRuleAction, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['taxRules'] })
      toast.success('Tax rule created successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create tax rule')
    },
  })
}

/**
 * Hook for updating an existing tax rule
 * Automatically invalidates tax rules cache on success
 */
export function useUpdateTaxRule() {
  const queryClient = useQueryClient()

  return useServerActionMutation(updateTaxRuleAction, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['taxRules'] })
      toast.success('Tax rule updated successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update tax rule')
    },
  })
}

/**
 * Hook for deleting a tax rule
 * Automatically invalidates tax rules cache on success
 */
export function useDeleteTaxRule() {
  const queryClient = useQueryClient()

  return useServerActionMutation(deleteTaxRuleAction, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['taxRules'] })
      toast.success('Tax rule deleted successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete tax rule')
    },
  })
}

/**
 * Hook for setting a tax rule as default
 * Automatically invalidates tax rules cache on success
 */
export function useSetDefaultTaxRule() {
  const queryClient = useQueryClient()

  return useServerActionMutation(setDefaultTaxRuleAction, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['taxRules'] })
      toast.success('Default tax rule updated')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to set default tax rule')
    },
  })
}
