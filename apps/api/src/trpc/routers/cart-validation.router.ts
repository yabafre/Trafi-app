/**
 * tRPC Router for Cart Validation and Inventory Reservations
 *
 * Provides availability checks, cart validation, and inventory reservations
 * to prevent overselling during checkout.
 *
 * Note: Some procedures are public (storefront needs availability checks)
 * while reservations require authentication.
 *
 * @see Story 3.8 - Oversell Prevention
 */
import { z } from '@trafi/zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, isAuthed } from '../trpc';
import {
  CheckAvailabilityInputSchema,
  ValidateCartItemSchema,
  CreateReservationInputSchema,
  ReleaseReservationInputSchema,
  GetAvailableStockInputSchema,
} from '@trafi/validators';

export const cartValidationRouter = router({
  /**
   * Check availability for a single variant.
   * Public procedure - storefront needs this for add-to-cart validation.
   */
  checkAvailability: publicProcedure
    .input(
      z.object({
        storeId: z.string(),
        ...CheckAvailabilityInputSchema.shape,
      }),
    )
    .query(async ({ input, ctx }) => {
      try {
        return ctx.services.cartValidationService.checkAvailability(
          input.storeId,
          {
            variantId: input.variantId,
            requestedQuantity: input.requestedQuantity,
          },
        );
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to check availability',
        });
      }
    }),

  /**
   * Validate multiple cart items and return adjustments needed.
   * Public procedure - storefront needs this for checkout validation.
   */
  validateCart: publicProcedure
    .input(
      z.object({
        storeId: z.string(),
        items: z.array(ValidateCartItemSchema),
      }),
    )
    .query(async ({ input, ctx }) => {
      try {
        return ctx.services.cartValidationService.validateCartItems(
          input.storeId,
          input.items,
        );
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            error instanceof Error ? error.message : 'Failed to validate cart',
        });
      }
    }),

  /**
   * Get available stock for a variant (physical - reserved).
   * Public procedure - storefront can display stock levels.
   */
  getAvailableStock: publicProcedure
    .input(
      z.object({
        storeId: z.string(),
        ...GetAvailableStockInputSchema.shape,
      }),
    )
    .query(async ({ input, ctx }) => {
      try {
        return ctx.services.cartValidationService.getAvailableStock(
          input.storeId,
          input.variantId,
        );
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to get available stock',
        });
      }
    }),

  /**
   * Create or update an inventory reservation.
   * Internal procedure - called during checkout initiation.
   * Requires authentication (checkout flow is authenticated).
   */
  createReservation: publicProcedure
    .use(isAuthed)
    .input(CreateReservationInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // Verify store access
        if (ctx.storeId && ctx.storeId !== input.storeId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Store mismatch',
          });
        }

        return ctx.services.cartValidationService.createReservation(input);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to create reservation',
        });
      }
    }),

  /**
   * Release a specific reservation (mark as RELEASED or EXPIRED).
   * Internal procedure - called after order completion or checkout cancellation.
   */
  releaseReservation: publicProcedure
    .use(isAuthed)
    .input(
      z.object({
        storeId: z.string(),
        ...ReleaseReservationInputSchema.shape,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Verify store access
        if (ctx.storeId && ctx.storeId !== input.storeId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Store mismatch',
          });
        }

        return ctx.services.cartValidationService.releaseReservation(
          input.storeId,
          {
            cartId: input.cartId,
            variantId: input.variantId,
            reason: input.reason,
          },
        );
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to release reservation',
        });
      }
    }),

  /**
   * Release all reservations for a cart.
   * Internal procedure - called after order completion.
   */
  releaseCartReservations: publicProcedure
    .use(isAuthed)
    .input(
      z.object({
        storeId: z.string(),
        cartId: z.string(),
        reason: z.enum(['RELEASED', 'EXPIRED']),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Verify store access
        if (ctx.storeId && ctx.storeId !== input.storeId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Store mismatch',
          });
        }

        const count =
          await ctx.services.cartValidationService.releaseCartReservations(
            input.storeId,
            input.cartId,
            input.reason,
          );

        return { released: count };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to release cart reservations',
        });
      }
    }),

  /**
   * Get all active reservations for a cart.
   * Internal procedure - used by checkout flow.
   */
  getCartReservations: publicProcedure
    .use(isAuthed)
    .input(
      z.object({
        storeId: z.string(),
        cartId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      try {
        // Verify store access
        if (ctx.storeId && ctx.storeId !== input.storeId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Store mismatch',
          });
        }

        return ctx.services.cartValidationService.getCartReservations(
          input.storeId,
          input.cartId,
        );
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to get cart reservations',
        });
      }
    }),
});

export type CartValidationRouter = typeof cartValidationRouter;
