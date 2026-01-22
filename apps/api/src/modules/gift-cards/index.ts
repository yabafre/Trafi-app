/**
 * Gift Cards module public exports
 *
 * @module @trafi/api/modules/gift-cards
 * @see Story 3.10 - Gift Cards
 * @see RETRO-3 - Public exports for @trafi/core extensibility
 */

export { GiftCardsModule } from './gift-cards.module'
export { GiftCardsService } from './gift-cards.service'
export { GiftCardTemplateService } from './gift-card-template.service'

// Re-export types for consumers
export type {
  GiftCardResponseDto,
  IssuedGiftCardDto,
  RedeemResultDto,
  ValidateResultDto,
  GiftCardsListResult,
  GiftCardTransactionDto,
  ListGiftCardsOptions,
} from './gift-cards.service'

export type {
  GiftCardTemplateDto,
  TemplatesListResult,
  ListGiftCardTemplatesOptions,
} from './gift-card-template.service'
