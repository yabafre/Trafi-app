/**
 * tRPC Router for Product Variants
 *
 * All mutations require `products:update` permission (variants are a sub-resource of products).
 * All queries require `products:read` permission.
 *
 * @see Story 3.2 - Product Variants Management
 */
import { z } from '@trafi/zod'
import { router, publicProcedure, isAuthed } from '../trpc'
import { storeQuery, storeMutation } from '../helpers'
import {
  CreateVariantSchema,
  UpdateVariantSchema,
  BulkCreateVariantsSchema,
  ListVariantsSchema,
  UpdateVariantPricingSchema,
} from '@trafi/validators'

export const variantsRouter = router({
  /** Create a single variant for a product */
  create: publicProcedure
    .use(isAuthed)
    .input(CreateVariantSchema)
    .mutation(storeMutation('products:update', (ctx, input) =>
      ctx.services.variantsService.create(ctx.storeId, input)
    )),

  /** Bulk create variants from option type combinations */
  bulkCreate: publicProcedure
    .use(isAuthed)
    .input(BulkCreateVariantsSchema)
    .mutation(storeMutation('products:update', (ctx, input) =>
      ctx.services.variantsService.bulkCreate(ctx.storeId, input)
    )),

  /** Update an existing variant */
  update: publicProcedure
    .use(isAuthed)
    .input(UpdateVariantSchema)
    .mutation(storeMutation('products:update', (ctx, input) =>
      ctx.services.variantsService.update(ctx.storeId, input)
    )),

  /** Delete a variant (cannot delete the last variant of a product) */
  delete: publicProcedure
    .use(isAuthed)
    .input(z.object({ id: z.string() }))
    .mutation(storeMutation('products:update', async (ctx, input) => {
      await ctx.services.variantsService.delete(ctx.storeId, input.id)
      return { success: true }
    })),

  /** List all variants for a product */
  list: publicProcedure
    .use(isAuthed)
    .input(ListVariantsSchema)
    .query(storeQuery('products:read', (ctx, input) =>
      ctx.services.variantsService.listByProduct(ctx.storeId, input.productId)
    )),

  /** Update only the pricing fields of a variant */
  updatePricing: publicProcedure
    .use(isAuthed)
    .input(UpdateVariantPricingSchema)
    .mutation(storeMutation('products:update', (ctx, input) =>
      ctx.services.variantsService.updatePricing(ctx.storeId, input)
    )),

  /** Get a single variant by ID */
  get: publicProcedure
    .use(isAuthed)
    .input(z.object({ id: z.string() }))
    .query(storeQuery('products:read', (ctx, input) =>
      ctx.services.variantsService.findById(ctx.storeId, input.id)
    )),
})

export type VariantsRouter = typeof variantsRouter
