'use client'

import { useServerActionQuery } from '@/lib/server-action-hooks'
import { getTaxRuleAction, getDefaultTaxRuleAction } from '../_actions/tax-rule-actions'

/**
 * Hook for fetching a single tax rule by ID
 *
 * @see Story 3.6 - Product Pricing and Tax Rules
 */
export function useTaxRule(id: string | undefined) {
  return useServerActionQuery(getTaxRuleAction, {
    input: { id: id ?? '' },
    queryKey: ['taxRules', 'detail', id],
    enabled: !!id,
  })
}

/**
 * Hook for fetching the default tax rule
 *
 * @param countryCode - Optional country code filter
 */
export function useDefaultTaxRule(countryCode?: string) {
  return useServerActionQuery(getDefaultTaxRuleAction, {
    input: { countryCode },
    queryKey: ['taxRules', 'default', countryCode],
  })
}
