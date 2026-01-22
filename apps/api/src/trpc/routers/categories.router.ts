/**
 * tRPC Router for Categories
 *
 * All mutations require `products:update` permission.
 * All queries require `products:read` permission.
 *
 * @see Story 3.4 - Categories Management
 */
import { z } from '@trafi/zod'
import { router, publicProcedure, isAuthed } from '../trpc'
import { storeQuery, storeMutation } from '../helpers'
import {
  CreateCategorySchema,
  UpdateCategorySchema,
  ReorderCategorySchema,
  AssignProductsToCategorySchema,
  RemoveProductsFromCategorySchema,
} from '@trafi/validators'

export const categoriesRouter = router({
  /** Get the full category tree for the store */
  tree: publicProcedure
    .use(isAuthed)
    .query(storeQuery('products:read', (ctx) =>
      ctx.services.categoriesService.getTree(ctx.storeId)
    )),

  /** Get a flat list of categories for selects/dropdowns */
  list: publicProcedure
    .use(isAuthed)
    .query(storeQuery('products:read', (ctx) =>
      ctx.services.categoriesService.listFlat(ctx.storeId)
    )),

  /** Get a single category by ID */
  get: publicProcedure
    .use(isAuthed)
    .input(z.object({ id: z.string() }))
    .query(storeQuery('products:read', (ctx, input) =>
      ctx.services.categoriesService.findById(ctx.storeId, input.id)
    )),

  /** Create a new category */
  create: publicProcedure
    .use(isAuthed)
    .input(CreateCategorySchema)
    .mutation(storeMutation('products:update', (ctx, input) =>
      ctx.services.categoriesService.create(ctx.storeId, input)
    )),

  /** Update an existing category */
  update: publicProcedure
    .use(isAuthed)
    .input(UpdateCategorySchema)
    .mutation(storeMutation('products:update', (ctx, input) =>
      ctx.services.categoriesService.update(ctx.storeId, input)
    )),

  /** Reorder a category (move to new parent/position) */
  reorder: publicProcedure
    .use(isAuthed)
    .input(ReorderCategorySchema)
    .mutation(storeMutation('products:update', (ctx, input) =>
      ctx.services.categoriesService.reorder(ctx.storeId, input)
    )),

  /** Delete a category */
  delete: publicProcedure
    .use(isAuthed)
    .input(z.object({ id: z.string() }))
    .mutation(storeMutation('products:delete', async (ctx, input) => {
      await ctx.services.categoriesService.delete(ctx.storeId, input.id)
      return { success: true }
    })),

  /** Assign products to a category */
  assignProducts: publicProcedure
    .use(isAuthed)
    .input(AssignProductsToCategorySchema)
    .mutation(storeMutation('products:update', async (ctx, input) => {
      await ctx.services.categoriesService.assignProducts(ctx.storeId, input)
      return { success: true }
    })),

  /** Remove products from a category */
  removeProducts: publicProcedure
    .use(isAuthed)
    .input(RemoveProductsFromCategorySchema)
    .mutation(storeMutation('products:update', async (ctx, input) => {
      await ctx.services.categoriesService.removeProducts(ctx.storeId, input)
      return { success: true }
    })),

  /** Get categories for a specific product */
  forProduct: publicProcedure
    .use(isAuthed)
    .input(z.object({ productId: z.string() }))
    .query(storeQuery('products:read', (ctx, input) =>
      ctx.services.categoriesService.getCategoriesForProduct(ctx.storeId, input.productId)
    )),

  /** Get product count for a category */
  productCount: publicProcedure
    .use(isAuthed)
    .input(z.object({ categoryId: z.string() }))
    .query(storeQuery('products:read', async (ctx, input) => {
      const count = await ctx.services.categoriesService.getProductCount(ctx.storeId, input.categoryId)
      return { count }
    })),
})

export type CategoriesRouter = typeof categoriesRouter
