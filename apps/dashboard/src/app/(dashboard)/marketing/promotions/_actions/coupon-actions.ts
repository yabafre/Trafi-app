'use server'

import { revalidatePath } from 'next/cache'
import { createServerAction } from 'zsa'
import { z } from '@trafi/zod'
import { createAuthenticatedTrpcClient } from '@/lib/trpc'
import {
  IdParamSchema,
  ListCouponsSchema,
  CreateCouponSchema,
  GenerateCouponsSchema,
  UpdateCouponSchema,
  ValidateCouponSchema,
} from '@trafi/validators'

/**
 * List coupons with pagination and filters.
 * Returns paginated list.
 *
 * @see Story 3.9 - Promotions & Discounts Foundation
 */
export const getCouponListAction = createServerAction()
  .input(ListCouponsSchema.partial())
  .handler(async ({ input }) => {
    const trpc = await createAuthenticatedTrpcClient()
    return await trpc.coupons.list.query(input)
  })

/**
 * Get a single coupon by ID.
 */
export const getCouponAction = createServerAction()
  .input(IdParamSchema)
  .handler(async ({ input }) => {
    const trpc = await createAuthenticatedTrpcClient()
    return await trpc.coupons.get.query({ id: input.id })
  })

/**
 * Find a coupon by code.
 */
export const findCouponByCodeAction = createServerAction()
  .input(z.object({ code: z.string() }))
  .handler(async ({ input }) => {
    const trpc = await createAuthenticatedTrpcClient()
    return await trpc.coupons.findByCode.query({ code: input.code })
  })

/**
 * Create a single coupon.
 * Revalidates coupons list cache after creation.
 */
export const createCouponAction = createServerAction()
  .input(CreateCouponSchema)
  .handler(async ({ input }) => {
    const trpc = await createAuthenticatedTrpcClient()
    const coupon = await trpc.coupons.create.mutate(input)
    revalidatePath('/marketing/promotions')
    revalidatePath(`/marketing/promotions/${input.promotionId}`)
    return coupon
  })

/**
 * Generate multiple coupons in bulk.
 * Revalidates coupons list cache after generation.
 */
export const generateCouponsAction = createServerAction()
  .input(GenerateCouponsSchema)
  .handler(async ({ input }) => {
    const trpc = await createAuthenticatedTrpcClient()
    const result = await trpc.coupons.generateBulk.mutate(input)
    revalidatePath('/marketing/promotions')
    revalidatePath(`/marketing/promotions/${input.promotionId}`)
    return result
  })

/**
 * Update a coupon.
 * Revalidates coupons list cache after update.
 */
export const updateCouponAction = createServerAction()
  .input(z.object({ id: z.string() }).merge(UpdateCouponSchema))
  .handler(async ({ input }) => {
    const trpc = await createAuthenticatedTrpcClient()
    const { id, ...updateData } = input
    const coupon = await trpc.coupons.update.mutate({ id, ...updateData })
    revalidatePath('/marketing/promotions')
    return coupon
  })

/**
 * Deactivate a coupon.
 * Revalidates coupons list cache after update.
 */
export const deactivateCouponAction = createServerAction()
  .input(IdParamSchema)
  .handler(async ({ input }) => {
    const trpc = await createAuthenticatedTrpcClient()
    const coupon = await trpc.coupons.deactivate.mutate({ id: input.id })
    revalidatePath('/marketing/promotions')
    return coupon
  })

/**
 * Delete a coupon.
 * Revalidates coupons list cache after deletion.
 */
export const deleteCouponAction = createServerAction()
  .input(IdParamSchema)
  .handler(async ({ input }): Promise<{ success: boolean }> => {
    const trpc = await createAuthenticatedTrpcClient()
    await trpc.coupons.delete.mutate({ id: input.id })
    revalidatePath('/marketing/promotions')
    return { success: true }
  })

/**
 * Validate a coupon code.
 * Checks if a coupon is valid before applying it.
 */
export const validateCouponAction = createServerAction()
  .input(ValidateCouponSchema)
  .handler(async ({ input }) => {
    const trpc = await createAuthenticatedTrpcClient()
    return await trpc.coupons.validate.query(input)
  })
