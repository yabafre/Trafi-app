/**
 * tRPC Router for Coupons
 *
 * All mutations require `settings:update` permission (marketing settings).
 * All queries require `settings:read` permission.
 *
 * @see Story 3.9 - Promotions & Discounts Foundation
 */
import { z } from '@trafi/zod'
import { TRPCError } from '@trpc/server'
import { router, publicProcedure, isAuthed } from '../trpc'
import { storeQuery, storeMutation } from '../helpers'
import {
  IdParamSchema,
  ListCouponsSchema,
  CreateCouponSchema,
  GenerateCouponsSchema,
  UpdateCouponSchema,
  ValidateCouponSchema,
} from '@trafi/validators'

export const couponsRouter = router({
  /** List coupons with pagination and filters */
  list: publicProcedure
    .use(isAuthed)
    .input(ListCouponsSchema.optional())
    .query(storeQuery('settings:read', (ctx, input) =>
      ctx.services.couponService.list(ctx.storeId, input ?? {})
    )),

  /** Get a single coupon by ID */
  get: publicProcedure
    .use(isAuthed)
    .input(IdParamSchema)
    .query(storeQuery('settings:read', (ctx, input) =>
      ctx.services.couponService.findById(ctx.storeId, input.id)
    )),

  /** Find a coupon by code */
  findByCode: publicProcedure
    .use(isAuthed)
    .input(z.object({ code: z.string() }))
    .query(storeQuery('settings:read', async (ctx, input) => {
      const coupon = await ctx.services.couponService.findByCode(ctx.storeId, input.code)
      if (!coupon) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Coupon not found' })
      }
      return coupon
    })),

  /** Create a single coupon */
  create: publicProcedure
    .use(isAuthed)
    .input(CreateCouponSchema)
    .mutation(storeMutation('settings:update', (ctx, input) =>
      ctx.services.couponService.create(ctx.storeId, input)
    )),

  /** Generate multiple coupons in bulk */
  generateBulk: publicProcedure
    .use(isAuthed)
    .input(GenerateCouponsSchema)
    .mutation(storeMutation('settings:update', (ctx, input) =>
      ctx.services.couponService.generateBulk(ctx.storeId, input)
    )),

  /** Update a coupon */
  update: publicProcedure
    .use(isAuthed)
    .input(z.object({ id: z.string() }).merge(UpdateCouponSchema))
    .mutation(storeMutation('settings:update', (ctx, input) => {
      const { id, ...updateData } = input
      return ctx.services.couponService.update(ctx.storeId, id, updateData)
    })),

  /** Deactivate a coupon */
  deactivate: publicProcedure
    .use(isAuthed)
    .input(IdParamSchema)
    .mutation(storeMutation('settings:update', (ctx, input) =>
      ctx.services.couponService.deactivate(ctx.storeId, input.id)
    )),

  /** Delete a coupon */
  delete: publicProcedure
    .use(isAuthed)
    .input(IdParamSchema)
    .mutation(storeMutation('settings:update', async (ctx, input) => {
      await ctx.services.couponService.delete(ctx.storeId, input.id)
      return { success: true }
    })),

  /** Validate a coupon code (check if valid before applying) */
  validate: publicProcedure
    .use(isAuthed)
    .input(ValidateCouponSchema)
    .query(storeQuery('settings:read', (ctx, input) =>
      ctx.services.couponService.validate(ctx.storeId, input)
    )),
})

export type CouponsRouter = typeof couponsRouter
