'use server'

import { revalidatePath } from 'next/cache'
import { createServerAction } from 'zsa'
import { z } from '@trafi/zod'
import { createAuthenticatedTrpcClient } from '@/lib/trpc'
import {
  CreateTaxRuleSchema,
  UpdateTaxRuleSchema,
  ListTaxRulesSchema,
  SetDefaultTaxRuleSchema,
} from '@trafi/validators'
// Note: Types are NOT re-exported from server actions files due to Next.js bundling issues.
// Import types directly from '@trafi/types' in consuming components.

/**
 * Tax rule response from API (with Date objects instead of strings)
 */
interface TaxRuleResponse {
  id: string
  storeId: string
  name: string
  rate: number
  countryIso2: string
  isDefault: boolean
  appliesToShipping: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * Paginated tax rules list result
 */
interface TaxRulesListResult {
  items: TaxRuleResponse[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

/**
 * Tax rule for select dropdown (minimal data)
 */
interface TaxRuleSelectItem {
  id: string
  name: string
  rate: number
  isDefault: boolean
}

/**
 * List tax rules with pagination and filters.
 * Returns paginated list.
 *
 * @see Story 3.6 - Product Pricing and Tax Rules
 */
export const getTaxRuleListAction = createServerAction()
  .input(ListTaxRulesSchema.partial())
  .handler(async ({ input }): Promise<TaxRulesListResult> => {
    const trpc = await createAuthenticatedTrpcClient()
    return await trpc.taxRules.list.query(input)
  })

/**
 * Get a single tax rule by ID.
 */
export const getTaxRuleAction = createServerAction()
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }): Promise<TaxRuleResponse> => {
    const trpc = await createAuthenticatedTrpcClient()
    return await trpc.taxRules.get.query({ id: input.id })
  })

/**
 * Get the default tax rule for the store.
 * Optionally filter by country code.
 */
export const getDefaultTaxRuleAction = createServerAction()
  .input(z.object({ countryCode: z.string().optional() }))
  .handler(async ({ input }): Promise<TaxRuleResponse | null> => {
    const trpc = await createAuthenticatedTrpcClient()
    return await trpc.taxRules.getDefault.query(input)
  })

/**
 * Get tax rules for dropdown/select usage.
 * Returns minimal data needed for selection.
 */
export const getTaxRulesForSelectAction = createServerAction()
  .handler(async (): Promise<TaxRuleSelectItem[]> => {
    const trpc = await createAuthenticatedTrpcClient()
    return await trpc.taxRules.listForSelect.query()
  })

/**
 * Create a new tax rule.
 * Revalidates tax rules list cache after creation.
 */
export const createTaxRuleAction = createServerAction()
  .input(CreateTaxRuleSchema)
  .handler(async ({ input }) => {
    const trpc = await createAuthenticatedTrpcClient()
    const taxRule = await trpc.taxRules.create.mutate(input)
    revalidatePath('/settings/tax-rules')
    return taxRule
  })

/**
 * Update an existing tax rule.
 * Supports partial updates - only provided fields are changed.
 * Revalidates tax rules list cache after update.
 */
export const updateTaxRuleAction = createServerAction()
  .input(UpdateTaxRuleSchema)
  .handler(async ({ input }) => {
    const trpc = await createAuthenticatedTrpcClient()
    const taxRule = await trpc.taxRules.update.mutate(input)
    revalidatePath('/settings/tax-rules')
    return taxRule
  })

/**
 * Delete a tax rule.
 * Will fail if tax rule is assigned to any variants.
 * Revalidates tax rules list cache after deletion.
 */
export const deleteTaxRuleAction = createServerAction()
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }): Promise<{ success: boolean }> => {
    const trpc = await createAuthenticatedTrpcClient()
    await trpc.taxRules.delete.mutate({ id: input.id })
    revalidatePath('/settings/tax-rules')
    return { success: true }
  })

/**
 * Set a tax rule as the default for the store.
 * Revalidates tax rules list cache after update.
 */
export const setDefaultTaxRuleAction = createServerAction()
  .input(SetDefaultTaxRuleSchema)
  .handler(async ({ input }) => {
    const trpc = await createAuthenticatedTrpcClient()
    const taxRule = await trpc.taxRules.setDefault.mutate(input)
    revalidatePath('/settings/tax-rules')
    return taxRule
  })
