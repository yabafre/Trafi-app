import { Module } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { TaxRulesService } from './tax-rules.service';

/**
 * Pricing module
 *
 * Provides tax calculation, pricing utilities, and tax rule management.
 * Tax rules are tenant-scoped via storeId.
 *
 * @see Story 3.6 - Product Pricing and Tax Rules
 */
@Module({
  providers: [PricingService, TaxRulesService],
  exports: [PricingService, TaxRulesService],
})
export class PricingModule {}
