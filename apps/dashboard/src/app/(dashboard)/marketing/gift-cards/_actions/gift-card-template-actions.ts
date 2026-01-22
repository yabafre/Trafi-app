'use server'

import { revalidatePath } from 'next/cache'
import { createServerAction } from 'zsa'
import { z } from '@trafi/zod'
import { createAuthenticatedTrpcClient } from '@/lib/trpc'
import { CreateGiftCardTemplateSchema } from '@trafi/validators'

// Local schema for listing templates
const ListTemplatesInputSchema = z.object({
  isActive: z.boolean().optional(),
  search: z.string().max(100).optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
})

// Local update schema (inline to avoid ZodEffects issue)
const UpdateGiftCardTemplateInputSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullish(),
  designImageUrl: z.string().url().nullish(),
  denominations: z.array(z.number().int().positive()).min(1).max(20).optional(),
  allowCustomAmount: z.boolean().optional(),
  minAmountCents: z.number().int().positive().nullish(),
  maxAmountCents: z.number().int().positive().nullish(),
  validityDays: z.number().int().positive().max(3650).nullish(),
  isActive: z.boolean().optional(),
})

/**
 * List gift card templates with pagination and filters.
 * Returns paginated list.
 *
 * @see Story 3.10 - Gift Cards (AC1, AC6)
 */
export const getGiftCardTemplateListAction = createServerAction()
  .input(ListTemplatesInputSchema.partial())
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
  .input(z.object({ id: z.string().cuid() }))
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
  .input(UpdateGiftCardTemplateInputSchema)
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
  .input(z.object({ id: z.string().cuid() }))
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
  .input(z.object({ id: z.string().cuid() }))
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
  .input(z.object({ id: z.string().cuid() }))
  .handler(async ({ input }) => {
    const trpc = await createAuthenticatedTrpcClient()
    const template = await trpc.giftCardTemplates.deactivate.mutate({ id: input.id })
    revalidatePath('/marketing/gift-cards')
    return template
  })
