/**
 * tRPC Router for Product Variants
 *
 * All mutations require `products:update` permission (variants are a sub-resource of products).
 * All queries require `products:read` permission.
 *
 * @see Story 3.2 - Product Variants Management
 */
import { TRPCError } from '@trpc/server';
import { z } from '@trafi/zod';
import { router, publicProcedure, isAuthed } from '../trpc';
import {
  CreateVariantSchema,
  UpdateVariantSchema,
  BulkCreateVariantsSchema,
  ListVariantsSchema,
  UpdateVariantPricingSchema,
} from '@trafi/validators';

export const variantsRouter = router({
  /**
   * Create a single variant for a product.
   * Requires `products:update` permission.
   */
  create: publicProcedure
    .use(isAuthed)
    .input(CreateVariantSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('products:update');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        return await ctx.services.variantsService.create(ctx.storeId, input);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (error instanceof Error && error.message === 'Product not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Product not found',
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
          message: error instanceof Error ? error.message : 'Failed to create variant',
        });
      }
    }),

  /**
   * Bulk create variants from option type combinations.
   * Requires `products:update` permission.
   */
  bulkCreate: publicProcedure
    .use(isAuthed)
    .input(BulkCreateVariantsSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('products:update');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        return await ctx.services.variantsService.bulkCreate(ctx.storeId, input);
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
          message: error instanceof Error ? error.message : 'Failed to bulk create variants',
        });
      }
    }),

  /**
   * Update an existing variant.
   * Requires `products:update` permission.
   */
  update: publicProcedure
    .use(isAuthed)
    .input(UpdateVariantSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('products:update');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        return await ctx.services.variantsService.update(ctx.storeId, input);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (error instanceof Error && error.message === 'Variant not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Variant not found',
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
          message: error instanceof Error ? error.message : 'Failed to update variant',
        });
      }
    }),

  /**
   * Delete a variant.
   * Cannot delete the last variant of a product.
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

        await ctx.services.variantsService.delete(ctx.storeId, input.id);
        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (error instanceof Error && error.message === 'Variant not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Variant not found',
          });
        }
        if (error instanceof Error && error.message.includes('Cannot delete the last variant')) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to delete variant',
        });
      }
    }),

  /**
   * List all variants for a product.
   * Requires `products:read` permission.
   */
  list: publicProcedure
    .use(isAuthed)
    .input(ListVariantsSchema)
    .query(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('products:read');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        return await ctx.services.variantsService.listByProduct(ctx.storeId, input.productId);
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
          message: error instanceof Error ? error.message : 'Failed to list variants',
        });
      }
    }),

  /**
   * Update only the pricing fields of a variant.
   * Requires `products:update` permission.
   * @see Story 3.6 - Product Pricing and Tax Rules
   */
  updatePricing: publicProcedure
    .use(isAuthed)
    .input(UpdateVariantPricingSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('products:update');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        return await ctx.services.variantsService.updatePricing(ctx.storeId, input);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (error instanceof Error && error.message === 'Variant not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Variant not found',
          });
        }
        if (error instanceof Error && error.message === 'Tax rule not found') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update variant pricing',
        });
      }
    }),

  /**
   * Get a single variant by ID.
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

        return await ctx.services.variantsService.findById(ctx.storeId, input.id);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (error instanceof Error && error.message === 'Variant not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Variant not found',
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get variant',
        });
      }
    }),
});

export type VariantsRouter = typeof variantsRouter;
