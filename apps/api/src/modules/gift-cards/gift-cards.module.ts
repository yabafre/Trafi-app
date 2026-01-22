import { Module } from '@nestjs/common'
import { GiftCardsService } from './gift-cards.service'
import { GiftCardTemplateService } from './gift-card-template.service'

/**
 * Gift Cards module
 *
 * Provides gift card management functionality including:
 * - Gift card issuance, redemption, and balance management
 * - Gift card templates for pre-defined configurations
 * - Transaction history tracking
 *
 * @see Story 3.10 - Gift Cards
 */
@Module({
  providers: [GiftCardsService, GiftCardTemplateService],
  exports: [GiftCardsService, GiftCardTemplateService],
})
export class GiftCardsModule {}
