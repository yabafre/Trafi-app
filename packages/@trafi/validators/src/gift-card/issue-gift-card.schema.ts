import { z } from '@trafi/zod'

/**
 * Issue Gift Card Schemas
 * @see Story 3.10 - Gift Cards (AC2, AC3, AC6)
 */

/**
 * Schema for issuing a new gift card
 * Admin manually issues a gift card with specified amount
 */
export const IssueGiftCardSchema = z.object({
  // Amount in cents (required)
  amountCents: z
    .number()
    .int()
    .positive()
    .max(100000000) // Max 1,000,000.00
    .describe('Gift card amount in cents'),

  // Currency code (defaults to EUR)
  currencyCode: z
    .string()
    .length(3)
    .toUpperCase()
    .default('EUR')
    .describe('ISO 4217 currency code'),

  // Template to use (optional - defines validity, design)
  templateId: z.string().cuid().optional().describe('Template for validity and design'),

  // Recipient details (optional - for gift delivery)
  recipientEmail: z
    .string()
    .email()
    .max(255)
    .optional()
    .describe('Recipient email for gift card delivery'),
  recipientName: z.string().max(100).optional().describe('Recipient name'),
  senderName: z.string().max(100).optional().describe('Sender name for gift message'),
  giftMessage: z.string().max(500).optional().describe('Gift message to include'),

  // Expiration (optional - overrides template if provided)
  expiresAt: z.date().optional().describe('Custom expiration date'),

  // Auto-activate on creation
  activateImmediately: z.boolean().default(true).describe('Activate immediately after creation'),

  // Custom metadata
  metadata: z.record(z.unknown()).optional().describe('Custom metadata'),
})

export type IssueGiftCardInput = z.infer<typeof IssueGiftCardSchema>

/**
 * Response when a gift card is issued
 * IMPORTANT: This is the ONLY time the plain code is returned
 */
export const IssueGiftCardResponseSchema = z.object({
  id: z.string().cuid(),
  code: z.string().describe('Plain gift card code - show to user ONCE'),
  codeLast4: z.string().length(4),
  initialBalanceCents: z.number().int().nonnegative(),
  currentBalanceCents: z.number().int().nonnegative(),
  currencyCode: z.string().length(3),
  status: z.string(),
  expiresAt: z.date().nullable(),
  createdAt: z.date(),
})

export type IssueGiftCardResponse = z.infer<typeof IssueGiftCardResponseSchema>
