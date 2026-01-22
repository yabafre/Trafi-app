'use server'

import { revalidatePath } from 'next/cache'
import { createServerAction } from 'zsa'
import { z } from '@trafi/zod'
import { createAuthenticatedTrpcClient } from '@/lib/trpc'
import {
  IssueGiftCardSchema,
  AdjustGiftCardBalanceSchema,
  GiftCardStatusSchema,
} from '@trafi/validators'

// Local schema for listing gift cards
const ListGiftCardsInputSchema = z.object({
  status: GiftCardStatusSchema.optional(),
  templateId: z.string().cuid().optional(),
  search: z.string().max(50).optional(),
  fromDate: z.date().optional(),
  toDate: z.date().optional(),
  hasBalance: z.boolean().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
})

// Local schema for getting transactions
const ListTransactionsInputSchema = z.object({
  giftCardId: z.string().cuid(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
})

/**
 * List gift cards with pagination and filters.
 * Returns paginated list.
 *
 * @see Story 3.10 - Gift Cards
 */
export const getGiftCardListAction = createServerAction()
  .input(ListGiftCardsInputSchema.partial())
  .handler(async ({ input }) => {
    const trpc = await createAuthenticatedTrpcClient()
    return await trpc.giftCards.list.query(input)
  })

/**
 * Get a single gift card by ID.
 */
export const getGiftCardAction = createServerAction()
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    const trpc = await createAuthenticatedTrpcClient()
    return await trpc.giftCards.get.query({ id: input.id })
  })

/**
 * Get transactions for a gift card.
 */
export const getGiftCardTransactionsAction = createServerAction()
  .input(ListTransactionsInputSchema)
  .handler(async ({ input }) => {
    const trpc = await createAuthenticatedTrpcClient()
    return await trpc.giftCards.getTransactions.query(input)
  })

/**
 * Issue a new gift card.
 * Revalidates gift cards list cache after creation.
 */
export const issueGiftCardAction = createServerAction()
  .input(IssueGiftCardSchema)
  .handler(async ({ input }) => {
    const trpc = await createAuthenticatedTrpcClient()
    const giftCard = await trpc.giftCards.issue.mutate(input)
    revalidatePath('/marketing/gift-cards')
    return giftCard
  })

/**
 * Validate a gift card code (check if usable).
 */
export const validateGiftCardAction = createServerAction()
  .input(z.object({ code: z.string().min(1) }))
  .handler(async ({ input }) => {
    const trpc = await createAuthenticatedTrpcClient()
    return await trpc.giftCards.validate.query(input)
  })

/**
 * Adjust gift card balance (admin action).
 * Revalidates gift cards cache after adjustment.
 */
export const adjustGiftCardBalanceAction = createServerAction()
  .input(AdjustGiftCardBalanceSchema)
  .handler(async ({ input }) => {
    const trpc = await createAuthenticatedTrpcClient()
    const result = await trpc.giftCards.adjustBalance.mutate(input)
    revalidatePath('/marketing/gift-cards')
    revalidatePath(`/marketing/gift-cards/${input.giftCardId}`)
    return result
  })

/**
 * Disable a gift card.
 * Revalidates gift cards cache after update.
 */
export const disableGiftCardAction = createServerAction()
  .input(z.object({ giftCardId: z.string().cuid(), reason: z.string().min(1).max(255) }))
  .handler(async ({ input }) => {
    const trpc = await createAuthenticatedTrpcClient()
    const result = await trpc.giftCards.disable.mutate(input)
    revalidatePath('/marketing/gift-cards')
    revalidatePath(`/marketing/gift-cards/${input.giftCardId}`)
    return result
  })

/**
 * Enable a disabled gift card.
 * Revalidates gift cards cache after update.
 */
export const enableGiftCardAction = createServerAction()
  .input(z.object({ giftCardId: z.string().cuid() }))
  .handler(async ({ input }) => {
    const trpc = await createAuthenticatedTrpcClient()
    const result = await trpc.giftCards.enable.mutate(input)
    revalidatePath('/marketing/gift-cards')
    revalidatePath(`/marketing/gift-cards/${input.giftCardId}`)
    return result
  })
