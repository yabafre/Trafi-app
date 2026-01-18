/**
 * tRPC Router for Categories
 *
 * All mutations require `products:update` permission.
 * All queries require `products:read` permission.
 *
 * @see Story 3.4 - Categories Management
 */
import { TRPCError } from '@trpc/server';
import { z } from '@trafi/zod';
import { router, publicProcedure, isAuthed } from '../trpc';
import {
  CreateCategorySchema,
  UpdateCategorySchema,
  ReorderCategorySchema,
  AssignProductsToCategorySchema,
  RemoveProductsFromCategorySchema,
} from '@trafi/validators';

export const categoriesRouter = router({
  /**
   * Get the full category tree for the store.
   * Returns nested structure with children.
   * Requires `products:read` permission.
   */
  tree: publicProcedure
    .use(isAuthed)
    .query(async ({ ctx }) => {
      try {
        ctx.requirePermission('products:read');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        return await ctx.services.categoriesService.getTree(ctx.storeId);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get category tree',
        });
      }
    }),

  /**
   * Get a flat list of categories for selects/dropdowns.
   * Requires `products:read` permission.
   */
  list: publicProcedure
    .use(isAuthed)
    .query(async ({ ctx }) => {
      try {
        ctx.requirePermission('products:read');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        return await ctx.services.categoriesService.listFlat(ctx.storeId);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to list categories',
        });
      }
    }),

  /**
   * Get a single category by ID.
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

        return await ctx.services.categoriesService.findById(ctx.storeId, input.id);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (error instanceof Error && error.message === 'Category not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Category not found',
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get category',
        });
      }
    }),

  /**
   * Create a new category.
   * Requires `products:update` permission.
   */
  create: publicProcedure
    .use(isAuthed)
    .input(CreateCategorySchema)
    .mutation(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('products:update');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        return await ctx.services.categoriesService.create(ctx.storeId, input);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (error instanceof Error && error.message.includes('already exists')) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: error.message,
          });
        }
        if (error instanceof Error && error.message === 'Parent category not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Parent category not found',
          });
        }
        if (error instanceof Error && error.message.includes('Maximum category depth')) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create category',
        });
      }
    }),

  /**
   * Update an existing category.
   * Requires `products:update` permission.
   */
  update: publicProcedure
    .use(isAuthed)
    .input(UpdateCategorySchema)
    .mutation(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('products:update');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        return await ctx.services.categoriesService.update(ctx.storeId, input);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (error instanceof Error && error.message === 'Category not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Category not found',
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
          message: error instanceof Error ? error.message : 'Failed to update category',
        });
      }
    }),

  /**
   * Reorder a category (move to new parent/position).
   * Requires `products:update` permission.
   */
  reorder: publicProcedure
    .use(isAuthed)
    .input(ReorderCategorySchema)
    .mutation(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('products:update');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        return await ctx.services.categoriesService.reorder(ctx.storeId, input);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (error instanceof Error && error.message === 'Category not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Category not found',
          });
        }
        if (error instanceof Error && error.message.includes('Maximum category depth')) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          });
        }
        if (error instanceof Error && error.message.includes('would exceed maximum depth')) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to reorder category',
        });
      }
    }),

  /**
   * Delete a category.
   * Products are NOT deleted, only the category assignment is removed.
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

        await ctx.services.categoriesService.delete(ctx.storeId, input.id);
        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (error instanceof Error && error.message === 'Category not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Category not found',
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to delete category',
        });
      }
    }),

  /**
   * Assign products to a category.
   * Requires `products:update` permission.
   */
  assignProducts: publicProcedure
    .use(isAuthed)
    .input(AssignProductsToCategorySchema)
    .mutation(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('products:update');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        await ctx.services.categoriesService.assignProducts(ctx.storeId, input);
        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (error instanceof Error && error.message === 'Category not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Category not found',
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
          message: error instanceof Error ? error.message : 'Failed to assign products',
        });
      }
    }),

  /**
   * Remove products from a category.
   * Requires `products:update` permission.
   */
  removeProducts: publicProcedure
    .use(isAuthed)
    .input(RemoveProductsFromCategorySchema)
    .mutation(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('products:update');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        await ctx.services.categoriesService.removeProducts(ctx.storeId, input);
        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (error instanceof Error && error.message === 'Category not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Category not found',
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to remove products',
        });
      }
    }),

  /**
   * Get categories for a specific product.
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

        return await ctx.services.categoriesService.getCategoriesForProduct(
          ctx.storeId,
          input.productId,
        );
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get product categories',
        });
      }
    }),

  /**
   * Get product count for a category.
   * Requires `products:read` permission.
   */
  productCount: publicProcedure
    .use(isAuthed)
    .input(z.object({ categoryId: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('products:read');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        const count = await ctx.services.categoriesService.getProductCount(
          ctx.storeId,
          input.categoryId,
        );
        return { count };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (error instanceof Error && error.message === 'Category not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Category not found',
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get product count',
        });
      }
    }),
});

export type CategoriesRouter = typeof categoriesRouter;
