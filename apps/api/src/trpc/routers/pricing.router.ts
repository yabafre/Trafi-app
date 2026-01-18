/**
 * tRPC Router for Pricing Calculations
 *
 * Provides tax calculation, margin calculation, and price formatting utilities.
 * These are pure calculation endpoints, not data mutations.
 *
 * @see Story 3.6 - Product Pricing and Tax Rules
 */
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, isAuthed } from '../trpc';
import { CalculateTaxSchema, CalculateMarginSchema, FormatPriceSchema } from '@trafi/validators';

export const pricingRouter = router({
  /**
   * Calculate tax from a price.
   * Requires `products:read` permission.
   */
  calculateTax: publicProcedure
    .use(isAuthed)
    .input(CalculateTaxSchema)
    .query(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('products:read');

        return ctx.services.pricingService.calculateTax(input);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to calculate tax',
        });
      }
    }),

  /**
   * Calculate profit margin.
   * Requires `products:read` permission.
   */
  calculateMargin: publicProcedure
    .use(isAuthed)
    .input(CalculateMarginSchema)
    .query(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('products:read');

        return ctx.services.pricingService.calculateMargin(input);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to calculate margin',
        });
      }
    }),

  /**
   * Format price as localized currency string.
   * Requires `products:read` permission.
   */
  formatPrice: publicProcedure
    .use(isAuthed)
    .input(FormatPriceSchema)
    .query(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('products:read');

        return { formatted: ctx.services.pricingService.formatPriceFromInput(input) };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to format price',
        });
      }
    }),
});

export type PricingRouter = typeof pricingRouter;
