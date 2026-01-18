'use server'

import { revalidatePath } from 'next/cache'
import { createServerAction } from 'zsa'
import { z } from '@trafi/zod'
import { createAuthenticatedTrpcClient } from '@/lib/trpc'
import {
  CreateProductSchema,
  UpdateProductSchema,
  ListProductsSchema,
  type ProductResponse,
  type ListProductsInput,
} from '@trafi/validators'

/**
 * Paginated products response type
 */
export interface PaginatedProductsResponse {
  items: ProductResponse[]
  total: number
  page: number
  limit: number
  totalPages: number
}

/**
 * Get paginated list of products with filtering
 * Supports status, search, tags, vendor, productType filters
 *
 * @see Story 3.1 - Product Model and Basic CRUD
 */
export const getProductsAction = createServerAction()
  .input(ListProductsSchema)
  .handler(async ({ input }): Promise<PaginatedProductsResponse> => {
    const trpc = await createAuthenticatedTrpcClient()
    return await trpc.products.list.query(input)
  })

/**
 * Get a single product by ID
 * Returns full product details
 */
export const getProductAction = createServerAction()
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }): Promise<ProductResponse> => {
    const trpc = await createAuthenticatedTrpcClient()
    return await trpc.products.get.query({ id: input.id })
  })

/**
 * Create a new product
 * Slug will be auto-generated from name if not provided
 * Revalidates products list cache after creation
 */
export const createProductAction = createServerAction()
  .input(CreateProductSchema)
  .handler(async ({ input }): Promise<ProductResponse> => {
    const trpc = await createAuthenticatedTrpcClient()
    const product = await trpc.products.create.mutate(input)
    revalidatePath('/products')
    return product
  })

/**
 * Update an existing product
 * Supports partial updates - only provided fields are changed
 * Revalidates products list and detail page cache
 */
export const updateProductAction = createServerAction()
  .input(
    z.object({
      id: z.string(),
      data: UpdateProductSchema,
    })
  )
  .handler(async ({ input }): Promise<ProductResponse> => {
    const trpc = await createAuthenticatedTrpcClient()
    const product = await trpc.products.update.mutate({
      id: input.id,
      data: input.data,
    })
    revalidatePath('/products')
    revalidatePath(`/products/${input.id}`)
    return product
  })

/**
 * Delete a product
 * Revalidates products list cache after deletion
 */
export const deleteProductAction = createServerAction()
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }): Promise<void> => {
    const trpc = await createAuthenticatedTrpcClient()
    await trpc.products.delete.mutate({ id: input.id })
    revalidatePath('/products')
  })
