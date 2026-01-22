'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useServerActionMutation } from '@/lib/server-action-hooks'
import {
  createCouponAction,
  generateCouponsAction,
  updateCouponAction,
  deactivateCouponAction,
  deleteCouponAction,
} from '../_actions/coupon-actions'
import { toast } from 'sonner'

/**
 * Hook for creating a single coupon
 * Automatically invalidates coupons cache on success
 *
 * @see Story 3.9 - Promotions & Discounts Foundation
 */
export function useCreateCoupon() {
  const queryClient = useQueryClient()

  return useServerActionMutation(createCouponAction, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['coupons'] })
      await queryClient.invalidateQueries({ queryKey: ['promotions'] })
      toast.success('Coupon created successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create coupon')
    },
  })
}

/**
 * Hook for generating multiple coupons in bulk
 * Automatically invalidates coupons cache on success
 */
export function useGenerateCoupons() {
  const queryClient = useQueryClient()

  return useServerActionMutation(generateCouponsAction, {
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ['coupons'] })
      await queryClient.invalidateQueries({ queryKey: ['promotions'] })
      toast.success(`Generated ${data.count} coupons successfully`)
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to generate coupons')
    },
  })
}

/**
 * Hook for updating a coupon
 * Automatically invalidates coupons cache on success
 */
export function useUpdateCoupon() {
  const queryClient = useQueryClient()

  return useServerActionMutation(updateCouponAction, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['coupons'] })
      toast.success('Coupon updated successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update coupon')
    },
  })
}

/**
 * Hook for deactivating a coupon
 * Automatically invalidates coupons cache on success
 */
export function useDeactivateCoupon() {
  const queryClient = useQueryClient()

  return useServerActionMutation(deactivateCouponAction, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['coupons'] })
      toast.success('Coupon deactivated')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to deactivate coupon')
    },
  })
}

/**
 * Hook for deleting a coupon
 * Automatically invalidates coupons cache on success
 */
export function useDeleteCoupon() {
  const queryClient = useQueryClient()

  return useServerActionMutation(deleteCouponAction, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['coupons'] })
      await queryClient.invalidateQueries({ queryKey: ['promotions'] })
      toast.success('Coupon deleted successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete coupon')
    },
  })
}
