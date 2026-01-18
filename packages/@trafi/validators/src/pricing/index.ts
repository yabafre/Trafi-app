import { z } from '@trafi/zod'

/**
 * Pricing Schemas
 * @see Story 3.6 - Product Pricing and Tax Rules
 */

// =============================================================================
// Tax Rule Schemas
// =============================================================================

/**
 * Tax rule rate - stored as decimal (e.g., 20 for 20%)
 */
export const TaxRateSchema = z.number().min(0).max(100)

/**
 * ISO 3166-1 alpha-2 country code
 */
export const CountryCodeSchema = z.string().length(2).toUpperCase()

/**
 * Tax rule response schema
 */
export const TaxRuleSchema = z.object({
  id: z.string(),
  storeId: z.string(),
  name: z.string().min(1).max(100),
  rate: TaxRateSchema,
  countryIso2: CountryCodeSchema,
  isDefault: z.boolean(),
  appliesToShipping: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type TaxRule = z.infer<typeof TaxRuleSchema>

/**
 * Create tax rule input
 */
export const CreateTaxRuleSchema = z.object({
  name: z.string().min(1).max(100),
  rate: TaxRateSchema,
  countryIso2: CountryCodeSchema,
  isDefault: z.boolean().default(false),
  appliesToShipping: z.boolean().default(false),
})

export type CreateTaxRuleInput = z.infer<typeof CreateTaxRuleSchema>

/**
 * Update tax rule input
 */
export const UpdateTaxRuleSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100).optional(),
  rate: TaxRateSchema.optional(),
  countryIso2: CountryCodeSchema.optional(),
  isDefault: z.boolean().optional(),
  appliesToShipping: z.boolean().optional(),
})

export type UpdateTaxRuleInput = z.infer<typeof UpdateTaxRuleSchema>

/**
 * List tax rules query
 */
export const ListTaxRulesSchema = z.object({
  countryIso2: CountryCodeSchema.optional(),
  isDefault: z.boolean().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(50),
})

export type ListTaxRulesInput = z.infer<typeof ListTaxRulesSchema>

/**
 * Set default tax rule input
 */
export const SetDefaultTaxRuleSchema = z.object({
  id: z.string(),
})

export type SetDefaultTaxRuleInput = z.infer<typeof SetDefaultTaxRuleSchema>

// =============================================================================
// Pricing Calculation Schemas
// =============================================================================

/**
 * Pricing fields for a product variant
 */
export const VariantPricingSchema = z.object({
  priceInCents: z.number().int().positive(),
  compareAtPriceInCents: z.number().int().positive().optional().nullable(),
  costPriceInCents: z.number().int().nonnegative().optional().nullable(),
  taxRuleId: z.string().optional().nullable(),
})

export type VariantPricing = z.infer<typeof VariantPricingSchema>

/**
 * Update variant pricing input
 */
export const UpdateVariantPricingSchema = z.object({
  variantId: z.string(),
  priceInCents: z.number().int().positive().optional(),
  compareAtPriceInCents: z.number().int().positive().optional().nullable(),
  costPriceInCents: z.number().int().nonnegative().optional().nullable(),
  taxRuleId: z.string().optional().nullable(),
})

export type UpdateVariantPricingInput = z.infer<typeof UpdateVariantPricingSchema>

/**
 * Tax calculation result
 */
export const TaxCalculationSchema = z.object({
  netPriceInCents: z.number().int(),
  taxAmountInCents: z.number().int(),
  grossPriceInCents: z.number().int(),
  taxRate: TaxRateSchema,
  taxIncluded: z.boolean(),
})

export type TaxCalculation = z.infer<typeof TaxCalculationSchema>

/**
 * Margin calculation result
 */
export const MarginCalculationSchema = z.object({
  marginInCents: z.number().int(),
  marginPercent: z.number(),
})

export type MarginCalculation = z.infer<typeof MarginCalculationSchema>

/**
 * Calculate tax input
 */
export const CalculateTaxSchema = z.object({
  priceInCents: z.number().int().positive(),
  taxRate: TaxRateSchema,
  taxIncluded: z.boolean(),
})

export type CalculateTaxInput = z.infer<typeof CalculateTaxSchema>

/**
 * Calculate margin input
 */
export const CalculateMarginSchema = z.object({
  priceInCents: z.number().int().positive(),
  costPriceInCents: z.number().int().nonnegative(),
})

export type CalculateMarginInput = z.infer<typeof CalculateMarginSchema>

/**
 * Format price input
 */
export const FormatPriceSchema = z.object({
  cents: z.number().int(),
  currency: z.string().default('EUR'),
  locale: z.string().default('fr-FR'),
})

export type FormatPriceInput = z.infer<typeof FormatPriceSchema>
