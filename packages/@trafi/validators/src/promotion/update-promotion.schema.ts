import { z } from '@trafi/zod'
import { PromotionTypeSchema, PromotionStatusSchema, PromotionConditionsSchema } from './promotion.schema'

/**
 * Update Promotion Input Schema
 * @see Story 3.9 - Promotions & Discounts Foundation
 */

/**
 * Base schema for updating an existing promotion (without refinements)
 * Use this for merging with other schemas in tRPC routers
 */
export const UpdatePromotionBaseSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less').optional(),
  description: z.string().max(500, 'Description must be 500 characters or less').nullish(),
  type: PromotionTypeSchema.optional(),
  discountValue: z.number().int('Discount value must be an integer').nonnegative().nullish(),
  conditions: PromotionConditionsSchema,
  maxDiscountCents: z.number().int('Max discount must be an integer').positive().nullish(),
  usageLimit: z.number().int().positive('Usage limit must be positive').nullish(),
  perCustomerLimit: z.number().int().positive('Per-customer limit must be positive').nullish(),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().nullish(),
  priority: z.number().int().optional(),
  stackable: z.boolean().optional(),
})

/**
 * Schema for updating an existing promotion (with refinements)
 * All fields optional - only update provided fields
 */
export const UpdatePromotionSchema = UpdatePromotionBaseSchema.refine(
  (data) => {
    // At least one field must be provided
    return Object.keys(data).length > 0
  },
  {
    message: 'At least one field must be provided for update',
  }
)

export type UpdatePromotionInput = z.infer<typeof UpdatePromotionSchema>

/**
 * Schema for updating promotion status
 * Separate from main update to enforce status transition rules
 */
export const UpdatePromotionStatusSchema = z.object({
  status: PromotionStatusSchema,
})

export type UpdatePromotionStatusInput = z.infer<typeof UpdatePromotionStatusSchema>
