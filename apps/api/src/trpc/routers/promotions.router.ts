/**
 * tRPC Router for Promotions
 *
 * All mutations require `settings:update` permission (marketing settings).
 * All queries require `settings:read` permission.
 *
 * @see Story 3.9 - Promotions & Discounts Foundation
 */
import { z } from '@trafi/zod'
import { router, publicProcedure, isAuthed } from '../trpc'
import { storeQuery, storeMutation } from '../helpers'
import {
  IdParamSchema,
  ListPromotionsSchema,
  CreatePromotionSchema,
  UpdatePromotionBaseSchema,
  PromotionStatusSchema,
} from '@trafi/validators'

export const promotionsRouter = router({
  /** List promotions with pagination and filters */
  list: publicProcedure
    .use(isAuthed)
    .input(ListPromotionsSchema.optional())
    .query(storeQuery('settings:read', (ctx, input) =>
      ctx.services.promotionsService.list(ctx.storeId, input ?? {})
    )),

  /** Get a single promotion by ID */
  get: publicProcedure
    .use(isAuthed)
    .input(IdParamSchema)
    .query(storeQuery('settings:read', (ctx, input) =>
      ctx.services.promotionsService.findById(ctx.storeId, input.id)
    )),

  /** List promotions for dropdown/select */
  listForSelect: publicProcedure
    .use(isAuthed)
    .query(storeQuery('settings:read', (ctx) =>
      ctx.services.promotionsService.listForSelect(ctx.storeId)
    )),

  /** Create a new promotion */
  create: publicProcedure
    .use(isAuthed)
    .input(CreatePromotionSchema)
    .mutation(storeMutation('settings:update', (ctx, input) =>
      ctx.services.promotionsService.create(ctx.storeId, input)
    )),

  /** Update an existing promotion */
  update: publicProcedure
    .use(isAuthed)
    .input(z.object({ id: z.string() }).merge(UpdatePromotionBaseSchema))
    .mutation(storeMutation('settings:update', (ctx, input) => {
      const { id, ...updateData } = input
      return ctx.services.promotionsService.update(ctx.storeId, id, updateData)
    })),

  /** Delete a promotion */
  delete: publicProcedure
    .use(isAuthed)
    .input(IdParamSchema)
    .mutation(storeMutation('settings:update', async (ctx, input) => {
      await ctx.services.promotionsService.delete(ctx.storeId, input.id)
      return { success: true }
    })),

  /** Update promotion status (activate/pause/archive) */
  updateStatus: publicProcedure
    .use(isAuthed)
    .input(z.object({ id: z.string(), status: PromotionStatusSchema }))
    .mutation(storeMutation('settings:update', (ctx, input) =>
      ctx.services.promotionsService.updateStatus(ctx.storeId, input.id, input.status)
    )),

  /** Activate a promotion */
  activate: publicProcedure
    .use(isAuthed)
    .input(IdParamSchema)
    .mutation(storeMutation('settings:update', (ctx, input) =>
      ctx.services.promotionsService.activate(ctx.storeId, input.id)
    )),

  /** Pause a promotion */
  pause: publicProcedure
    .use(isAuthed)
    .input(IdParamSchema)
    .mutation(storeMutation('settings:update', (ctx, input) =>
      ctx.services.promotionsService.pause(ctx.storeId, input.id)
    )),

  /** Archive a promotion */
  archive: publicProcedure
    .use(isAuthed)
    .input(IdParamSchema)
    .mutation(storeMutation('settings:update', (ctx, input) =>
      ctx.services.promotionsService.archive(ctx.storeId, input.id)
    )),
})

export type PromotionsRouter = typeof promotionsRouter
