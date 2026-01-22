/**
 * Products Router - tRPC procedures for product catalog management
 *
 * Exposes CRUD procedures for products with tenant isolation.
 * Uses ProductsService for business logic.
 *
 * Permission requirements:
 * - products:read: View products (list, get)
 * - products:create: Create products
 * - products:update: Update products
 * - products:delete: Delete products
 *
 * @see Story 3.1 - Product Model and Basic CRUD
 */
import { z } from '@trafi/zod'
import { router, publicProcedure, isAuthed } from '../trpc'
import { storeQuery, storeMutation } from '../helpers'
import {
  CreateProductSchema,
  UpdateProductSchema,
  ListProductsSchema,
} from '@trafi/validators'

export const productsRouter = router({
  /** List products with pagination and filtering */
  list: publicProcedure
    .use(isAuthed)
    .input(ListProductsSchema)
    .query(storeQuery('products:read', (ctx, input) =>
      ctx.services.productsService.list(ctx.storeId, input)
    )),

  /** Get a single product by ID */
  get: publicProcedure
    .use(isAuthed)
    .input(z.object({ id: z.string() }))
    .query(storeQuery('products:read', (ctx, input) =>
      ctx.services.productsService.findById(ctx.storeId, input.id)
    )),

  /** Create a new product (auto-generates slug from name if not provided) */
  create: publicProcedure
    .use(isAuthed)
    .input(CreateProductSchema)
    .mutation(storeMutation('products:create', (ctx, input) =>
      ctx.services.productsService.create(ctx.storeId, input)
    )),

  /** Update an existing product (supports partial updates) */
  update: publicProcedure
    .use(isAuthed)
    .input(z.object({ id: z.string(), data: UpdateProductSchema }))
    .mutation(storeMutation('products:update', (ctx, input) =>
      ctx.services.productsService.update(ctx.storeId, input.id, input.data)
    )),

  /** Delete a product */
  delete: publicProcedure
    .use(isAuthed)
    .input(z.object({ id: z.string() }))
    .mutation(storeMutation('products:delete', async (ctx, input) => {
      await ctx.services.productsService.delete(ctx.storeId, input.id)
      return { success: true }
    })),
})

export type ProductsRouter = typeof productsRouter
