/**
 * tRPC Router for Tax Rules
 *
 * All mutations require `settings:update` permission.
 * All queries require `settings:read` permission.
 *
 * @see Story 3.6 - Product Pricing and Tax Rules
 */
import { z } from '@trafi/zod'
import { router, publicProcedure, isAuthed } from '../trpc'
import { storeQuery, storeMutation } from '../helpers'
import {
  CreateTaxRuleSchema,
  UpdateTaxRuleSchema,
  ListTaxRulesSchema,
  SetDefaultTaxRuleSchema,
} from '@trafi/validators'

export const taxRulesRouter = router({
  /** List tax rules with pagination and filters */
  list: publicProcedure
    .use(isAuthed)
    .input(ListTaxRulesSchema.partial())
    .query(storeQuery('settings:read', (ctx, input) =>
      ctx.services.taxRulesService.list(ctx.storeId, input)
    )),

  /** Get a single tax rule by ID */
  get: publicProcedure
    .use(isAuthed)
    .input(z.object({ id: z.string() }))
    .query(storeQuery('settings:read', (ctx, input) =>
      ctx.services.taxRulesService.findById(ctx.storeId, input.id)
    )),

  /** Get the default tax rule for the store (optionally filter by country code) */
  getDefault: publicProcedure
    .use(isAuthed)
    .input(z.object({ countryCode: z.string().optional() }))
    .query(storeQuery('settings:read', (ctx, input) =>
      ctx.services.taxRulesService.getDefaultTaxRule(ctx.storeId, input.countryCode)
    )),

  /** List tax rules for dropdown/select (for product forms) */
  listForSelect: publicProcedure
    .use(isAuthed)
    .query(storeQuery('products:read', (ctx) =>
      ctx.services.taxRulesService.listForSelect(ctx.storeId)
    )),

  /** Create a new tax rule */
  create: publicProcedure
    .use(isAuthed)
    .input(CreateTaxRuleSchema)
    .mutation(storeMutation('settings:update', (ctx, input) =>
      ctx.services.taxRulesService.create(ctx.storeId, input)
    )),

  /** Update an existing tax rule */
  update: publicProcedure
    .use(isAuthed)
    .input(UpdateTaxRuleSchema)
    .mutation(storeMutation('settings:update', (ctx, input) =>
      ctx.services.taxRulesService.update(ctx.storeId, input)
    )),

  /** Delete a tax rule (fails if assigned to any variants) */
  delete: publicProcedure
    .use(isAuthed)
    .input(z.object({ id: z.string() }))
    .mutation(storeMutation('settings:update', async (ctx, input) => {
      await ctx.services.taxRulesService.delete(ctx.storeId, input.id)
      return { success: true }
    })),

  /** Set a tax rule as the default for the store */
  setDefault: publicProcedure
    .use(isAuthed)
    .input(SetDefaultTaxRuleSchema)
    .mutation(storeMutation('settings:update', (ctx, input) =>
      ctx.services.taxRulesService.setDefaultTaxRule(ctx.storeId, input.id)
    )),
})

export type TaxRulesRouter = typeof taxRulesRouter
