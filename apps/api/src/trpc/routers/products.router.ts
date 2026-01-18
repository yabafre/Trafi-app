/**
 * Products Router - tRPC procedures for product catalog management
 *
 * Exposes CRUD procedures for products with tenant isolation.
 * Uses ProductsService for business logic.
 *
 * Permission requirements:
 * - products:read: View products (list, get)
 * - products:create: Create products
 * - products:update: Update products
 * - products:delete: Delete products
 *
 * @see Story 3.1 - Product Model and Basic CRUD
 */
import { TRPCError } from '@trpc/server';
import { z } from '@trafi/zod';
import { router, publicProcedure, isAuthed } from '../trpc';
import {
  CreateProductSchema,
  UpdateProductSchema,
  ListProductsSchema,
} from '@trafi/validators';

export const productsRouter = router({
  /**
   * List products with pagination and filtering
   * Requires authentication and products:read permission
   */
  list: publicProcedure
    .use(isAuthed)
    .input(ListProductsSchema)
    .query(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('products:read');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        return await ctx.services.productsService.list(ctx.storeId, input);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to list products',
        });
      }
    }),

  /**
   * Get a single product by ID
   * Requires authentication and products:read permission
   * Returns 404 for products not found or belonging to different tenant
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

        return await ctx.services.productsService.findById(ctx.storeId, input.id);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        // Convert NotFoundException to NOT_FOUND
        if (error instanceof Error && error.message === 'Product not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Product not found',
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get product',
        });
      }
    }),

  /**
   * Create a new product
   * Requires authentication and products:create permission
   * Auto-generates slug from name if not provided
   */
  create: publicProcedure
    .use(isAuthed)
    .input(CreateProductSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('products:create');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        return await ctx.services.productsService.create(ctx.storeId, input);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        // Convert ConflictException to CONFLICT
        if (error instanceof Error && error.message.includes('already exists')) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: error.message,
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create product',
        });
      }
    }),

  /**
   * Update an existing product
   * Requires authentication and products:update permission
   * Supports partial updates
   */
  update: publicProcedure
    .use(isAuthed)
    .input(
      z.object({
        id: z.string(),
        data: UpdateProductSchema,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('products:update');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        return await ctx.services.productsService.update(ctx.storeId, input.id, input.data);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        // Convert NotFoundException to NOT_FOUND
        if (error instanceof Error && error.message === 'Product not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Product not found',
          });
        }
        // Convert ConflictException to CONFLICT
        if (error instanceof Error && error.message.includes('already exists')) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: error.message,
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update product',
        });
      }
    }),

  /**
   * Delete a product
   * Requires authentication and products:delete permission
   * Returns success with no content on successful deletion
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

        await ctx.services.productsService.delete(ctx.storeId, input.id);
        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        // Convert NotFoundException to NOT_FOUND
        if (error instanceof Error && error.message === 'Product not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Product not found',
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to delete product',
        });
      }
    }),
});

export type ProductsRouter = typeof productsRouter;
