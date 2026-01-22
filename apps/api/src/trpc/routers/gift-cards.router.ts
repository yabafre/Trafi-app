/**
 * tRPC Router for Gift Cards
 *
 * All mutations require `settings:update` permission (marketing settings).
 * All queries require `settings:read` permission.
 *
 * @see Story 3.10 - Gift Cards
 */
import { router, publicProcedure, isAuthed } from '../trpc'
import { storeQuery, storeMutation } from '../helpers'
import {
  CuidParamSchema,
  ListGiftCardsSchema,
  ListGiftCardTransactionsSchema,
  IssueGiftCardSchema,
  ValidateGiftCardSchema,
  RedeemGiftCardSchema,
  RefundToGiftCardSchema,
  AdjustGiftCardBalanceSchema,
  DisableGiftCardSchema,
  EnableGiftCardSchema,
} from '@trafi/validators'

export const giftCardsRouter = router({
  /** List gift cards with pagination and filters */
  list: publicProcedure
    .use(isAuthed)
    .input(ListGiftCardsSchema.optional())
    .query(storeQuery('settings:read', (ctx, input) =>
      ctx.services.giftCardsService.list(ctx.storeId, input ?? {})
    )),

  /** Get a single gift card by ID */
  get: publicProcedure
    .use(isAuthed)
    .input(CuidParamSchema)
    .query(storeQuery('settings:read', (ctx, input) =>
      ctx.services.giftCardsService.findById(ctx.storeId, input.id)
    )),

  /** Get transactions for a gift card */
  getTransactions: publicProcedure
    .use(isAuthed)
    .input(ListGiftCardTransactionsSchema)
    .query(storeQuery('settings:read', (ctx, input) => {
      const { giftCardId, ...options } = input
      return ctx.services.giftCardsService.getTransactions(ctx.storeId, giftCardId, options)
    })),

  /** Issue a new gift card */
  issue: publicProcedure
    .use(isAuthed)
    .input(IssueGiftCardSchema)
    .mutation(storeMutation('settings:update', (ctx, input) =>
      ctx.services.giftCardsService.issue(ctx.storeId, input, ctx.userId)
    )),

  /** Validate a gift card code (check balance) */
  validate: publicProcedure
    .use(isAuthed)
    .input(ValidateGiftCardSchema)
    .query(storeQuery('settings:read', (ctx, input) =>
      ctx.services.giftCardsService.validateCode(ctx.storeId, input.code)
    )),

  /** Redeem a gift card (use for purchase) */
  redeem: publicProcedure
    .use(isAuthed)
    .input(RedeemGiftCardSchema)
    .mutation(storeMutation('settings:update', (ctx, input) =>
      ctx.services.giftCardsService.redeem(ctx.storeId, input)
    )),

  /** Refund to a gift card */
  refund: publicProcedure
    .use(isAuthed)
    .input(RefundToGiftCardSchema)
    .mutation(storeMutation('settings:update', (ctx, input) =>
      ctx.services.giftCardsService.refund(ctx.storeId, input, ctx.userId)
    )),

  /** Manually adjust gift card balance */
  adjustBalance: publicProcedure
    .use(isAuthed)
    .input(AdjustGiftCardBalanceSchema)
    .mutation(storeMutation('settings:update', (ctx, input) =>
      ctx.services.giftCardsService.adjustBalance(ctx.storeId, input, ctx.userId!)
    )),

  /** Disable a gift card */
  disable: publicProcedure
    .use(isAuthed)
    .input(DisableGiftCardSchema)
    .mutation(storeMutation('settings:update', (ctx, input) =>
      ctx.services.giftCardsService.disable(ctx.storeId, input.giftCardId, input.reason)
    )),

  /** Enable a disabled gift card */
  enable: publicProcedure
    .use(isAuthed)
    .input(EnableGiftCardSchema)
    .mutation(storeMutation('settings:update', (ctx, input) =>
      ctx.services.giftCardsService.enable(ctx.storeId, input.giftCardId)
    )),
})

export type GiftCardsRouter = typeof giftCardsRouter
