/**
 * Gift Card validation schemas
 *
 * @module @trafi/validators/gift-card
 * @see Story 3.10 - Gift Cards
 */

export * from './gift-card.schema'
export * from './issue-gift-card.schema'
export * from './redeem-gift-card.schema'
export * from './gift-card-template.schema'
export * from './adjust-balance.schema'

// Re-export commonly used types for convenience
export type {
  GiftCard,
  GiftCardStatus,
  GiftCardTransaction,
  GiftCardTransactionType,
  GiftCardTemplate,
  GiftCardErrorCode,
  ListGiftCardsInput,
  ListGiftCardTemplatesInput,
  ListGiftCardTransactionsInput,
  GiftCardResponse,
  GiftCardTemplateResponse,
} from './gift-card.schema'

export type { IssueGiftCardInput, IssueGiftCardResponse } from './issue-gift-card.schema'

export type {
  ValidateGiftCardInput,
  ValidateGiftCardResponse,
  RedeemGiftCardInput,
  RedeemGiftCardResponse,
  RefundToGiftCardInput,
  RefundToGiftCardResponse,
} from './redeem-gift-card.schema'

export type {
  CreateGiftCardTemplateInput,
  UpdateGiftCardTemplateInput,
  UpdateGiftCardTemplateWithIdInput,
} from './gift-card-template.schema'

export type {
  AdjustGiftCardBalanceInput,
  AdjustGiftCardBalanceResponse,
  DisableGiftCardInput,
  EnableGiftCardInput,
  ToggleGiftCardResponse,
} from './adjust-balance.schema'
