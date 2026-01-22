import { z } from '@trafi/zod'

/**
 * Gift Card Template Schemas
 * @see Story 3.10 - Gift Cards (AC1, AC6)
 */

/**
 * Schema for creating a new gift card template
 */
export const CreateGiftCardTemplateSchema = z
  .object({
    // Template name (required)
    name: z.string().min(1).max(100).describe('Template name'),

    // Description (optional)
    description: z.string().max(500).optional().describe('Template description'),

    // Design image URL (optional)
    designImageUrl: z.string().url().optional().describe('URL to template design image'),

    // Pre-defined denominations in cents (required, at least one)
    denominations: z
      .array(z.number().int().positive())
      .min(1)
      .max(20)
      .refine(
        (arr) => new Set(arr).size === arr.length,
        { message: 'Denominations must be unique' }
      )
      .describe('Available amounts in cents (e.g., [2500, 5000, 10000])'),

    // Allow custom amounts
    allowCustomAmount: z.boolean().default(false).describe('Allow custom amount input'),

    // Min/max for custom amounts (required if allowCustomAmount is true)
    minAmountCents: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('Minimum custom amount in cents'),
    maxAmountCents: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('Maximum custom amount in cents'),

    // Validity period
    validityDays: z
      .number()
      .int()
      .positive()
      .max(3650) // Max 10 years
      .optional()
      .describe('Days until expiration (null = never)'),

    // Active status
    isActive: z.boolean().default(true).describe('Whether template is available'),
  })
  .refine(
    (data) => {
      // If allowCustomAmount is true, min and max must be provided
      if (data.allowCustomAmount) {
        return data.minAmountCents !== undefined && data.maxAmountCents !== undefined
      }
      return true
    },
    {
      message: 'minAmountCents and maxAmountCents are required when allowCustomAmount is true',
      path: ['minAmountCents'],
    }
  )
  .refine(
    (data) => {
      // max must be >= min if both provided
      if (data.minAmountCents !== undefined && data.maxAmountCents !== undefined) {
        return data.maxAmountCents >= data.minAmountCents
      }
      return true
    },
    {
      message: 'maxAmountCents must be greater than or equal to minAmountCents',
      path: ['maxAmountCents'],
    }
  )

export type CreateGiftCardTemplateInput = z.infer<typeof CreateGiftCardTemplateSchema>

/**
 * Schema for updating a gift card template
 */
export const UpdateGiftCardTemplateSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).nullish(),
    designImageUrl: z.string().url().nullish(),
    denominations: z
      .array(z.number().int().positive())
      .min(1)
      .max(20)
      .refine(
        (arr) => new Set(arr).size === arr.length,
        { message: 'Denominations must be unique' }
      )
      .optional(),
    allowCustomAmount: z.boolean().optional(),
    minAmountCents: z.number().int().positive().nullish(),
    maxAmountCents: z.number().int().positive().nullish(),
    validityDays: z.number().int().positive().max(3650).nullish(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // max must be >= min if both provided
      if (data.minAmountCents !== undefined && data.maxAmountCents !== undefined) {
        if (data.minAmountCents !== null && data.maxAmountCents !== null) {
          return data.maxAmountCents >= data.minAmountCents
        }
      }
      return true
    },
    {
      message: 'maxAmountCents must be greater than or equal to minAmountCents',
      path: ['maxAmountCents'],
    }
  )

export type UpdateGiftCardTemplateInput = z.infer<typeof UpdateGiftCardTemplateSchema>
