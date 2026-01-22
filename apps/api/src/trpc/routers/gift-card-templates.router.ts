/**
 * tRPC Router for Gift Card Templates
 *
 * All mutations require `settings:update` permission (marketing settings).
 * All queries require `settings:read` permission.
 *
 * @see Story 3.10 - Gift Cards (AC1, AC6)
 */
import { router, publicProcedure, isAuthed } from '@/trpc';
import { storeQuery, storeMutation } from '../helpers';
import {
  CuidParamSchema,
  ListGiftCardTemplatesSchema,
  CreateGiftCardTemplateSchema,
  UpdateGiftCardTemplateWithIdSchema,
} from '@trafi/validators';

export const giftCardTemplatesRouter = router({
  /** List gift card templates with pagination and filters */
  list: publicProcedure
    .use(isAuthed)
    .input(ListGiftCardTemplatesSchema.optional())
    .query(
      storeQuery('settings:read', (ctx, input) =>
        ctx.services.giftCardTemplateService.list(ctx.storeId, input ?? {})
      )
    ),

  /** List templates for select dropdown (active only) */
  listForSelect: publicProcedure
    .use(isAuthed)
    .query(
      storeQuery('settings:read', (ctx) =>
        ctx.services.giftCardTemplateService.listForSelect(ctx.storeId)
      )
    ),

  /** Get a single template by ID */
  get: publicProcedure
    .use(isAuthed)
    .input(CuidParamSchema)
    .query(
      storeQuery('settings:read', (ctx, input) =>
        ctx.services.giftCardTemplateService.findById(ctx.storeId, input.id)
      )
    ),

  /** Create a new gift card template */
  create: publicProcedure
    .use(isAuthed)
    .input(CreateGiftCardTemplateSchema)
    .mutation(
      storeMutation('settings:update', (ctx, input) =>
        ctx.services.giftCardTemplateService.create(ctx.storeId, input)
      )
    ),

  /** Update an existing template */
  update: publicProcedure
    .use(isAuthed)
    .input(UpdateGiftCardTemplateWithIdSchema)
    .mutation(
      storeMutation('settings:update', (ctx, input) => {
        const { id, ...updateData } = input;
        return ctx.services.giftCardTemplateService.update(ctx.storeId, id, updateData);
      })
    ),

  /** Delete a template */
  delete: publicProcedure
    .use(isAuthed)
    .input(CuidParamSchema)
    .mutation(
      storeMutation('settings:update', async (ctx, input) => {
        await ctx.services.giftCardTemplateService.delete(ctx.storeId, input.id);
        return { success: true };
      })
    ),

  /** Activate a template */
  activate: publicProcedure
    .use(isAuthed)
    .input(CuidParamSchema)
    .mutation(
      storeMutation('settings:update', (ctx, input) =>
        ctx.services.giftCardTemplateService.activate(ctx.storeId, input.id)
      )
    ),

  /** Deactivate a template */
  deactivate: publicProcedure
    .use(isAuthed)
    .input(CuidParamSchema)
    .mutation(
      storeMutation('settings:update', (ctx, input) =>
        ctx.services.giftCardTemplateService.deactivate(ctx.storeId, input.id)
      )
    ),
});

export type GiftCardTemplatesRouter = typeof giftCardTemplatesRouter;
