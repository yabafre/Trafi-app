import { z } from '@trafi/zod'
import { IdSchema, TimestampsSchema, TenantScopedSchema, PaginationSchema } from '../common'

/**
 * Gift Card Schemas
 * @see Story 3.10 - Gift Cards
 * @see apps/api/prisma/schema/gift-card.prisma
 */

// =============================================================================
// Enums (match Prisma enums)
// =============================================================================

/**
 * Gift card status enum matching Prisma GiftCardStatus
 */
export const GiftCardStatusSchema = z.enum([
  'PENDING', // Purchased/issued but not yet activated
  'ACTIVE', // Ready to use
  'DISABLED', // Manually disabled by admin
  'EXPIRED', // Past expiration date
  'DEPLETED', // Zero balance remaining
])
export type GiftCardStatus = z.infer<typeof GiftCardStatusSchema>

/**
 * Gift card transaction type enum matching Prisma GiftCardTransactionType
 */
export const GiftCardTransactionTypeSchema = z.enum([
  'CREDIT', // Initial load or top-up
  'DEBIT', // Used for purchase
  'REFUND', // Returned to balance
  'ADJUSTMENT', // Admin manual change
  'EXPIRATION', // Balance expired (system)
])
export type GiftCardTransactionType = z.infer<typeof GiftCardTransactionTypeSchema>

/**
 * Gift card redemption error codes
 * Centralized for use in both validators and service layer
 */
export const GiftCardErrorCodeSchema = z.enum([
  'INVALID_CODE', // Code not found or hash mismatch
  'CARD_DISABLED', // Card manually disabled by admin
  'CARD_EXPIRED', // Card past expiration date
  'INSUFFICIENT_BALANCE', // Not enough balance for requested amount
  'ALREADY_DEPLETED', // Card has zero balance
  'CURRENCY_MISMATCH', // Card currency doesn't match order currency
])
export type GiftCardErrorCode = z.infer<typeof GiftCardErrorCodeSchema>

// =============================================================================
// Base Gift Card Schema
// =============================================================================

/**
 * Base gift card schema with all fields
 * Money stored as INTEGER cents (ARCH-25)
 * Security: code is hashed, only codeLast4 is displayed
 */
export const GiftCardSchema = TenantScopedSchema.extend({
  id: IdSchema,
  codeHash: z.string().describe('SHA-256 hash of the code (never expose)'),
  codeLast4: z.string().length(4).describe('Last 4 characters of code for display'),
  initialBalanceCents: z.number().int().nonnegative().describe('Initial balance in cents'),
  currentBalanceCents: z.number().int().nonnegative().describe('Current balance in cents'),
  currencyCode: z.string().length(3).default('EUR').describe('ISO 4217 currency code'),
  status: GiftCardStatusSchema.default('PENDING'),
  purchasedById: z.string().cuid().nullish().describe('Customer ID who purchased'),
  recipientEmail: z.string().email().max(255).nullish().describe('Recipient email for delivery'),
  recipientName: z.string().max(100).nullish().describe('Recipient name'),
  senderName: z.string().max(100).nullish().describe('Sender name for gift message'),
  giftMessage: z.string().max(500).nullish().describe('Gift message'),
  expiresAt: z.date().nullish().describe('Expiration date (null = never expires)'),
  activatedAt: z.date().nullish().describe('When the card was first activated'),
  lastUsedAt: z.date().nullish().describe('Last usage timestamp'),
  issuedFromOrderId: z.string().cuid().nullish().describe('Order ID if purchased via storefront'),
  templateId: z.string().cuid().nullish().describe('Template used to create this card'),
  metadata: z.record(z.unknown()).nullish().describe('Custom metadata'),
}).merge(TimestampsSchema)

export type GiftCard = z.infer<typeof GiftCardSchema>

// =============================================================================
// Gift Card Transaction Schema
// =============================================================================

/**
 * Gift card transaction schema for balance history
 */
export const GiftCardTransactionSchema = TenantScopedSchema.extend({
  id: IdSchema,
  giftCardId: IdSchema,
  type: GiftCardTransactionTypeSchema,
  amountCents: z.number().int().describe('Positive for credit, negative for debit'),
  balanceAfterCents: z.number().int().nonnegative().describe('Balance after this transaction'),
  orderId: z.string().cuid().nullish().describe('Associated order ID'),
  reason: z.string().max(255).nullish().describe('Reason for adjustment'),
  performedById: z.string().cuid().nullish().describe('User who performed the action'),
  createdAt: z.date(),
})

export type GiftCardTransaction = z.infer<typeof GiftCardTransactionSchema>

// =============================================================================
// Gift Card Template Schema
// =============================================================================

/**
 * Gift card template schema for pre-defined configurations
 */
export const GiftCardTemplateSchema = TenantScopedSchema.extend({
  id: IdSchema,
  name: z.string().min(1).max(100).describe('Template name'),
  description: z.string().max(500).nullish().describe('Template description'),
  designImageUrl: z.string().url().nullish().describe('URL to template design image'),
  denominations: z.array(z.number().int().positive()).min(1).describe('Available amounts in cents'),
  allowCustomAmount: z.boolean().default(false).describe('Allow custom amount input'),
  minAmountCents: z.number().int().positive().nullish().describe('Minimum custom amount'),
  maxAmountCents: z.number().int().positive().nullish().describe('Maximum custom amount'),
  validityDays: z.number().int().positive().nullish().describe('Days until expiration (null = never)'),
  isActive: z.boolean().default(true).describe('Whether template is available'),
}).merge(TimestampsSchema)

export type GiftCardTemplate = z.infer<typeof GiftCardTemplateSchema>

// =============================================================================
// List Schemas
// =============================================================================

/**
 * List gift cards query schema with pagination and filtering
 */
export const ListGiftCardsSchema = PaginationSchema.extend({
  status: GiftCardStatusSchema.optional().describe('Filter by gift card status'),
  templateId: z.string().cuid().optional().describe('Filter by template'),
  search: z.string().max(50).optional().describe('Search by last4 of code'),
  fromDate: z.date().optional().describe('Filter by creation date from'),
  toDate: z.date().optional().describe('Filter by creation date to'),
  hasBalance: z.boolean().optional().describe('Filter cards with remaining balance'),
})

export type ListGiftCardsInput = z.infer<typeof ListGiftCardsSchema>

/**
 * List gift card templates query schema
 */
export const ListGiftCardTemplatesSchema = PaginationSchema.extend({
  isActive: z.boolean().optional().describe('Filter by active status'),
  search: z.string().max(100).optional().describe('Search in name, description'),
})

export type ListGiftCardTemplatesInput = z.infer<typeof ListGiftCardTemplatesSchema>

// =============================================================================
// Response Schemas
// =============================================================================

/**
 * Gift card response schema (API response - without sensitive data)
 */
export const GiftCardResponseSchema = GiftCardSchema.omit({ codeHash: true }).extend({
  // Include transaction count for list views
  transactionCount: z.number().int().nonnegative().optional(),
  // Include template name for display
  templateName: z.string().optional(),
})

export type GiftCardResponse = z.infer<typeof GiftCardResponseSchema>

/**
 * Gift card template response schema
 */
export const GiftCardTemplateResponseSchema = GiftCardTemplateSchema.extend({
  // Include count of active gift cards
  activeCardCount: z.number().int().nonnegative().optional(),
})

export type GiftCardTemplateResponse = z.infer<typeof GiftCardTemplateResponseSchema>
