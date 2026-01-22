/**
 * tRPC Router for Promotions
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
  CreatePromotionSchema,
  UpdatePromotionBaseSchema,
  PromotionStatusSchema,
} from '@trafi/validators'

// Local input schema for listing promotions (all optional)
const ListPromotionsInputSchema = z.object({
  status: PromotionStatusSchema.optional(),
  type: z.enum(['PERCENT', 'FIXED', 'FREE_SHIPPING', 'BUY_X_GET_Y']).optional(),
  search: z.string().max(100).optional(),
  activeOnly: z.boolean().optional(),
  includeExpired: z.boolean().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
})

export const promotionsRouter = router({
  /**
   * List promotions with pagination and filters.
   * Requires `settings:read` permission.
   */
  list: publicProcedure
    .use(isAuthed)
    .input(ListPromotionsInputSchema.optional())
    .query(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('settings:read')

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          })
        }

        return await ctx.services.promotionsService.list(ctx.storeId, input ?? {})
      } catch (error) {
        if (error instanceof TRPCError) throw error
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to list promotions',
        })
      }
    }),

  /**
   * Get a single promotion by ID.
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

        return await ctx.services.promotionsService.findById(ctx.storeId, input.id)
      } catch (error) {
        if (error instanceof TRPCError) throw error
        if (error instanceof Error && error.message === 'Promotion not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Promotion not found',
          })
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get promotion',
        })
      }
    }),

  /**
   * List promotions for dropdown/select.
   * Requires `settings:read` permission.
   */
  listForSelect: publicProcedure.use(isAuthed).query(async ({ ctx }) => {
    try {
      ctx.requirePermission('settings:read')

      if (!ctx.storeId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Store context required',
        })
      }

      return await ctx.services.promotionsService.listForSelect(ctx.storeId)
    } catch (error) {
      if (error instanceof TRPCError) throw error
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Failed to list promotions',
      })
    }
  }),

  /**
   * Create a new promotion.
   * Requires `settings:update` permission.
   */
  create: publicProcedure
    .use(isAuthed)
    .input(CreatePromotionSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('settings:update')

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          })
        }

        return await ctx.services.promotionsService.create(ctx.storeId, input)
      } catch (error) {
        if (error instanceof TRPCError) throw error
        if (error instanceof Error && error.message.includes('Invalid discount')) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          })
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create promotion',
        })
      }
    }),

  /**
   * Update an existing promotion.
   * Requires `settings:update` permission.
   */
  update: publicProcedure
    .use(isAuthed)
    .input(z.object({ id: z.string() }).merge(UpdatePromotionBaseSchema))
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
        return await ctx.services.promotionsService.update(ctx.storeId, id, updateData)
      } catch (error) {
        if (error instanceof TRPCError) throw error
        if (error instanceof Error && error.message === 'Promotion not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Promotion not found',
          })
        }
        if (error instanceof Error && error.message.includes('Invalid discount')) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          })
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update promotion',
        })
      }
    }),

  /**
   * Delete a promotion.
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

        await ctx.services.promotionsService.delete(ctx.storeId, input.id)
        return { success: true }
      } catch (error) {
        if (error instanceof TRPCError) throw error
        if (error instanceof Error && error.message === 'Promotion not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Promotion not found',
          })
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to delete promotion',
        })
      }
    }),

  /**
   * Update promotion status (activate/pause/archive).
   * Requires `settings:update` permission.
   */
  updateStatus: publicProcedure
    .use(isAuthed)
    .input(z.object({ id: z.string(), status: PromotionStatusSchema }))
    .mutation(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('settings:update')

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          })
        }

        return await ctx.services.promotionsService.updateStatus(ctx.storeId, input.id, input.status)
      } catch (error) {
        if (error instanceof TRPCError) throw error
        if (error instanceof Error && error.message === 'Promotion not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Promotion not found',
          })
        }
        if (error instanceof Error && error.message.includes('Cannot transition')) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          })
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update promotion status',
        })
      }
    }),

  /**
   * Activate a promotion.
   * Requires `settings:update` permission.
   */
  activate: publicProcedure
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

        return await ctx.services.promotionsService.activate(ctx.storeId, input.id)
      } catch (error) {
        if (error instanceof TRPCError) throw error
        if (error instanceof Error && error.message === 'Promotion not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Promotion not found',
          })
        }
        if (error instanceof Error && error.message.includes('Cannot')) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          })
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to activate promotion',
        })
      }
    }),

  /**
   * Pause a promotion.
   * Requires `settings:update` permission.
   */
  pause: publicProcedure
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

        return await ctx.services.promotionsService.pause(ctx.storeId, input.id)
      } catch (error) {
        if (error instanceof TRPCError) throw error
        if (error instanceof Error && error.message === 'Promotion not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Promotion not found',
          })
        }
        if (error instanceof Error && error.message.includes('Cannot')) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          })
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to pause promotion',
        })
      }
    }),

  /**
   * Archive a promotion.
   * Requires `settings:update` permission.
   */
  archive: publicProcedure
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

        return await ctx.services.promotionsService.archive(ctx.storeId, input.id)
      } catch (error) {
        if (error instanceof TRPCError) throw error
        if (error instanceof Error && error.message === 'Promotion not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Promotion not found',
          })
        }
        if (error instanceof Error && error.message.includes('Cannot')) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          })
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to archive promotion',
        })
      }
    }),
})

export type PromotionsRouter = typeof promotionsRouter
