'use server'

import { createServerAction } from 'zsa'
import { createAuthenticatedTrpcClient } from '@/lib/trpc'
import {
  UpdateStoreSettingsSchema,
  type StoreSettingsResponse,
} from '@trafi/validators'

/**
 * Get store settings action
 * Returns current settings or defaults if none configured
 * Uses tRPC for type-safe API communication
 */
export const getStoreSettingsAction = createServerAction()
  .handler(async (): Promise<StoreSettingsResponse> => {
    const trpc = await createAuthenticatedTrpcClient()
    return await trpc.settings.get.query()
  })

/**
 * Update store settings action
 * Supports partial updates - only provided fields are changed
 * Uses tRPC for type-safe API communication
 */
export const updateStoreSettingsAction = createServerAction()
  .input(UpdateStoreSettingsSchema)
  .handler(async ({ input }): Promise<StoreSettingsResponse> => {
    const trpc = await createAuthenticatedTrpcClient()
    return await trpc.settings.update.mutate(input)
  })
