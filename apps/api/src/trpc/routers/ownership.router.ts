/**
 * Ownership Router - tRPC procedures for ownership transfer management
 *
 * Exposes initiate, confirm, cancel, getPending, and getHistory procedures.
 * Uses existing OwnershipService for business logic.
 *
 * @see Story 2.8 - Ownership Transfer
 */
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, isAuthed } from '../trpc';
import {
  InitiateTransferSchema,
  ConfirmTransferSchema,
  CancelTransferSchema,
} from '@trafi/validators';

export const ownershipRouter = router({
  /**
   * Get pending ownership transfer for current user
   * Returns null if no pending transfer exists
   */
  getPending: publicProcedure
    .use(isAuthed)
    .query(async ({ ctx }) => {
      try {
        if (!ctx.storeId || !ctx.userId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store and user context required',
          });
        }

        return await ctx.services.ownershipService.getPending(ctx.storeId, ctx.userId);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get pending transfer',
        });
      }
    }),

  /**
   * Get transfer history for the store
   * Only accessible by store Owner
   */
  getHistory: publicProcedure
    .use(isAuthed)
    .query(async ({ ctx }) => {
      try {
        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        return await ctx.services.ownershipService.getHistory(ctx.storeId);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get transfer history',
        });
      }
    }),

  /**
   * Initiate an ownership transfer
   * Requires current owner password for confirmation
   * Only Owner role can initiate
   */
  initiate: publicProcedure
    .use(isAuthed)
    .input(InitiateTransferSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // Only Owner can initiate transfers
        if (ctx.role?.toUpperCase() !== 'OWNER') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only store owner can initiate transfers',
          });
        }

        if (!ctx.storeId || !ctx.userId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store and user context required',
          });
        }

        return await ctx.services.ownershipService.initiate(
          ctx.storeId,
          ctx.userId,
          input
        );
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (error instanceof Error && error.message.includes('Invalid password')) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Invalid password',
          });
        }
        if (error instanceof Error && error.message.includes('already pending')) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: error.message,
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to initiate transfer',
        });
      }
    }),

  /**
   * Confirm an ownership transfer
   * Only the target user can confirm with their password
   */
  confirm: publicProcedure
    .use(isAuthed)
    .input(ConfirmTransferSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        if (!ctx.storeId || !ctx.userId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store and user context required',
          });
        }

        return await ctx.services.ownershipService.confirm(
          ctx.storeId,
          ctx.userId,
          input
        );
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (error instanceof Error && error.message.includes('Invalid password')) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Invalid password',
          });
        }
        if (error instanceof Error && error.message.includes('not found')) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: error.message,
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to confirm transfer',
        });
      }
    }),

  /**
   * Cancel an ownership transfer
   * Both the initiator and target can cancel
   */
  cancel: publicProcedure
    .use(isAuthed)
    .input(CancelTransferSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        if (!ctx.storeId || !ctx.userId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store and user context required',
          });
        }

        return await ctx.services.ownershipService.cancel(
          ctx.storeId,
          ctx.userId,
          input.transferId
        );
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (error instanceof Error && error.message.includes('not found')) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: error.message,
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to cancel transfer',
        });
      }
    }),
});

export type OwnershipRouter = typeof ownershipRouter;
