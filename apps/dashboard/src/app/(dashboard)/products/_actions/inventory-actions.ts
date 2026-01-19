'use server'

import { revalidatePath } from 'next/cache'
import { z } from '@trafi/zod'
import { createServerAction } from 'zsa'
import { createAuthenticatedTrpcClient } from '@/lib/trpc'
import {
  AdjustInventorySchema,
  SetInventorySchema,
  UpdateInventorySettingsSchema,
  ListInventoryHistorySchema,
} from '@trafi/validators'
import type {
  VariantInventory,
  InventoryHistoryListResult,
} from '@trafi/types'

/**
 * Adjust inventory by a delta amount.
 * Revalidates product cache after adjustment.
 *
 * @see Story 3.7 - Inventory Tracking
 */
export const adjustInventoryAction = createServerAction()
  .input(AdjustInventorySchema)
  .handler(async ({ input }): Promise<VariantInventory> => {
    const trpc = await createAuthenticatedTrpcClient()
    const result = await trpc.inventory.adjust.mutate(input)
    revalidatePath('/products')
    revalidatePath(`/products/[id]`, 'page')
    return result
  })

/**
 * Set inventory to an absolute value.
 * Revalidates product cache after set.
 */
export const setInventoryAction = createServerAction()
  .input(SetInventorySchema)
  .handler(async ({ input }): Promise<VariantInventory> => {
    const trpc = await createAuthenticatedTrpcClient()
    const result = await trpc.inventory.set.mutate(input)
    revalidatePath('/products')
    revalidatePath(`/products/[id]`, 'page')
    return result
  })

/**
 * Update inventory settings (trackInventory, lowStockThreshold, allowOversell).
 * Revalidates product cache after update.
 */
export const updateInventorySettingsAction = createServerAction()
  .input(UpdateInventorySettingsSchema)
  .handler(async ({ input }): Promise<VariantInventory> => {
    const trpc = await createAuthenticatedTrpcClient()
    const result = await trpc.inventory.updateSettings.mutate(input)
    revalidatePath('/products')
    revalidatePath(`/products/[id]`, 'page')
    return result
  })

/**
 * Get inventory info for a variant.
 * Pure query, no side effects.
 */
export const getVariantInventoryAction = createServerAction()
  .input(z.object({ variantId: z.string() }))
  .handler(async ({ input }): Promise<VariantInventory> => {
    const trpc = await createAuthenticatedTrpcClient()
    return await trpc.inventory.get.query(input)
  })

/**
 * Get paginated inventory history for a variant.
 * Pure query, no side effects.
 */
export const getInventoryHistoryAction = createServerAction()
  .input(ListInventoryHistorySchema)
  .handler(async ({ input }): Promise<InventoryHistoryListResult> => {
    const trpc = await createAuthenticatedTrpcClient()
    return await trpc.inventory.history.query(input)
  })
