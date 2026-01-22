/**
 * tRPC Router for Collections
 *
 * All mutations require `products:update` permission.
 * All queries require `products:read` permission.
 *
 * @see Story 3.5 - Collections Management
 */
import { z } from '@trafi/zod'
import { router, publicProcedure, isAuthed } from '../trpc'
import { storeQuery, storeMutation } from '../helpers'
import {
  CreateCollectionSchema,
  UpdateCollectionSchema,
  AddProductsToCollectionSchema,
  RemoveProductsFromCollectionSchema,
  ReorderCollectionProductsSchema,
  ListCollectionsSchema,
} from '@trafi/validators'

export const collectionsRouter = router({
  /** List collections with pagination and filters */
  list: publicProcedure
    .use(isAuthed)
    .input(ListCollectionsSchema.partial())
    .query(storeQuery('products:read', (ctx, input) =>
      ctx.services.collectionsService.list(ctx.storeId, input)
    )),

  /** Get a single collection by ID (without products) */
  get: publicProcedure
    .use(isAuthed)
    .input(z.object({ id: z.string() }))
    .query(storeQuery('products:read', (ctx, input) =>
      ctx.services.collectionsService.findById(ctx.storeId, input.id)
    )),

  /** Get a single collection by ID with its products */
  getWithProducts: publicProcedure
    .use(isAuthed)
    .input(z.object({ id: z.string() }))
    .query(storeQuery('products:read', (ctx, input) =>
      ctx.services.collectionsService.findByIdWithProducts(ctx.storeId, input.id)
    )),

  /** Create a new collection */
  create: publicProcedure
    .use(isAuthed)
    .input(CreateCollectionSchema)
    .mutation(storeMutation('products:update', (ctx, input) =>
      ctx.services.collectionsService.create(ctx.storeId, input)
    )),

  /** Update an existing collection */
  update: publicProcedure
    .use(isAuthed)
    .input(UpdateCollectionSchema)
    .mutation(storeMutation('products:update', (ctx, input) =>
      ctx.services.collectionsService.update(ctx.storeId, input)
    )),

  /** Delete a collection (products NOT deleted) */
  delete: publicProcedure
    .use(isAuthed)
    .input(z.object({ id: z.string() }))
    .mutation(storeMutation('products:delete', async (ctx, input) => {
      await ctx.services.collectionsService.delete(ctx.storeId, input.id)
      return { success: true }
    })),

  /** Add products to a collection */
  addProducts: publicProcedure
    .use(isAuthed)
    .input(AddProductsToCollectionSchema)
    .mutation(storeMutation('products:update', async (ctx, input) => {
      await ctx.services.collectionsService.addProducts(ctx.storeId, input)
      return { success: true }
    })),

  /** Remove products from a collection */
  removeProducts: publicProcedure
    .use(isAuthed)
    .input(RemoveProductsFromCollectionSchema)
    .mutation(storeMutation('products:update', async (ctx, input) => {
      await ctx.services.collectionsService.removeProducts(ctx.storeId, input)
      return { success: true }
    })),

  /** Reorder products within a collection */
  reorderProducts: publicProcedure
    .use(isAuthed)
    .input(ReorderCollectionProductsSchema)
    .mutation(storeMutation('products:update', async (ctx, input) => {
      await ctx.services.collectionsService.reorderProducts(ctx.storeId, input)
      return { success: true }
    })),

  /** Get collections for a specific product */
  forProduct: publicProcedure
    .use(isAuthed)
    .input(z.object({ productId: z.string() }))
    .query(storeQuery('products:read', (ctx, input) =>
      ctx.services.collectionsService.getCollectionsForProduct(ctx.storeId, input.productId)
    )),

  /** Get product count for a collection */
  productCount: publicProcedure
    .use(isAuthed)
    .input(z.object({ collectionId: z.string() }))
    .query(storeQuery('products:read', async (ctx, input) => {
      const count = await ctx.services.collectionsService.getProductCount(ctx.storeId, input.collectionId)
      return { count }
    })),
})

export type CollectionsRouter = typeof collectionsRouter
