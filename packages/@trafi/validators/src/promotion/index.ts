/**
 * Promotion validation schemas
 *
 * @module @trafi/validators/promotion
 * @see Story 3.9 - Promotions & Discounts Foundation
 */

export * from './promotion.schema'
export * from './create-promotion.schema'
export * from './update-promotion.schema'
export * from './coupon.schema'

// Re-export commonly used types for convenience
export type {
  Promotion,
  PromotionType,
  PromotionStatus,
  PromotionConditions,
  ListPromotionsInput,
  PromotionResponse,
} from './promotion.schema'
export type { CreatePromotionInput } from './create-promotion.schema'
export type { UpdatePromotionInput } from './update-promotion.schema'
export type {
  Coupon,
  CreateCouponInput,
  GenerateCouponsInput,
  ListCouponsInput,
} from './coupon.schema'
