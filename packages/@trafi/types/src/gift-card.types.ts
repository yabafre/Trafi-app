/**
 * @trafi/types - Gift Card Domain Types
 *
 * Types for gift cards, templates, and transactions.
 * Re-exported from @trafi/validators Zod schemas.
 * @see Story 3.10 - Gift Cards
 */

// Import for local use in interfaces
import type {
  GiftCardErrorCode as GiftCardErrorCodeType,
  GiftCardStatus as GiftCardStatusType,
  GiftCardTransactionType as GiftCardTransactionTypeAlias,
} from '@trafi/validators'

export type {
  // Enums
  GiftCardStatus,
  GiftCardTransactionType,
  GiftCardErrorCode,
  // Input types
  IssueGiftCardInput,
  ValidateGiftCardInput,
  RedeemGiftCardInput,
  RefundToGiftCardInput,
  CreateGiftCardTemplateInput,
  UpdateGiftCardTemplateInput,
  AdjustGiftCardBalanceInput,
  DisableGiftCardInput,
  EnableGiftCardInput,
  ListGiftCardsInput,
  ListGiftCardTemplatesInput,
  // Response types
  GiftCard,
  GiftCardTransaction,
  GiftCardTemplate,
  GiftCardResponse,
  GiftCardTemplateResponse,
  IssueGiftCardResponse,
  ValidateGiftCardResponse,
  RedeemGiftCardResponse,
  RefundToGiftCardResponse,
  AdjustGiftCardBalanceResponse,
  ToggleGiftCardResponse,
} from '@trafi/validators'

// =============================================================================
// DTO Types (API Responses with Date objects)
// =============================================================================

/**
 * Gift card response from API (with Date objects)
 */
export interface GiftCardResponseDTO {
  id: string
  storeId: string
  codeLast4: string
  initialBalanceCents: number
  currentBalanceCents: number
  currencyCode: string
  status: GiftCardStatusType
  purchasedById: string | null
  recipientEmail: string | null
  recipientName: string | null
  senderName: string | null
  giftMessage: string | null
  expiresAt: Date | null
  activatedAt: Date | null
  lastUsedAt: Date | null
  issuedFromOrderId: string | null
  templateId: string | null
  metadata: Record<string, unknown> | null
  createdAt: Date
  updatedAt: Date
  // Computed fields
  transactionCount?: number
  templateName?: string
}

/**
 * Gift card transaction response from API
 */
export interface GiftCardTransactionDTO {
  id: string
  storeId: string
  giftCardId: string
  type: GiftCardTransactionTypeAlias
  amountCents: number
  balanceAfterCents: number
  orderId: string | null
  reason: string | null
  performedById: string | null
  performedByName?: string
  createdAt: Date
}

/**
 * Gift card template response from API
 */
export interface GiftCardTemplateDTO {
  id: string
  storeId: string
  name: string
  description: string | null
  designImageUrl: string | null
  denominations: number[]
  allowCustomAmount: boolean
  minAmountCents: number | null
  maxAmountCents: number | null
  validityDays: number | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  // Computed fields
  activeCardCount?: number
}

/**
 * Issued gift card result (includes plain code - show ONCE)
 */
export interface IssuedGiftCardDTO {
  id: string
  code: string // Plain code - display to user ONCE
  codeLast4: string
  initialBalanceCents: number
  currentBalanceCents: number
  currencyCode: string
  status: string
  expiresAt: Date | null
  createdAt: Date
}

// =============================================================================
// List Results
// =============================================================================

/**
 * Paginated gift cards list result
 */
export interface GiftCardListResult {
  items: GiftCardResponseDTO[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

/**
 * Paginated gift card templates list result
 */
export interface GiftCardTemplateListResult {
  items: GiftCardTemplateDTO[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

/**
 * Paginated transactions list result
 */
export interface GiftCardTransactionListResult {
  items: GiftCardTransactionDTO[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// =============================================================================
// Redeem/Validate Results
// =============================================================================

/**
 * Redeem result for checkout integration
 */
export interface RedeemResultDTO {
  success: boolean
  transactionId?: string
  amountDebitedCents?: number
  remainingBalanceCents?: number
  error?: string
  errorCode?: GiftCardErrorCodeType
}

/**
 * Validate result for balance check
 */
export interface ValidateResultDTO {
  valid: boolean
  codeLast4?: string
  currentBalanceCents?: number
  currencyCode?: string
  expiresAt?: Date | null
  error?: string
}

// =============================================================================
// Event Payloads
// =============================================================================

/**
 * Gift card issued event payload
 */
export interface GiftCardIssuedEvent {
  giftCardId: string
  storeId: string
  codeLast4: string
  amountCents: number
  currencyCode: string
  templateId: string | null
  recipientEmail: string | null
}

/**
 * Gift card redeemed event payload
 */
export interface GiftCardRedeemedEvent {
  giftCardId: string
  storeId: string
  transactionId: string
  orderId: string
  amountCents: number
  remainingBalanceCents: number
}

/**
 * Gift card refunded event payload
 */
export interface GiftCardRefundedEvent {
  giftCardId: string
  storeId: string
  transactionId: string
  orderId: string
  amountCents: number
  newBalanceCents: number
}

/**
 * Gift card status changed event payload
 */
export interface GiftCardStatusChangedEvent {
  giftCardId: string
  storeId: string
  previousStatus: string
  newStatus: string
  reason: string | null
}

/**
 * Gift card depleted event payload
 */
export interface GiftCardDepletedEvent {
  giftCardId: string
  storeId: string
  totalUsedCents: number
}

/**
 * Gift card expired event payload
 */
export interface GiftCardExpiredEvent {
  giftCardId: string
  storeId: string
  remainingBalanceCents: number
  expiresAt: Date
}

// =============================================================================
// UI Types
// =============================================================================

/**
 * Gift card for select dropdown (minimal data)
 */
export interface GiftCardSelectItem {
  id: string
  codeLast4: string
  currentBalanceCents: number
  currencyCode: string
  status: string
}

/**
 * Gift card template for select dropdown
 */
export interface GiftCardTemplateSelectItem {
  id: string
  name: string
  denominations: number[]
  allowCustomAmount: boolean
  validityDays: number | null
  isActive: boolean
}

/**
 * Balance summary for dashboard display
 */
export interface GiftCardBalanceSummary {
  totalIssuedCents: number
  totalRedeemedCents: number
  totalOutstandingCents: number
  totalExpiredCents: number
  activeCardCount: number
  currencyCode: string
}
