/**
 * tRPC Router for Inventory Management
 *
 * Provides inventory tracking, adjustments, settings, and history.
 * All operations require tenant context and appropriate permissions.
 *
 * @see Story 3.7 - Inventory Tracking
 */
import { z } from '@trafi/zod'
import { router, publicProcedure, isAuthed } from '../trpc'
import { storeQuery, storeMutation } from '../helpers'
import {
  AdjustInventorySchema,
  SetInventorySchema,
  UpdateInventorySettingsSchema,
  ListInventoryHistorySchema,
} from '@trafi/validators'

export const inventoryRouter = router({
  /** Adjust inventory by a delta amount */
  adjust: publicProcedure
    .use(isAuthed)
    .input(AdjustInventorySchema)
    .mutation(storeMutation('products:update', (ctx, input) =>
      ctx.services.inventoryService.adjustInventory(ctx.storeId, input, ctx.userId)
    )),

  /** Set inventory to an absolute value */
  set: publicProcedure
    .use(isAuthed)
    .input(SetInventorySchema)
    .mutation(storeMutation('products:update', (ctx, input) =>
      ctx.services.inventoryService.setInventory(ctx.storeId, input, ctx.userId)
    )),

  /** Update inventory settings (trackInventory, lowStockThreshold, allowOversell) */
  updateSettings: publicProcedure
    .use(isAuthed)
    .input(UpdateInventorySettingsSchema)
    .mutation(storeMutation('products:update', (ctx, input) =>
      ctx.services.inventoryService.updateSettings(ctx.storeId, input)
    )),

  /** Get inventory info for a variant */
  get: publicProcedure
    .use(isAuthed)
    .input(z.object({ variantId: z.string() }))
    .query(storeQuery('products:read', (ctx, input) =>
      ctx.services.inventoryService.getVariantInventory(ctx.storeId, input.variantId)
    )),

  /** Get paginated inventory history for a variant */
  history: publicProcedure
    .use(isAuthed)
    .input(ListInventoryHistorySchema)
    .query(storeQuery('products:read', (ctx, input) =>
      ctx.services.inventoryService.getHistory(ctx.storeId, input)
    )),
})

export type InventoryRouter = typeof inventoryRouter
