/**
 * tRPC Router for Product Media
 *
 * All mutations require `products:update` permission (media are a sub-resource of products).
 * All queries require `products:read` permission.
 *
 * Note: File upload is handled via REST endpoint (tRPC doesn't handle multipart well).
 * @see UploadController for file upload functionality.
 *
 * @see Story 3.3 - Product Media Upload
 */
import { TRPCError } from '@trpc/server';
import { z } from '@trafi/zod';
import { router, publicProcedure, isAuthed } from '../trpc';
import {
  UpdateMediaSchema,
  ReorderMediaSchema,
  ListMediaSchema,
} from '@trafi/validators';

export const mediaRouter = router({
  /**
   * Update media metadata (altText, isPrimary).
   * Requires `products:update` permission.
   */
  update: publicProcedure
    .use(isAuthed)
    .input(UpdateMediaSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('products:update');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        return await ctx.services.mediaService.update(ctx.storeId, input);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (error instanceof Error && error.message === 'Media not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Media not found',
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update media',
        });
      }
    }),

  /**
   * Reorder media within a product.
   * First media in the new order becomes primary.
   * Requires `products:update` permission.
   */
  reorder: publicProcedure
    .use(isAuthed)
    .input(ReorderMediaSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('products:update');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        return await ctx.services.mediaService.reorder(ctx.storeId, input);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (error instanceof Error && error.message === 'Product not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Product not found',
          });
        }
        if (error instanceof Error && error.message.includes('not found in product')) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to reorder media',
        });
      }
    }),

  /**
   * Delete a media item.
   * Removes from storage and database.
   * If deleting primary media, next media becomes primary.
   * Requires `products:update` permission.
   */
  delete: publicProcedure
    .use(isAuthed)
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('products:update');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        await ctx.services.mediaService.delete(ctx.storeId, input.id);
        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (error instanceof Error && error.message === 'Media not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Media not found',
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to delete media',
        });
      }
    }),

  /**
   * List all media for a product.
   * Returns media ordered by position.
   * Requires `products:read` permission.
   */
  list: publicProcedure
    .use(isAuthed)
    .input(ListMediaSchema)
    .query(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('products:read');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        return await ctx.services.mediaService.listByProduct(ctx.storeId, input.productId);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (error instanceof Error && error.message === 'Product not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Product not found',
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to list media',
        });
      }
    }),

  /**
   * Get a single media item by ID.
   * Requires `products:read` permission.
   */
  get: publicProcedure
    .use(isAuthed)
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('products:read');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        return await ctx.services.mediaService.findById(ctx.storeId, input.id);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (error instanceof Error && error.message === 'Media not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Media not found',
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get media',
        });
      }
    }),
});

export type MediaRouter = typeof mediaRouter;
