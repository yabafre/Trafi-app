/**
 * tRPC Router for Coupons
 *
 * All mutations require `settings:update` permission (marketing settings).
 * All queries require `settings:read` permission.
 *
 * @see Story 3.9 - Promotions & Discounts Foundation
 */
import { TRPCError } from '@trpc/server'
import { z } from '@trafi/zod'
import { router, publicProcedure, isAuthed } from '../trpc'
import {
  CreateCouponSchema,
  GenerateCouponsSchema,
  UpdateCouponSchema,
  ValidateCouponSchema,
} from '@trafi/validators'

// Local input schema for listing coupons (all optional)
const ListCouponsInputSchema = z.object({
  promotionId: z.string().optional(),
  isActive: z.boolean().optional(),
  search: z.string().max(50).optional(),
  includeExpired: z.boolean().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
})

export const couponsRouter = router({
  /**
   * List coupons with pagination and filters.
   * Requires `settings:read` permission.
   */
  list: publicProcedure
    .use(isAuthed)
    .input(ListCouponsInputSchema.optional())
    .query(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('settings:read')

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          })
        }

        return await ctx.services.couponService.list(ctx.storeId, input ?? {})
      } catch (error) {
        if (error instanceof TRPCError) throw error
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to list coupons',
        })
      }
    }),

  /**
   * Get a single coupon by ID.
   * Requires `settings:read` permission.
   */
  get: publicProcedure
    .use(isAuthed)
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('settings:read')

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          })
        }

        return await ctx.services.couponService.findById(ctx.storeId, input.id)
      } catch (error) {
        if (error instanceof TRPCError) throw error
        if (error instanceof Error && error.message === 'Coupon not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Coupon not found',
          })
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get coupon',
        })
      }
    }),

  /**
   * Find a coupon by code.
   * Requires `settings:read` permission.
   */
  findByCode: publicProcedure
    .use(isAuthed)
    .input(z.object({ code: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('settings:read')

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          })
        }

        const coupon = await ctx.services.couponService.findByCode(ctx.storeId, input.code)
        if (!coupon) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Coupon not found',
          })
        }
        return coupon
      } catch (error) {
        if (error instanceof TRPCError) throw error
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to find coupon',
        })
      }
    }),

  /**
   * Create a single coupon.
   * Requires `settings:update` permission.
   */
  create: publicProcedure
    .use(isAuthed)
    .input(CreateCouponSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('settings:update')

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          })
        }

        return await ctx.services.couponService.create(ctx.storeId, input)
      } catch (error) {
        if (error instanceof TRPCError) throw error
        if (error instanceof Error && error.message.includes('already exists')) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: error.message,
          })
        }
        if (error instanceof Error && error.message === 'Promotion not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Promotion not found',
          })
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create coupon',
        })
      }
    }),

  /**
   * Generate multiple coupons in bulk.
   * Requires `settings:update` permission.
   */
  generateBulk: publicProcedure
    .use(isAuthed)
    .input(GenerateCouponsSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('settings:update')

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          })
        }

        return await ctx.services.couponService.generateBulk(ctx.storeId, input)
      } catch (error) {
        if (error instanceof TRPCError) throw error
        if (error instanceof Error && error.message === 'Promotion not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Promotion not found',
          })
        }
        if (error instanceof Error && error.message.includes('unique coupon code')) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          })
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to generate coupons',
        })
      }
    }),

  /**
   * Update a coupon.
   * Requires `settings:update` permission.
   */
  update: publicProcedure
    .use(isAuthed)
    .input(z.object({ id: z.string() }).merge(UpdateCouponSchema))
    .mutation(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('settings:update')

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          })
        }

        const { id, ...updateData } = input
        return await ctx.services.couponService.update(ctx.storeId, id, updateData)
      } catch (error) {
        if (error instanceof TRPCError) throw error
        if (error instanceof Error && error.message === 'Coupon not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Coupon not found',
          })
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update coupon',
        })
      }
    }),

  /**
   * Deactivate a coupon.
   * Requires `settings:update` permission.
   */
  deactivate: publicProcedure
    .use(isAuthed)
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('settings:update')

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          })
        }

        return await ctx.services.couponService.deactivate(ctx.storeId, input.id)
      } catch (error) {
        if (error instanceof TRPCError) throw error
        if (error instanceof Error && error.message === 'Coupon not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Coupon not found',
          })
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to deactivate coupon',
        })
      }
    }),

  /**
   * Delete a coupon.
   * Requires `settings:update` permission.
   */
  delete: publicProcedure
    .use(isAuthed)
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('settings:update')

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          })
        }

        await ctx.services.couponService.delete(ctx.storeId, input.id)
        return { success: true }
      } catch (error) {
        if (error instanceof TRPCError) throw error
        if (error instanceof Error && error.message === 'Coupon not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Coupon not found',
          })
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to delete coupon',
        })
      }
    }),

  /**
   * Validate a coupon code.
   * This is used to check if a coupon is valid before applying it.
   * Requires `settings:read` permission.
   */
  validate: publicProcedure
    .use(isAuthed)
    .input(ValidateCouponSchema)
    .query(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('settings:read')

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          })
        }

        return await ctx.services.couponService.validate(ctx.storeId, input)
      } catch (error) {
        if (error instanceof TRPCError) throw error
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to validate coupon',
        })
      }
    }),
})

export type CouponsRouter = typeof couponsRouter
