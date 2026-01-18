'use server'

import { revalidatePath } from 'next/cache'
import { createServerAction } from 'zsa'
import { createAuthenticatedTrpcClient } from '@/lib/trpc'
import {
  UpdateVariantPricingSchema,
  CalculateTaxSchema,
  CalculateMarginSchema,
  FormatPriceSchema,
} from '@trafi/validators'
import type { VariantResponse, TaxCalculation, MarginCalculation } from '@trafi/types'

/**
 * Update only the pricing fields of a variant.
 * Revalidates product and variants cache after update.
 *
 * @see Story 3.6 - Product Pricing and Tax Rules
 */
export const updateVariantPricingAction = createServerAction()
  .input(UpdateVariantPricingSchema)
  .handler(async ({ input }): Promise<VariantResponse> => {
    const trpc = await createAuthenticatedTrpcClient()
    const variant = await trpc.variants.updatePricing.mutate(input)
    revalidatePath('/products')
    revalidatePath(`/products/${variant.productId}`)
    return variant
  })

/**
 * Calculate tax from a price.
 * Pure calculation, no side effects.
 */
export const calculateTaxAction = createServerAction()
  .input(CalculateTaxSchema)
  .handler(async ({ input }): Promise<TaxCalculation> => {
    const trpc = await createAuthenticatedTrpcClient()
    return await trpc.pricing.calculateTax.query(input)
  })

/**
 * Calculate profit margin.
 * Returns null if cost price is 0 or missing.
 */
export const calculateMarginAction = createServerAction()
  .input(CalculateMarginSchema)
  .handler(async ({ input }): Promise<MarginCalculation | null> => {
    const trpc = await createAuthenticatedTrpcClient()
    return await trpc.pricing.calculateMargin.query(input)
  })

/**
 * Format price as localized currency string.
 */
export const formatPriceAction = createServerAction()
  .input(FormatPriceSchema)
  .handler(async ({ input }): Promise<{ formatted: string }> => {
    const trpc = await createAuthenticatedTrpcClient()
    return await trpc.pricing.formatPrice.query(input)
  })
