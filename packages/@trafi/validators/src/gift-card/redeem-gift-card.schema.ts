import { z } from '@trafi/zod'
import { GiftCardErrorCodeSchema } from './gift-card.schema'

/**
 * Redeem Gift Card Schemas
 * @see Story 3.10 - Gift Cards (AC4, AC5)
 */

/**
 * Schema for validating a gift card code (balance check)
 * Used by storefront to show available balance before checkout
 */
export const ValidateGiftCardSchema = z.object({
  code: z
    .string()
    .min(16)
    .max(19) // 16 chars with optional dashes
    .transform((val) => val.replace(/-/g, '').toUpperCase())
    .describe('Gift card code (with or without dashes)'),
})

export type ValidateGiftCardInput = z.infer<typeof ValidateGiftCardSchema>

/**
 * Response when validating a gift card code
 */
export const ValidateGiftCardResponseSchema = z.object({
  valid: z.boolean().describe('Whether the code is valid'),
  codeLast4: z.string().length(4).optional().describe('Last 4 digits for confirmation'),
  currentBalanceCents: z.number().int().nonnegative().optional().describe('Available balance'),
  currencyCode: z.string().length(3).optional().describe('Currency of the gift card'),
  expiresAt: z.date().nullable().optional().describe('Expiration date'),
  error: z.string().optional().describe('Error message if invalid'),
})

export type ValidateGiftCardResponse = z.infer<typeof ValidateGiftCardResponseSchema>

/**
 * Schema for redeeming (using) a gift card
 * Debits the gift card balance during checkout
 *
 * Code Review Fix #6: Added currencyCode for currency mismatch validation
 */
export const RedeemGiftCardSchema = z.object({
  // Code to redeem
  code: z
    .string()
    .min(16)
    .max(19)
    .transform((val) => val.replace(/-/g, '').toUpperCase())
    .describe('Gift card code'),

  // Amount to debit in cents
  amountCents: z.number().int().positive().describe('Amount to use in cents'),

  // Order ID for tracking
  orderId: z.string().cuid().describe('Order ID this redemption is for'),

  // Currency code for validation (Code Review Fix #6)
  currencyCode: z.string().length(3).default('EUR').describe('Currency code of the order'),
})

export type RedeemGiftCardInput = z.infer<typeof RedeemGiftCardSchema>

/**
 * Result of a gift card redemption
 */
export const RedeemGiftCardResponseSchema = z.object({
  success: z.boolean(),
  transactionId: z.string().cuid().optional().describe('Transaction ID for the debit'),
  amountDebitedCents: z.number().int().nonnegative().optional().describe('Amount actually debited'),
  remainingBalanceCents: z.number().int().nonnegative().optional().describe('Balance after debit'),
  error: z.string().optional().describe('Error message if failed'),
  errorCode: GiftCardErrorCodeSchema.optional().describe('Error code for programmatic handling'),
})

export type RedeemGiftCardResponse = z.infer<typeof RedeemGiftCardResponseSchema>

/**
 * Schema for refunding to a gift card
 * Credits the gift card balance during order refund
 */
export const RefundToGiftCardSchema = z.object({
  // Gift card ID to credit
  giftCardId: z.string().cuid().describe('Gift card ID to refund to'),

  // Amount to credit in cents
  amountCents: z.number().int().positive().describe('Amount to refund in cents'),

  // Order ID for tracking
  orderId: z.string().cuid().describe('Order ID this refund is from'),

  // Reason for refund
  reason: z.string().max(255).optional().describe('Reason for refund'),
})

export type RefundToGiftCardInput = z.infer<typeof RefundToGiftCardSchema>

/**
 * Result of a gift card refund
 */
export const RefundToGiftCardResponseSchema = z.object({
  success: z.boolean(),
  transactionId: z.string().cuid().optional(),
  newBalanceCents: z.number().int().nonnegative().optional(),
  error: z.string().optional(),
})

export type RefundToGiftCardResponse = z.infer<typeof RefundToGiftCardResponseSchema>
