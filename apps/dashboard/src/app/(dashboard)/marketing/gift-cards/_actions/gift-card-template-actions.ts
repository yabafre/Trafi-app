'use server'

import { revalidatePath } from 'next/cache'
import { createServerAction } from 'zsa'
import { createAuthenticatedTrpcClient } from '@/lib/trpc'
import {
  CuidParamSchema,
  ListGiftCardTemplatesSchema,
  CreateGiftCardTemplateSchema,
  UpdateGiftCardTemplateWithIdSchema,
} from '@trafi/validators'

/**
 * List gift card templates with pagination and filters.
 * Returns paginated list.
 *
 * @see Story 3.10 - Gift Cards (AC1, AC6)
 */
export const getGiftCardTemplateListAction = createServerAction()
  .input(ListGiftCardTemplatesSchema.partial())
  .handler(async ({ input }) => {
    const trpc = await createAuthenticatedTrpcClient()
    return await trpc.giftCardTemplates.list.query(input)
  })

/**
 * Get templates for dropdown/select usage.
 * Returns minimal data needed for selection (active only).
 */
export const getGiftCardTemplatesForSelectAction = createServerAction()
  .handler(async () => {
    const trpc = await createAuthenticatedTrpcClient()
    return await trpc.giftCardTemplates.listForSelect.query()
  })

/**
 * Get a single template by ID.
 */
export const getGiftCardTemplateAction = createServerAction()
  .input(CuidParamSchema)
  .handler(async ({ input }) => {
    const trpc = await createAuthenticatedTrpcClient()
    return await trpc.giftCardTemplates.get.query({ id: input.id })
  })

/**
 * Create a new gift card template.
 * Revalidates templates list cache after creation.
 */
export const createGiftCardTemplateAction = createServerAction()
  .input(CreateGiftCardTemplateSchema)
  .handler(async ({ input }) => {
    const trpc = await createAuthenticatedTrpcClient()
    const template = await trpc.giftCardTemplates.create.mutate(input)
    revalidatePath('/marketing/gift-cards')
    return template
  })

/**
 * Update an existing template.
 * Revalidates templates cache after update.
 */
export const updateGiftCardTemplateAction = createServerAction()
  .input(UpdateGiftCardTemplateWithIdSchema)
  .handler(async ({ input }) => {
    const trpc = await createAuthenticatedTrpcClient()
    const template = await trpc.giftCardTemplates.update.mutate(input)
    revalidatePath('/marketing/gift-cards')
    return template
  })

/**
 * Delete a template.
 * Revalidates templates cache after deletion.
 */
export const deleteGiftCardTemplateAction = createServerAction()
  .input(CuidParamSchema)
  .handler(async ({ input }): Promise<{ success: boolean }> => {
    const trpc = await createAuthenticatedTrpcClient()
    await trpc.giftCardTemplates.delete.mutate({ id: input.id })
    revalidatePath('/marketing/gift-cards')
    return { success: true }
  })

/**
 * Activate a template.
 * Revalidates templates cache after update.
 */
export const activateGiftCardTemplateAction = createServerAction()
  .input(CuidParamSchema)
  .handler(async ({ input }) => {
    const trpc = await createAuthenticatedTrpcClient()
    const template = await trpc.giftCardTemplates.activate.mutate({ id: input.id })
    revalidatePath('/marketing/gift-cards')
    return template
  })

/**
 * Deactivate a template.
 * Revalidates templates cache after update.
 */
export const deactivateGiftCardTemplateAction = createServerAction()
  .input(CuidParamSchema)
  .handler(async ({ input }) => {
    const trpc = await createAuthenticatedTrpcClient()
    const template = await trpc.giftCardTemplates.deactivate.mutate({ id: input.id })
    revalidatePath('/marketing/gift-cards')
    return template
  })
