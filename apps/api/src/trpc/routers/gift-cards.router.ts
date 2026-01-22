/**
 * tRPC Router for Gift Cards
 *
 * All mutations require `settings:update` permission (marketing settings).
 * All queries require `settings:read` permission.
 *
 * @see Story 3.10 - Gift Cards
 */
import { TRPCError } from '@trpc/server';
import { z } from '@trafi/zod';
import { router, publicProcedure, isAuthed } from '../trpc';
import {
  IssueGiftCardSchema,
  ValidateGiftCardSchema,
  RedeemGiftCardSchema,
  RefundToGiftCardSchema,
  AdjustGiftCardBalanceSchema,
  DisableGiftCardSchema,
  EnableGiftCardSchema,
  GiftCardStatusSchema,
} from '@trafi/validators';

// Local input schema for listing gift cards (all optional)
const ListGiftCardsInputSchema = z.object({
  status: GiftCardStatusSchema.optional(),
  templateId: z.string().cuid().optional(),
  search: z.string().max(50).optional(),
  fromDate: z.date().optional(),
  toDate: z.date().optional(),
  hasBalance: z.boolean().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
});

// Local input schema for listing transactions
const ListTransactionsInputSchema = z.object({
  giftCardId: z.string().cuid(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
});

export const giftCardsRouter = router({
  /**
   * List gift cards with pagination and filters.
   * Requires `settings:read` permission.
   */
  list: publicProcedure
    .use(isAuthed)
    .input(ListGiftCardsInputSchema.optional())
    .query(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('settings:read');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        return await ctx.services.giftCardsService.list(ctx.storeId, input ?? {});
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to list gift cards',
        });
      }
    }),

  /**
   * Get a single gift card by ID.
   * Requires `settings:read` permission.
   */
  get: publicProcedure
    .use(isAuthed)
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('settings:read');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        return await ctx.services.giftCardsService.findById(ctx.storeId, input.id);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (error instanceof Error && error.message === 'Gift card not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Gift card not found',
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get gift card',
        });
      }
    }),

  /**
   * Get transactions for a gift card.
   * Requires `settings:read` permission.
   */
  getTransactions: publicProcedure
    .use(isAuthed)
    .input(ListTransactionsInputSchema)
    .query(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('settings:read');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        const { giftCardId, ...options } = input;
        return await ctx.services.giftCardsService.getTransactions(
          ctx.storeId,
          giftCardId,
          options
        );
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (error instanceof Error && error.message === 'Gift card not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Gift card not found',
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get transactions',
        });
      }
    }),

  /**
   * Issue a new gift card.
   * Requires `settings:update` permission.
   */
  issue: publicProcedure
    .use(isAuthed)
    .input(IssueGiftCardSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('settings:update');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        return await ctx.services.giftCardsService.issue(ctx.storeId, input, ctx.userId);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to issue gift card',
        });
      }
    }),

  /**
   * Validate a gift card code (check balance).
   * Requires `settings:read` permission.
   */
  validate: publicProcedure
    .use(isAuthed)
    .input(ValidateGiftCardSchema)
    .query(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('settings:read');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        return await ctx.services.giftCardsService.validateCode(ctx.storeId, input.code);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to validate gift card',
        });
      }
    }),

  /**
   * Redeem a gift card (use for purchase).
   * Requires `settings:update` permission.
   */
  redeem: publicProcedure
    .use(isAuthed)
    .input(RedeemGiftCardSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('settings:update');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        return await ctx.services.giftCardsService.redeem(ctx.storeId, input);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to redeem gift card',
        });
      }
    }),

  /**
   * Refund to a gift card.
   * Requires `settings:update` permission.
   */
  refund: publicProcedure
    .use(isAuthed)
    .input(RefundToGiftCardSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('settings:update');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        return await ctx.services.giftCardsService.refund(ctx.storeId, input, ctx.userId);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to refund to gift card',
        });
      }
    }),

  /**
   * Manually adjust gift card balance.
   * Requires `settings:update` permission.
   */
  adjustBalance: publicProcedure
    .use(isAuthed)
    .input(AdjustGiftCardBalanceSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('settings:update');

        if (!ctx.storeId || !ctx.userId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store and user context required',
          });
        }

        return await ctx.services.giftCardsService.adjustBalance(ctx.storeId, input, ctx.userId);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to adjust balance',
        });
      }
    }),

  /**
   * Disable a gift card.
   * Requires `settings:update` permission.
   */
  disable: publicProcedure
    .use(isAuthed)
    .input(DisableGiftCardSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('settings:update');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        return await ctx.services.giftCardsService.disable(
          ctx.storeId,
          input.giftCardId,
          input.reason
        );
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to disable gift card',
        });
      }
    }),

  /**
   * Enable a disabled gift card.
   * Requires `settings:update` permission.
   */
  enable: publicProcedure
    .use(isAuthed)
    .input(EnableGiftCardSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('settings:update');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        return await ctx.services.giftCardsService.enable(ctx.storeId, input.giftCardId);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to enable gift card',
        });
      }
    }),
});

export type GiftCardsRouter = typeof giftCardsRouter;
