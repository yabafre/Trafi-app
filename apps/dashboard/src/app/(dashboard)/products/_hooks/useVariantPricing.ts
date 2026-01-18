'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useServerActionMutation, useServerActionQuery } from '@/lib/server-action-hooks'
import {
  updateVariantPricingAction,
  calculateTaxAction,
  calculateMarginAction,
} from '../_actions/pricing-actions'
import { getTaxRulesForSelectAction } from '@/app/(dashboard)/settings/tax-rules/_actions/tax-rule-actions'
import { toast } from 'sonner'

/**
 * Hook for updating variant pricing
 * Automatically invalidates variants cache on success
 *
 * @see Story 3.6 - Product Pricing and Tax Rules
 */
export function useUpdateVariantPricing() {
  const queryClient = useQueryClient()

  return useServerActionMutation(updateVariantPricingAction, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['variants'] })
      await queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Pricing updated successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update pricing')
    },
  })
}

/**
 * Hook for calculating tax
 * Pure calculation, no cache invalidation needed
 */
export function useCalculateTax() {
  return useServerActionMutation(calculateTaxAction, {
    onError: (error) => {
      console.error('Tax calculation error:', error.message)
    },
  })
}

/**
 * Hook for calculating margin
 * Pure calculation, no cache invalidation needed
 */
export function useCalculateMargin() {
  return useServerActionMutation(calculateMarginAction, {
    onError: (error) => {
      console.error('Margin calculation error:', error.message)
    },
  })
}

/**
 * Hook for fetching tax rules for dropdown
 * Used in pricing section for tax rule selection
 */
export function useTaxRulesForSelect() {
  return useServerActionQuery(getTaxRulesForSelectAction, {
    input: undefined,
    queryKey: ['taxRules', 'select'],
  })
}
