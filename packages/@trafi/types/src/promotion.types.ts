/**
 * @trafi/types - Promotion Domain Types
 *
 * Types for promotions, coupons, and discount codes.
 * Re-exported from @trafi/validators Zod schemas.
 * @see Story 3.9 - Promotions & Discounts Foundation
 */

export type {
  // Enums
  PromotionType,
  PromotionStatus,
  // Conditions
  PromotionConditions,
  // Input types
  CreatePromotionInput,
  UpdatePromotionInput,
  ListPromotionsInput,
  CreateCouponInput,
  GenerateCouponsInput,
  UpdateCouponInput,
  ListCouponsInput,
  ValidateCouponInput,
  RecordPromotionUsageInput,
  // Response types
  Promotion,
  PromotionResponse,
  Coupon,
  CouponValidationResult,
  PromotionUsage,
} from '@trafi/validators'

/**
 * Promotion response from API (with Date objects instead of strings)
 */
export interface PromotionResponseDTO {
  id: string
  storeId: string
  name: string
  description: string | null
  type: string
  discountValue: number | null
  conditions: Record<string, unknown> | null
  conditionsVersion: number
  maxDiscountCents: number | null
  usageLimit: number | null
  usageCount: number
  perCustomerLimit: number | null
  startsAt: Date
  endsAt: Date | null
  status: string
  priority: number
  stackable: boolean
  createdAt: Date
  updatedAt: Date
  couponCount?: number
}

/**
 * Coupon response from API
 */
export interface CouponResponseDTO {
  id: string
  storeId: string
  promotionId: string
  code: string
  usageLimit: number | null
  usageCount: number
  expiresAt: Date | null
  isActive: boolean
  metadata: Record<string, unknown> | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Paginated promotions list result
 */
export interface PromotionListResult {
  items: PromotionResponseDTO[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

/**
 * Paginated coupons list result
 */
export interface CouponListResult {
  items: CouponResponseDTO[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

/**
 * Bulk coupon generation result
 */
export interface GenerateCouponsResult {
  promotionId: string
  count: number
  coupons: CouponResponseDTO[]
}

// =============================================================================
// Event Payloads
// =============================================================================

/**
 * Promotion created event payload
 */
export interface PromotionCreatedEvent {
  promotionId: string
  storeId: string
  name: string
  type: string
}

/**
 * Promotion updated event payload
 */
export interface PromotionUpdatedEvent {
  promotionId: string
  storeId: string
  changes: Partial<PromotionResponseDTO>
}

/**
 * Promotion status changed event payload
 */
export interface PromotionStatusChangedEvent {
  promotionId: string
  storeId: string
  previousStatus: string
  newStatus: string
}

/**
 * Coupon created event payload
 */
export interface CouponCreatedEvent {
  couponId: string
  storeId: string
  promotionId: string
  code: string
}

/**
 * Coupons generated event payload (bulk)
 */
export interface CouponsGeneratedEvent {
  storeId: string
  promotionId: string
  count: number
  couponIds: string[]
}

/**
 * Promotion usage recorded event payload
 */
export interface PromotionUsageRecordedEvent {
  usageId: string
  storeId: string
  promotionId: string
  couponId: string | null
  orderId: string
  customerId: string | null
  discountAmountCents: number
}

/**
 * Promotion limit reached event payload
 */
export interface PromotionLimitReachedEvent {
  promotionId: string
  storeId: string
  usageCount: number
  usageLimit: number
}

/**
 * Promotion for select dropdown (minimal data)
 */
export interface PromotionSelectItem {
  id: string
  name: string
  type: string
  status: string
}

/**
 * Coupon validation result for dashboard use
 */
export interface CouponValidationResultDTO {
  valid: boolean
  coupon?: CouponResponseDTO
  promotion?: {
    id: string
    name: string
    type: string
    discountValue: number | null
    maxDiscountCents: number | null
    conditions?: Record<string, unknown> | null
  }
  errorCode?:
    | 'NOT_FOUND'
    | 'INACTIVE'
    | 'EXPIRED'
    | 'USAGE_LIMIT_REACHED'
    | 'CUSTOMER_LIMIT_REACHED'
    | 'PROMOTION_INACTIVE'
    | 'MIN_ORDER_NOT_MET'
    | 'NOT_STARTED'
  errorMessage?: string
}
