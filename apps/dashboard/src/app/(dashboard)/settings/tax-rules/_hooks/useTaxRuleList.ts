'use client'

import { useServerActionQuery } from '@/lib/server-action-hooks'
import { getTaxRuleListAction } from '../_actions/tax-rule-actions'

interface UseTaxRuleListOptions {
  page?: number
  limit?: number
  countryIso2?: string
  isDefault?: boolean
}

/**
 * Hook for fetching paginated list of tax rules
 *
 * @see Story 3.6 - Product Pricing and Tax Rules
 */
export function useTaxRuleList(options: UseTaxRuleListOptions = {}) {
  return useServerActionQuery(getTaxRuleListAction, {
    input: options,
    queryKey: ['taxRules', 'list', options],
  })
}
