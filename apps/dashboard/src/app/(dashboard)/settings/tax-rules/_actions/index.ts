/**
 * Tax Rules Actions - Server actions barrel export
 * @see Story 3.6 - Product Pricing and Tax Rules
 *
 * Note: Types are NOT re-exported from server actions files due to Next.js bundling issues.
 * Import types directly from '@trafi/types' in consuming components.
 */
export {
  getTaxRuleListAction,
  getTaxRuleAction,
  getDefaultTaxRuleAction,
  getTaxRulesForSelectAction,
  createTaxRuleAction,
  updateTaxRuleAction,
  deleteTaxRuleAction,
  setDefaultTaxRuleAction,
} from './tax-rule-actions'
