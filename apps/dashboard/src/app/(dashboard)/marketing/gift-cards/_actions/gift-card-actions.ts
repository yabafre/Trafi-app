'use server'

import { revalidatePath } from 'next/cache'
import { createServerAction } from 'zsa'
import { z } from '@trafi/zod'
import { createAuthenticatedTrpcClient } from '@/lib/trpc'
import {
  IdParamSchema,
  ListGiftCardsSchema,
  ListGiftCardTransactionsSchema,
  IssueGiftCardSchema,
  AdjustGiftCardBalanceSchema,
  DisableGiftCardSchema,
  EnableGiftCardSchema,
} from '@trafi/validators'

/**
 * List gift cards with pagination and filters.
 * Returns paginated list.
 *
 * @see Story 3.10 - Gift Cards
 */
export const getGiftCardListAction = createServerAction()
  .input(ListGiftCardsSchema.partial())
  .handler(async ({ input }) => {
    const trpc = await createAuthenticatedTrpcClient()
    return await trpc.giftCards.list.query(input)
  })

/**
 * Get a single gift card by ID.
 */
export const getGiftCardAction = createServerAction()
  .input(IdParamSchema)
  .handler(async ({ input }) => {
    const trpc = await createAuthenticatedTrpcClient()
    return await trpc.giftCards.get.query({ id: input.id })
  })

/**
 * Get transactions for a gift card.
 */
export const getGiftCardTransactionsAction = createServerAction()
  .input(ListGiftCardTransactionsSchema)
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
  .input(DisableGiftCardSchema)
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
  .input(EnableGiftCardSchema)
  .handler(async ({ input }) => {
    const trpc = await createAuthenticatedTrpcClient()
    const result = await trpc.giftCards.enable.mutate(input)
    revalidatePath('/marketing/gift-cards')
    revalidatePath(`/marketing/gift-cards/${input.giftCardId}`)
    return result
  })
