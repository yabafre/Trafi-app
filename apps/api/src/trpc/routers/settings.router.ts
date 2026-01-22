/**
 * Settings Router - tRPC procedures for store settings management
 *
 * Exposes get and update procedures for store settings.
 * Uses existing SettingsService for business logic.
 *
 * @see Story 2.7 - Store Settings Configuration
 */
import { router, publicProcedure, isAuthed } from '../trpc'
import { storeQuery, storeMutation } from '../helpers'
import { UpdateStoreSettingsSchema } from '@trafi/validators'

export const settingsRouter = router({
  /** Get store settings (returns current settings or defaults if none exist) */
  get: publicProcedure
    .use(isAuthed)
    .query(storeQuery('settings:read', (ctx) =>
      ctx.services.settingsService.get(ctx.storeId)
    )),

  /** Update store settings (supports partial updates) */
  update: publicProcedure
    .use(isAuthed)
    .input(UpdateStoreSettingsSchema)
    .mutation(storeMutation('settings:update', (ctx, input) =>
      ctx.services.settingsService.update(ctx.storeId, input)
    )),
})

export type SettingsRouter = typeof settingsRouter
