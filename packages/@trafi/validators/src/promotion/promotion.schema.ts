import { z } from '@trafi/zod'
import { IdSchema, TimestampsSchema, TenantScopedSchema, PaginationSchema } from '../common'

/**
 * Promotion Schemas
 * @see Story 3.9 - Promotions & Discounts Foundation
 * @see apps/api/prisma/schema/promotion.prisma
 */

// =============================================================================
// Enums (match Prisma enums)
// =============================================================================

/**
 * Promotion type enum matching Prisma PromotionType
 * Per ARCH-PROMO-1: Simplified MVP types
 */
export const PromotionTypeSchema = z.enum([
  'PERCENT', // discountValue = percentage (e.g., 10 = 10%)
  'FIXED', // discountValue = cents (e.g., 1000 = 10.00 EUR)
  'FREE_SHIPPING', // discountValue = null (shipping cost waived)
  'BUY_X_GET_Y', // conditions JSON defines buyQuantity/getQuantity/productId
])
export type PromotionType = z.infer<typeof PromotionTypeSchema>

/**
 * Promotion status enum matching Prisma PromotionStatus
 */
export const PromotionStatusSchema = z.enum([
  'DRAFT', // Not yet active, being configured
  'ACTIVE', // Currently running
  'PAUSED', // Temporarily stopped
  'EXPIRED', // End date passed
  'ARCHIVED', // Soft-deleted, hidden from lists
])
export type PromotionStatus = z.infer<typeof PromotionStatusSchema>

// =============================================================================
// Conditions JSON Schema (ARCH-PROMO-2)
// =============================================================================

/**
 * Promotion conditions JSON schema
 * Per ARCH-PROMO-2: Flexible conditions stored as JSON
 */
export const PromotionConditionsSchema = z
  .object({
    // Minimum order amount in cents (e.g., 5000 = 50.00 EUR)
    minOrderCents: z.number().int().nonnegative().optional(),

    // Product restrictions
    productIds: z.array(z.string()).optional(),

    // Category restrictions
    categoryIds: z.array(z.string()).optional(),

    // Customer group targeting
    customerGroupIds: z.array(z.string()).optional(),

    // First-time customer only
    firstTimeCustomerOnly: z.boolean().optional(),

    // BUY_X_GET_Y specific fields
    buyQuantity: z.number().int().positive().optional(),
    getQuantity: z.number().int().positive().optional(),
    productId: z.string().optional(),
  })
  .optional()
  .nullable()

export type PromotionConditions = z.infer<typeof PromotionConditionsSchema>

// =============================================================================
// Base Promotion Schema
// =============================================================================

/**
 * Base promotion schema with all fields
 * Money stored as INTEGER cents (ARCH-25)
 */
export const PromotionSchema = TenantScopedSchema.extend({
  id: IdSchema,
  name: z.string().min(1).max(100).describe('Promotion name/title'),
  description: z.string().max(500).nullish(),
  type: PromotionTypeSchema,
  discountValue: z
    .number()
    .int()
    .nonnegative()
    .nullish()
    .describe('For PERCENT: percentage (10 = 10%). For FIXED: cents (1000 = 10.00 EUR)'),
  conditions: PromotionConditionsSchema,
  conditionsVersion: z.number().int().default(1),
  maxDiscountCents: z.number().int().nonnegative().nullish().describe('Cap for PERCENT type'),
  usageLimit: z.number().int().positive().nullish().describe('Global usage limit (null = unlimited)'),
  usageCount: z.number().int().nonnegative().default(0),
  perCustomerLimit: z.number().int().positive().nullish().describe('Per-customer usage limit'),
  startsAt: z.date().describe('When the promotion starts'),
  endsAt: z.date().nullish().describe('When the promotion ends (null = no end date)'),
  status: PromotionStatusSchema.default('DRAFT'),
  priority: z.number().int().default(0).describe('Higher = applied first'),
  stackable: z.boolean().default(false).describe('Can combine with other promos'),
}).merge(TimestampsSchema)

export type Promotion = z.infer<typeof PromotionSchema>

// =============================================================================
// List Promotions Schema
// =============================================================================

/**
 * List promotions query schema with pagination and filtering
 */
export const ListPromotionsSchema = PaginationSchema.extend({
  status: PromotionStatusSchema.optional().describe('Filter by promotion status'),
  type: PromotionTypeSchema.optional().describe('Filter by promotion type'),
  search: z.string().max(100).optional().describe('Search in name, description'),
  activeOnly: z.boolean().optional().describe('Only show currently active promotions'),
  includeExpired: z.boolean().optional().default(false).describe('Include expired promotions'),
})

export type ListPromotionsInput = z.infer<typeof ListPromotionsSchema>

// =============================================================================
// Response Schema
// =============================================================================

/**
 * Promotion response schema (what API returns)
 */
export const PromotionResponseSchema = PromotionSchema.extend({
  // Add coupon count for list views
  couponCount: z.number().int().nonnegative().optional(),
})

export type PromotionResponse = z.infer<typeof PromotionResponseSchema>
