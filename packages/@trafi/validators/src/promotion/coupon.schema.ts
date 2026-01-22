import { z } from '@trafi/zod'
import { IdSchema, TimestampsSchema, TenantScopedSchema, PaginationSchema } from '../common'

/**
 * Coupon Schemas
 * @see Story 3.9 - Promotions & Discounts Foundation
 * @see apps/api/prisma/schema/promotion.prisma
 */

// =============================================================================
// Base Coupon Schema
// =============================================================================

/**
 * Base coupon schema with all fields
 */
export const CouponSchema = TenantScopedSchema.extend({
  id: IdSchema,
  promotionId: IdSchema,
  code: z.string().min(1).max(50).describe('Coupon code (case-insensitive)'),
  usageLimit: z.number().int().positive().nullish().describe('Usage limit (null = unlimited)'),
  usageCount: z.number().int().nonnegative().default(0),
  expiresAt: z.date().nullish().describe('Expiration date (null = no expiration)'),
  isActive: z.boolean().default(true),
  metadata: z.record(z.unknown()).nullish().describe('Custom metadata (campaign source, affiliate, etc.)'),
}).merge(TimestampsSchema)

export type Coupon = z.infer<typeof CouponSchema>

// =============================================================================
// Create Coupon Schema
// =============================================================================

/**
 * Schema for creating a single coupon
 */
export const CreateCouponSchema = z.object({
  promotionId: IdSchema,
  code: z
    .string()
    .min(3, 'Code must be at least 3 characters')
    .max(50, 'Code must be 50 characters or less')
    .regex(/^[A-Za-z0-9_-]+$/, 'Code can only contain letters, numbers, underscores, and hyphens'),
  usageLimit: z.number().int().positive('Usage limit must be positive').optional(),
  expiresAt: z.coerce.date().optional(),
  metadata: z.record(z.unknown()).optional(),
})

export type CreateCouponInput = z.infer<typeof CreateCouponSchema>

// =============================================================================
// Generate Coupons Schema
// =============================================================================

/**
 * Schema for bulk generating coupons
 * Generates unique codes with optional prefix/suffix
 */
export const GenerateCouponsSchema = z
  .object({
    promotionId: IdSchema,
    count: z
      .number()
      .int()
      .positive('Count must be positive')
      .max(1000, 'Cannot generate more than 1000 coupons at once'),
    prefix: z.string().max(10, 'Prefix must be 10 characters or less').optional(),
    suffix: z.string().max(10, 'Suffix must be 10 characters or less').optional(),
    codeLength: z.number().int().min(4).max(20).default(8).describe('Length of random part'),
    usageLimit: z.number().int().positive('Usage limit must be positive').optional(),
    expiresAt: z.coerce.date().optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .refine(
    (data) => {
      // Total code length (prefix + random + suffix) must not exceed 50
      const prefixLen = data.prefix?.length ?? 0
      const suffixLen = data.suffix?.length ?? 0
      return prefixLen + data.codeLength + suffixLen <= 50
    },
    {
      message: 'Total code length (prefix + code + suffix) must not exceed 50 characters',
      path: ['codeLength'],
    }
  )

export type GenerateCouponsInput = z.infer<typeof GenerateCouponsSchema>

// =============================================================================
// List Coupons Schema
// =============================================================================

/**
 * List coupons query schema with pagination and filtering
 */
export const ListCouponsSchema = PaginationSchema.extend({
  promotionId: IdSchema.optional().describe('Filter by promotion'),
  isActive: z.boolean().optional().describe('Filter by active status'),
  search: z.string().max(50).optional().describe('Search by code'),
  includeExpired: z.boolean().optional().default(false).describe('Include expired coupons'),
})

export type ListCouponsInput = z.infer<typeof ListCouponsSchema>

// =============================================================================
// Coupon Validation Schema
// =============================================================================

/**
 * Schema for validating a coupon code
 * Used at checkout to verify coupon is valid
 */
export const ValidateCouponSchema = z.object({
  code: z.string().min(1, 'Coupon code is required').max(50),
  orderTotalCents: z.number().int().nonnegative().optional().describe('Order total for condition checking'),
  customerId: z.string().optional().describe('Customer ID for per-customer limit checking'),
})

export type ValidateCouponInput = z.infer<typeof ValidateCouponSchema>

/**
 * Coupon validation result
 */
export const CouponValidationResultSchema = z.object({
  valid: z.boolean(),
  coupon: CouponSchema.optional(),
  promotion: z
    .object({
      id: IdSchema,
      name: z.string(),
      type: z.string(),
      discountValue: z.number().nullish(),
      maxDiscountCents: z.number().nullish(),
    })
    .optional(),
  errorCode: z
    .enum([
      'NOT_FOUND',
      'INACTIVE',
      'EXPIRED',
      'USAGE_LIMIT_REACHED',
      'CUSTOMER_LIMIT_REACHED',
      'PROMOTION_INACTIVE',
      'MIN_ORDER_NOT_MET',
      'NOT_STARTED',
    ])
    .optional(),
  errorMessage: z.string().optional(),
})

export type CouponValidationResult = z.infer<typeof CouponValidationResultSchema>

// =============================================================================
// Update Coupon Schema
// =============================================================================

/**
 * Schema for updating an existing coupon
 */
export const UpdateCouponSchema = z.object({
  isActive: z.boolean().optional(),
  usageLimit: z.number().int().positive().nullish(),
  expiresAt: z.coerce.date().nullish(),
  metadata: z.record(z.unknown()).nullish(),
})

export type UpdateCouponInput = z.infer<typeof UpdateCouponSchema>

// =============================================================================
// Promotion Usage Schema
// =============================================================================

/**
 * Promotion usage record schema
 */
export const PromotionUsageSchema = TenantScopedSchema.extend({
  id: IdSchema,
  promotionId: IdSchema,
  couponId: IdSchema.nullish(),
  orderId: z.string(),
  customerId: z.string().nullish(),
  discountAmountCents: z.number().int().nonnegative(),
  appliedAt: z.date(),
})

export type PromotionUsage = z.infer<typeof PromotionUsageSchema>

/**
 * Schema for recording promotion usage
 */
export const RecordPromotionUsageSchema = z.object({
  promotionId: IdSchema,
  couponId: IdSchema.optional(),
  orderId: z.string(),
  customerId: z.string().optional(),
  discountAmountCents: z.number().int().nonnegative(),
})

export type RecordPromotionUsageInput = z.infer<typeof RecordPromotionUsageSchema>
