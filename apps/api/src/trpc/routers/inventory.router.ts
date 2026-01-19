/**
 * tRPC Router for Inventory Management
 *
 * Provides inventory tracking, adjustments, settings, and history.
 * All operations require tenant context and appropriate permissions.
 *
 * @see Story 3.7 - Inventory Tracking
 */
import { z } from '@trafi/zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, isAuthed } from '../trpc';
import {
  AdjustInventorySchema,
  SetInventorySchema,
  UpdateInventorySettingsSchema,
  ListInventoryHistorySchema,
} from '@trafi/validators';

export const inventoryRouter = router({
  /**
   * Adjust inventory by a delta amount.
   * Requires `products:update` permission.
   */
  adjust: publicProcedure
    .use(isAuthed)
    .input(AdjustInventorySchema)
    .mutation(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('products:update');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Store context required',
          });
        }

        return ctx.services.inventoryService.adjustInventory(
          ctx.storeId,
          input,
          ctx.userId,
        );
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to adjust inventory',
        });
      }
    }),

  /**
   * Set inventory to an absolute value.
   * Requires `products:update` permission.
   */
  set: publicProcedure
    .use(isAuthed)
    .input(SetInventorySchema)
    .mutation(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('products:update');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Store context required',
          });
        }

        return ctx.services.inventoryService.setInventory(
          ctx.storeId,
          input,
          ctx.userId,
        );
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to set inventory',
        });
      }
    }),

  /**
   * Update inventory settings (trackInventory, lowStockThreshold, allowOversell).
   * Requires `products:update` permission.
   */
  updateSettings: publicProcedure
    .use(isAuthed)
    .input(UpdateInventorySettingsSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('products:update');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Store context required',
          });
        }

        return ctx.services.inventoryService.updateSettings(ctx.storeId, input);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update inventory settings',
        });
      }
    }),

  /**
   * Get inventory info for a variant.
   * Requires `products:read` permission.
   */
  get: publicProcedure
    .use(isAuthed)
    .input(z.object({ variantId: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('products:read');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Store context required',
          });
        }

        return ctx.services.inventoryService.getVariantInventory(
          ctx.storeId,
          input.variantId,
        );
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get inventory',
        });
      }
    }),

  /**
   * Get paginated inventory history for a variant.
   * Requires `products:read` permission.
   */
  history: publicProcedure
    .use(isAuthed)
    .input(ListInventoryHistorySchema)
    .query(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('products:read');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Store context required',
          });
        }

        return ctx.services.inventoryService.getHistory(ctx.storeId, input);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get inventory history',
        });
      }
    }),
});

export type InventoryRouter = typeof inventoryRouter;
