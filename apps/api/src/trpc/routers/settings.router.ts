/**
 * Settings Router - tRPC procedures for store settings management
 *
 * Exposes get and update procedures for store settings.
 * Uses existing SettingsService for business logic.
 *
 * @see Story 2.7 - Store Settings Configuration
 */
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, isAuthed } from '../trpc';
import { UpdateStoreSettingsSchema } from '@trafi/validators';

export const settingsRouter = router({
  /**
   * Get store settings
   * Returns current settings or defaults if none exist
   * Requires authentication
   */
  get: publicProcedure
    .use(isAuthed)
    .query(async ({ ctx }) => {
      try {
        ctx.requirePermission('settings:read');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        return await ctx.services.settingsService.get(ctx.storeId);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get store settings',
        });
      }
    }),

  /**
   * Update store settings
   * Supports partial updates
   * Requires authentication and settings:update permission
   */
  update: publicProcedure
    .use(isAuthed)
    .input(UpdateStoreSettingsSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('settings:update');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        return await ctx.services.settingsService.update(ctx.storeId, input);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update store settings',
        });
      }
    }),
});

export type SettingsRouter = typeof settingsRouter;
