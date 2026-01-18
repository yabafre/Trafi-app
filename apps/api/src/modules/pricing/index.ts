/**
 * Pricing module exports
 *
 * @see Story 3.6 - Product Pricing and Tax Rules
 */

// Module
export { PricingModule } from './pricing.module';

// Services
export { PricingService } from './pricing.service';
export { TaxRulesService } from './tax-rules.service';

// Types
export type {
  TaxRuleResponseDto,
  TaxRulesListResult,
  ListTaxRulesOptions,
  CreateTaxRuleOptions,
  UpdateTaxRuleOptions,
} from './tax-rules.service';
