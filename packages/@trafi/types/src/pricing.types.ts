/**
 * @trafi/types - Pricing Domain Types
 *
 * Types for tax rules and pricing calculations.
 * Re-exported from @trafi/validators Zod schemas.
 * @see Story 3.6 - Product Pricing and Tax Rules
 */

export type {
  // Tax Rule types
  TaxRule,
  CreateTaxRuleInput,
  UpdateTaxRuleInput,
  ListTaxRulesInput,
  SetDefaultTaxRuleInput,
  // Variant Pricing types
  VariantPricing,
  UpdateVariantPricingInput,
  // Calculation types
  TaxCalculation,
  MarginCalculation,
  CalculateTaxInput,
  CalculateMarginInput,
  FormatPriceInput,
} from '@trafi/validators';

/**
 * Tax rule response from API (with Date objects instead of strings)
 */
export interface TaxRuleResponse {
  id: string;
  storeId: string;
  name: string;
  rate: number;
  countryIso2: string;
  isDefault: boolean;
  appliesToShipping: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Paginated tax rules list result
 */
export interface TaxRulesListResult {
  items: TaxRuleResponse[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Tax rule for select dropdown (minimal data)
 */
export interface TaxRuleSelectItem {
  id: string;
  name: string;
  rate: number;
  isDefault: boolean;
}
