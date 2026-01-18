/**
 * tRPC Router for Collections
 *
 * All mutations require `products:update` permission.
 * All queries require `products:read` permission.
 *
 * @see Story 3.5 - Collections Management
 */
import { TRPCError } from '@trpc/server';
import { z } from '@trafi/zod';
import { router, publicProcedure, isAuthed } from '../trpc';
import {
  CreateCollectionSchema,
  UpdateCollectionSchema,
  AddProductsToCollectionSchema,
  RemoveProductsFromCollectionSchema,
  ReorderCollectionProductsSchema,
  ListCollectionsSchema,
} from '@trafi/validators';

export const collectionsRouter = router({
  /**
   * List collections with pagination and filters.
   * Requires `products:read` permission.
   */
  list: publicProcedure
    .use(isAuthed)
    .input(ListCollectionsSchema.partial())
    .query(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('products:read');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        return await ctx.services.collectionsService.list(ctx.storeId, input);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to list collections',
        });
      }
    }),

  /**
   * Get a single collection by ID (without products).
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

        return await ctx.services.collectionsService.findById(ctx.storeId, input.id);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (error instanceof Error && error.message === 'Collection not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Collection not found',
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get collection',
        });
      }
    }),

  /**
   * Get a single collection by ID with its products.
   * Requires `products:read` permission.
   */
  getWithProducts: publicProcedure
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

        return await ctx.services.collectionsService.findByIdWithProducts(ctx.storeId, input.id);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (error instanceof Error && error.message === 'Collection not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Collection not found',
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get collection',
        });
      }
    }),

  /**
   * Create a new collection.
   * Requires `products:update` permission.
   */
  create: publicProcedure
    .use(isAuthed)
    .input(CreateCollectionSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('products:update');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        return await ctx.services.collectionsService.create(ctx.storeId, input);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (error instanceof Error && error.message.includes('already exists')) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: error.message,
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create collection',
        });
      }
    }),

  /**
   * Update an existing collection.
   * Requires `products:update` permission.
   */
  update: publicProcedure
    .use(isAuthed)
    .input(UpdateCollectionSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('products:update');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        return await ctx.services.collectionsService.update(ctx.storeId, input);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (error instanceof Error && error.message === 'Collection not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Collection not found',
          });
        }
        if (error instanceof Error && error.message.includes('already exists')) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: error.message,
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update collection',
        });
      }
    }),

  /**
   * Delete a collection.
   * Products are NOT deleted, only the collection is removed.
   * Requires `products:delete` permission.
   */
  delete: publicProcedure
    .use(isAuthed)
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('products:delete');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        await ctx.services.collectionsService.delete(ctx.storeId, input.id);
        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (error instanceof Error && error.message === 'Collection not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Collection not found',
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to delete collection',
        });
      }
    }),

  /**
   * Add products to a collection.
   * Requires `products:update` permission.
   */
  addProducts: publicProcedure
    .use(isAuthed)
    .input(AddProductsToCollectionSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('products:update');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        await ctx.services.collectionsService.addProducts(ctx.storeId, input);
        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (error instanceof Error && error.message === 'Collection not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Collection not found',
          });
        }
        if (error instanceof Error && error.message === 'One or more products not found') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to add products',
        });
      }
    }),

  /**
   * Remove products from a collection.
   * Requires `products:update` permission.
   */
  removeProducts: publicProcedure
    .use(isAuthed)
    .input(RemoveProductsFromCollectionSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('products:update');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        await ctx.services.collectionsService.removeProducts(ctx.storeId, input);
        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (error instanceof Error && error.message === 'Collection not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Collection not found',
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to remove products',
        });
      }
    }),

  /**
   * Reorder products within a collection.
   * Requires `products:update` permission.
   */
  reorderProducts: publicProcedure
    .use(isAuthed)
    .input(ReorderCollectionProductsSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('products:update');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        await ctx.services.collectionsService.reorderProducts(ctx.storeId, input);
        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (error instanceof Error && error.message === 'Collection not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Collection not found',
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to reorder products',
        });
      }
    }),

  /**
   * Get collections for a specific product.
   * Requires `products:read` permission.
   */
  forProduct: publicProcedure
    .use(isAuthed)
    .input(z.object({ productId: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('products:read');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        return await ctx.services.collectionsService.getCollectionsForProduct(
          ctx.storeId,
          input.productId,
        );
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get product collections',
        });
      }
    }),

  /**
   * Get product count for a collection.
   * Requires `products:read` permission.
   */
  productCount: publicProcedure
    .use(isAuthed)
    .input(z.object({ collectionId: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('products:read');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        const count = await ctx.services.collectionsService.getProductCount(
          ctx.storeId,
          input.collectionId,
        );
        return { count };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (error instanceof Error && error.message === 'Collection not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Collection not found',
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get product count',
        });
      }
    }),
});

export type CollectionsRouter = typeof collectionsRouter;
