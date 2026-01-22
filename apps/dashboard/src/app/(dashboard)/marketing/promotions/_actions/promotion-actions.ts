'use server'

import { revalidatePath } from 'next/cache'
import { createServerAction } from 'zsa'
import { z } from '@trafi/zod'
import { createAuthenticatedTrpcClient } from '@/lib/trpc'
import {
  IdParamSchema,
  ListPromotionsSchema,
  CreatePromotionSchema,
  UpdatePromotionBaseSchema,
  PromotionStatusSchema,
} from '@trafi/validators'

/**
 * List promotions with pagination and filters.
 * Returns paginated list.
 *
 * @see Story 3.9 - Promotions & Discounts Foundation
 */
export const getPromotionListAction = createServerAction()
  .input(ListPromotionsSchema.partial())
  .handler(async ({ input }) => {
    const trpc = await createAuthenticatedTrpcClient()
    return await trpc.promotions.list.query(input)
  })

/**
 * Get a single promotion by ID.
 */
export const getPromotionAction = createServerAction()
  .input(IdParamSchema)
  .handler(async ({ input }) => {
    const trpc = await createAuthenticatedTrpcClient()
    return await trpc.promotions.get.query({ id: input.id })
  })

/**
 * Get promotions for dropdown/select usage.
 * Returns minimal data needed for selection.
 */
export const getPromotionsForSelectAction = createServerAction()
  .handler(async () => {
    const trpc = await createAuthenticatedTrpcClient()
    return await trpc.promotions.listForSelect.query()
  })

/**
 * Create a new promotion.
 * Revalidates promotions list cache after creation.
 */
export const createPromotionAction = createServerAction()
  .input(CreatePromotionSchema)
  .handler(async ({ input }) => {
    const trpc = await createAuthenticatedTrpcClient()
    const promotion = await trpc.promotions.create.mutate(input)
    revalidatePath('/marketing/promotions')
    return promotion
  })

/**
 * Update an existing promotion.
 * Supports partial updates - only provided fields are changed.
 * Revalidates promotions list cache after update.
 */
export const updatePromotionAction = createServerAction()
  .input(z.object({ id: z.string() }).merge(UpdatePromotionBaseSchema))
  .handler(async ({ input }) => {
    const trpc = await createAuthenticatedTrpcClient()
    const promotion = await trpc.promotions.update.mutate(input)
    revalidatePath('/marketing/promotions')
    revalidatePath(`/marketing/promotions/${input.id}`)
    return promotion
  })

/**
 * Delete a promotion.
 * Revalidates promotions list cache after deletion.
 */
export const deletePromotionAction = createServerAction()
  .input(IdParamSchema)
  .handler(async ({ input }): Promise<{ success: boolean }> => {
    const trpc = await createAuthenticatedTrpcClient()
    await trpc.promotions.delete.mutate({ id: input.id })
    revalidatePath('/marketing/promotions')
    return { success: true }
  })

/**
 * Update promotion status (activate/pause/archive).
 * Revalidates promotions list cache after update.
 */
export const updatePromotionStatusAction = createServerAction()
  .input(z.object({ id: z.string(), status: PromotionStatusSchema }))
  .handler(async ({ input }) => {
    const trpc = await createAuthenticatedTrpcClient()
    const promotion = await trpc.promotions.updateStatus.mutate(input)
    revalidatePath('/marketing/promotions')
    revalidatePath(`/marketing/promotions/${input.id}`)
    return promotion
  })

/**
 * Activate a promotion.
 * Revalidates promotions list cache after update.
 */
export const activatePromotionAction = createServerAction()
  .input(IdParamSchema)
  .handler(async ({ input }) => {
    const trpc = await createAuthenticatedTrpcClient()
    const promotion = await trpc.promotions.activate.mutate(input)
    revalidatePath('/marketing/promotions')
    revalidatePath(`/marketing/promotions/${input.id}`)
    return promotion
  })

/**
 * Pause a promotion.
 * Revalidates promotions list cache after update.
 */
export const pausePromotionAction = createServerAction()
  .input(IdParamSchema)
  .handler(async ({ input }) => {
    const trpc = await createAuthenticatedTrpcClient()
    const promotion = await trpc.promotions.pause.mutate(input)
    revalidatePath('/marketing/promotions')
    revalidatePath(`/marketing/promotions/${input.id}`)
    return promotion
  })

/**
 * Archive a promotion.
 * Revalidates promotions list cache after update.
 */
export const archivePromotionAction = createServerAction()
  .input(IdParamSchema)
  .handler(async ({ input }) => {
    const trpc = await createAuthenticatedTrpcClient()
    const promotion = await trpc.promotions.archive.mutate(input)
    revalidatePath('/marketing/promotions')
    revalidatePath(`/marketing/promotions/${input.id}`)
    return promotion
  })
