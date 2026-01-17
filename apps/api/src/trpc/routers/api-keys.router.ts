/**
 * API Keys Router - tRPC procedures for API key management
 *
 * Exposes list, create, and revoke procedures.
 * Uses existing ApiKeysService for business logic.
 *
 * @see Story 2.5 - API Key Management
 * @see Story 2.6 - Tenant-Scoped Authorization
 */
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, isAuthed } from '../trpc';
import { ListApiKeysSchema, CreateApiKeySchema } from '@trafi/validators';
import { z } from '@trafi/zod';

export const apiKeysRouter = router({
  /**
   * List API keys for the current store
   * Requires authentication
   */
  list: publicProcedure
    .use(isAuthed)
    .input(ListApiKeysSchema)
    .query(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('api-keys:read');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        return await ctx.services.apiKeysService.list(ctx.storeId, input);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to list API keys',
        });
      }
    }),

  /**
   * Create a new API key
   * Returns the full key ONLY in this response
   * Requires authentication and api-keys:manage permission
   */
  create: publicProcedure
    .use(isAuthed)
    .input(CreateApiKeySchema)
    .mutation(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('api-keys:manage');

        if (!ctx.storeId || !ctx.userId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store and user context required',
          });
        }

        return await ctx.services.apiKeysService.create(
          ctx.storeId,
          ctx.userId,
          input
        );
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create API key',
        });
      }
    }),

  /**
   * Revoke an API key
   * Requires authentication and api-keys:manage permission
   */
  revoke: publicProcedure
    .use(isAuthed)
    .input(z.object({ keyId: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('api-keys:manage');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        return await ctx.services.apiKeysService.revoke(ctx.storeId, input.keyId);
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
          message: error instanceof Error ? error.message : 'Failed to revoke API key',
        });
      }
    }),
});

export type ApiKeysRouter = typeof apiKeysRouter;
