/**
 * tRPC Router for Tax Rules
 *
 * All mutations require `settings:update` permission.
 * All queries require `settings:read` permission.
 *
 * @see Story 3.6 - Product Pricing and Tax Rules
 */
import { TRPCError } from '@trpc/server';
import { z } from '@trafi/zod';
import { router, publicProcedure, isAuthed } from '../trpc';
import {
  CreateTaxRuleSchema,
  UpdateTaxRuleSchema,
  ListTaxRulesSchema,
  SetDefaultTaxRuleSchema,
} from '@trafi/validators';

export const taxRulesRouter = router({
  /**
   * List tax rules with pagination and filters.
   * Requires `settings:read` permission.
   */
  list: publicProcedure
    .use(isAuthed)
    .input(ListTaxRulesSchema.partial())
    .query(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('settings:read');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        return await ctx.services.taxRulesService.list(ctx.storeId, input);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to list tax rules',
        });
      }
    }),

  /**
   * Get a single tax rule by ID.
   * Requires `settings:read` permission.
   */
  get: publicProcedure
    .use(isAuthed)
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('settings:read');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        return await ctx.services.taxRulesService.findById(ctx.storeId, input.id);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (error instanceof Error && error.message === 'Tax rule not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Tax rule not found',
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get tax rule',
        });
      }
    }),

  /**
   * Get the default tax rule for the store.
   * Optionally filter by country code.
   * Requires `settings:read` permission.
   */
  getDefault: publicProcedure
    .use(isAuthed)
    .input(z.object({ countryCode: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('settings:read');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        return await ctx.services.taxRulesService.getDefaultTaxRule(
          ctx.storeId,
          input.countryCode,
        );
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get default tax rule',
        });
      }
    }),

  /**
   * List tax rules for dropdown/select.
   * Requires `products:read` permission (for product forms).
   */
  listForSelect: publicProcedure
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

        return await ctx.services.taxRulesService.listForSelect(ctx.storeId);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to list tax rules',
        });
      }
    }),

  /**
   * Create a new tax rule.
   * Requires `settings:update` permission.
   */
  create: publicProcedure
    .use(isAuthed)
    .input(CreateTaxRuleSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('settings:update');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        return await ctx.services.taxRulesService.create(ctx.storeId, input);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (error instanceof Error && error.message.includes('already exists')) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: error.message,
          });
        }
        if (error instanceof Error && error.message.includes('Invalid country code')) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create tax rule',
        });
      }
    }),

  /**
   * Update an existing tax rule.
   * Requires `settings:update` permission.
   */
  update: publicProcedure
    .use(isAuthed)
    .input(UpdateTaxRuleSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('settings:update');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        return await ctx.services.taxRulesService.update(ctx.storeId, input);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (error instanceof Error && error.message === 'Tax rule not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Tax rule not found',
          });
        }
        if (error instanceof Error && error.message.includes('already exists')) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: error.message,
          });
        }
        if (error instanceof Error && error.message.includes('Invalid country code')) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update tax rule',
        });
      }
    }),

  /**
   * Delete a tax rule.
   * Will fail if tax rule is assigned to any variants.
   * Requires `settings:update` permission.
   */
  delete: publicProcedure
    .use(isAuthed)
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('settings:update');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        await ctx.services.taxRulesService.delete(ctx.storeId, input.id);
        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (error instanceof Error && error.message === 'Tax rule not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Tax rule not found',
          });
        }
        if (error instanceof Error && error.message.includes('Cannot delete')) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: error.message,
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to delete tax rule',
        });
      }
    }),

  /**
   * Set a tax rule as the default for the store.
   * Requires `settings:update` permission.
   */
  setDefault: publicProcedure
    .use(isAuthed)
    .input(SetDefaultTaxRuleSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('settings:update');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        return await ctx.services.taxRulesService.setDefaultTaxRule(ctx.storeId, input.id);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (error instanceof Error && error.message === 'Tax rule not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Tax rule not found',
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to set default tax rule',
        });
      }
    }),
});

export type TaxRulesRouter = typeof taxRulesRouter;
