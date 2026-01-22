/**
 * tRPC Router for Gift Card Templates
 *
 * All mutations require `settings:update` permission (marketing settings).
 * All queries require `settings:read` permission.
 *
 * @see Story 3.10 - Gift Cards (AC1, AC6)
 */
import { TRPCError } from '@trpc/server';
import { z } from '@trafi/zod';
import { router, publicProcedure, isAuthed } from '../trpc';
import { CreateGiftCardTemplateSchema } from '@trafi/validators';

// Local input schema for listing templates (all optional)
const ListTemplatesInputSchema = z.object({
  isActive: z.boolean().optional(),
  search: z.string().max(100).optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
});

export const giftCardTemplatesRouter = router({
  /**
   * List gift card templates with pagination and filters.
   * Requires `settings:read` permission.
   */
  list: publicProcedure
    .use(isAuthed)
    .input(ListTemplatesInputSchema.optional())
    .query(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('settings:read');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        return await ctx.services.giftCardTemplateService.list(ctx.storeId, input ?? {});
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to list templates',
        });
      }
    }),

  /**
   * List templates for select dropdown (active only).
   * Requires `settings:read` permission.
   */
  listForSelect: publicProcedure.use(isAuthed).query(async ({ ctx }) => {
    try {
      ctx.requirePermission('settings:read');

      if (!ctx.storeId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Store context required',
        });
      }

      return await ctx.services.giftCardTemplateService.listForSelect(ctx.storeId);
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Failed to list templates',
      });
    }
  }),

  /**
   * Get a single template by ID.
   * Requires `settings:read` permission.
   */
  get: publicProcedure
    .use(isAuthed)
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('settings:read');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        return await ctx.services.giftCardTemplateService.findById(ctx.storeId, input.id);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (error instanceof Error && error.message === 'Gift card template not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Gift card template not found',
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get template',
        });
      }
    }),

  /**
   * Create a new gift card template.
   * Requires `settings:update` permission.
   */
  create: publicProcedure
    .use(isAuthed)
    .input(CreateGiftCardTemplateSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('settings:update');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        return await ctx.services.giftCardTemplateService.create(ctx.storeId, input);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (error instanceof Error && error.message.includes('required')) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create template',
        });
      }
    }),

  /**
   * Update an existing template.
   * Requires `settings:update` permission.
   */
  update: publicProcedure
    .use(isAuthed)
    .input(
      z.object({
        id: z.string().cuid(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(500).nullish(),
        designImageUrl: z.string().url().nullish(),
        denominations: z.array(z.number().int().positive()).min(1).max(20).optional(),
        allowCustomAmount: z.boolean().optional(),
        minAmountCents: z.number().int().positive().nullish(),
        maxAmountCents: z.number().int().positive().nullish(),
        validityDays: z.number().int().positive().max(3650).nullish(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('settings:update');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        const { id, ...updateData } = input;
        return await ctx.services.giftCardTemplateService.update(ctx.storeId, id, updateData);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (error instanceof Error && error.message === 'Gift card template not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Gift card template not found',
          });
        }
        if (error instanceof Error && error.message.includes('required')) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update template',
        });
      }
    }),

  /**
   * Delete a template.
   * Requires `settings:update` permission.
   */
  delete: publicProcedure
    .use(isAuthed)
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('settings:update');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        await ctx.services.giftCardTemplateService.delete(ctx.storeId, input.id);
        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (error instanceof Error && error.message === 'Gift card template not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Gift card template not found',
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to delete template',
        });
      }
    }),

  /**
   * Activate a template.
   * Requires `settings:update` permission.
   */
  activate: publicProcedure
    .use(isAuthed)
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('settings:update');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        return await ctx.services.giftCardTemplateService.activate(ctx.storeId, input.id);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (error instanceof Error && error.message === 'Gift card template not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Gift card template not found',
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to activate template',
        });
      }
    }),

  /**
   * Deactivate a template.
   * Requires `settings:update` permission.
   */
  deactivate: publicProcedure
    .use(isAuthed)
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('settings:update');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        return await ctx.services.giftCardTemplateService.deactivate(ctx.storeId, input.id);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (error instanceof Error && error.message === 'Gift card template not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Gift card template not found',
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to deactivate template',
        });
      }
    }),
});

export type GiftCardTemplatesRouter = typeof giftCardTemplatesRouter;
