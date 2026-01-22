import { z } from '@trafi/zod'

/**
 * Adjust Gift Card Balance Schemas
 * @see Story 3.10 - Gift Cards (AC4, AC10)
 */

/**
 * Schema for admin manual balance adjustment
 */
export const AdjustGiftCardBalanceSchema = z.object({
  // Gift card ID
  giftCardId: z.string().cuid().describe('Gift card ID to adjust'),

  // Amount adjustment (positive to add, negative to subtract)
  amountCents: z
    .number()
    .int()
    .refine((val) => val !== 0, { message: 'Amount cannot be zero' })
    .describe('Amount to adjust (positive for credit, negative for debit)'),

  // Reason for adjustment (required for audit)
  reason: z.string().min(3).max(255).describe('Reason for manual adjustment'),
})

export type AdjustGiftCardBalanceInput = z.infer<typeof AdjustGiftCardBalanceSchema>

/**
 * Response for balance adjustment
 */
export const AdjustGiftCardBalanceResponseSchema = z.object({
  success: z.boolean(),
  transactionId: z.string().cuid().optional(),
  previousBalanceCents: z.number().int().nonnegative().optional(),
  newBalanceCents: z.number().int().nonnegative().optional(),
  error: z.string().optional(),
})

export type AdjustGiftCardBalanceResponse = z.infer<typeof AdjustGiftCardBalanceResponseSchema>

/**
 * Schema for disabling a gift card
 */
export const DisableGiftCardSchema = z.object({
  giftCardId: z.string().cuid().describe('Gift card ID to disable'),
  reason: z.string().min(3).max(255).describe('Reason for disabling'),
})

export type DisableGiftCardInput = z.infer<typeof DisableGiftCardSchema>

/**
 * Schema for enabling a gift card
 */
export const EnableGiftCardSchema = z.object({
  giftCardId: z.string().cuid().describe('Gift card ID to enable'),
})

export type EnableGiftCardInput = z.infer<typeof EnableGiftCardSchema>

/**
 * Response for enable/disable operations
 */
export const ToggleGiftCardResponseSchema = z.object({
  success: z.boolean(),
  newStatus: z.string().optional(),
  error: z.string().optional(),
})

export type ToggleGiftCardResponse = z.infer<typeof ToggleGiftCardResponseSchema>
