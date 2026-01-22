import { Module } from '@nestjs/common'
import { PromotionsService } from './promotions.service'
import { CouponService } from './coupon.service'

/**
 * Promotions module
 *
 * Provides promotions, discounts, and coupon management.
 * All operations are tenant-scoped via storeId.
 *
 * @see Story 3.9 - Promotions & Discounts Foundation
 */
@Module({
  providers: [PromotionsService, CouponService],
  exports: [PromotionsService, CouponService],
})
export class PromotionsModule {}
