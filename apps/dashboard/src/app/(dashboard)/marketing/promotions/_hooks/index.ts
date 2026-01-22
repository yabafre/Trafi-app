/**
 * Promotions & Coupons Hooks
 *
 * @see Story 3.9 - Promotions & Discounts Foundation
 */

// Promotion hooks
export { usePromotionList } from './usePromotionList'
export { usePromotion } from './usePromotion'
export {
  useCreatePromotion,
  useUpdatePromotion,
  useDeletePromotion,
  useActivatePromotion,
  usePausePromotion,
  useArchivePromotion,
} from './usePromotionMutations'

// Coupon hooks
export { useCouponList } from './useCouponList'
export {
  useCreateCoupon,
  useGenerateCoupons,
  useUpdateCoupon,
  useDeactivateCoupon,
  useDeleteCoupon,
} from './useCouponMutations'
