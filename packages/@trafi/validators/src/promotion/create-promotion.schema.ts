import { z } from '@trafi/zod'
import { PromotionTypeSchema, PromotionConditionsSchema } from './promotion.schema'

/**
 * Create Promotion Input Schema
 * @see Story 3.9 - Promotions & Discounts Foundation
 */

/**
 * Schema for creating a new promotion
 * Validates discount values based on type
 */
export const CreatePromotionSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
    description: z.string().max(500, 'Description must be 500 characters or less').optional(),
    type: PromotionTypeSchema,
    discountValue: z
      .number()
      .int('Discount value must be an integer')
      .nonnegative('Discount value must be non-negative')
      .optional(),
    conditions: PromotionConditionsSchema,
    maxDiscountCents: z
      .number()
      .int('Max discount must be an integer')
      .positive('Max discount must be positive')
      .optional(),
    usageLimit: z.number().int().positive('Usage limit must be positive').optional(),
    perCustomerLimit: z.number().int().positive('Per-customer limit must be positive').optional(),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date().optional(),
    priority: z.number().int().default(0),
    stackable: z.boolean().default(false),
  })
  .refine(
    (data) => {
      // Validate discountValue based on type
      if (data.type === 'PERCENT') {
        if (data.discountValue === undefined || data.discountValue === null) {
          return false
        }
        // PERCENT must be 1-100
        return data.discountValue >= 1 && data.discountValue <= 100
      }
      if (data.type === 'FIXED') {
        // FIXED must have positive value in cents
        return data.discountValue !== undefined && data.discountValue !== null && data.discountValue > 0
      }
      if (data.type === 'FREE_SHIPPING') {
        // FREE_SHIPPING doesn't need discountValue
        return true
      }
      if (data.type === 'BUY_X_GET_Y') {
        // BUY_X_GET_Y requires buyQuantity and getQuantity in conditions
        return (
          data.conditions?.buyQuantity !== undefined &&
          data.conditions?.getQuantity !== undefined &&
          data.conditions.buyQuantity > 0 &&
          data.conditions.getQuantity > 0
        )
      }
      return true
    },
    {
      message: 'Invalid discount configuration for the selected promotion type',
      path: ['discountValue'],
    }
  )
  .refine(
    (data) => {
      // endsAt must be after startsAt if provided
      if (data.endsAt && data.startsAt) {
        return data.endsAt > data.startsAt
      }
      return true
    },
    {
      message: 'End date must be after start date',
      path: ['endsAt'],
    }
  )

export type CreatePromotionInput = z.infer<typeof CreatePromotionSchema>
