'use server'

import { revalidatePath } from 'next/cache'
import { createServerAction } from 'zsa'
import { z } from '@trafi/zod'
import { createAuthenticatedTrpcClient } from '@/lib/trpc'
import {
  CreateCollectionSchema,
  UpdateCollectionSchema,
  AddProductsToCollectionSchema,
  RemoveProductsFromCollectionSchema,
  ReorderCollectionProductsSchema,
  ListCollectionsSchema,
  type CollectionListResponse,
  type CollectionWithProducts,
} from '@trafi/validators'

/**
 * Collection with product count for single collection queries
 */
export interface CollectionWithProductCount {
  id: string
  storeId: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  isVisible: boolean
  isFeatured: boolean
  createdAt: Date
  updatedAt: Date
  productCount?: number
}

/**
 * Collection list item for forProduct queries
 * Uses CollectionListItem from validators
 */
import type { CollectionListItem } from '@trafi/validators'

/**
 * List collections with pagination and filters.
 * Returns paginated list with product counts.
 *
 * @see Story 3.5 - Collections Management
 */
export const getCollectionListAction = createServerAction()
  .input(ListCollectionsSchema.partial())
  .handler(async ({ input }): Promise<CollectionListResponse> => {
    const trpc = await createAuthenticatedTrpcClient()
    return await trpc.collections.list.query(input)
  })

/**
 * Get a single collection by ID (without products).
 */
export const getCollectionAction = createServerAction()
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }): Promise<CollectionWithProductCount> => {
    const trpc = await createAuthenticatedTrpcClient()
    return await trpc.collections.get.query({ id: input.id })
  })

/**
 * Get a single collection by ID with its products.
 * Includes full product details for display.
 */
export const getCollectionWithProductsAction = createServerAction()
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }): Promise<CollectionWithProducts> => {
    const trpc = await createAuthenticatedTrpcClient()
    return await trpc.collections.getWithProducts.query({ id: input.id })
  })

/**
 * Create a new collection.
 * Slug will be auto-generated from name if not provided.
 * Revalidates collections list cache after creation.
 */
export const createCollectionAction = createServerAction()
  .input(CreateCollectionSchema)
  .handler(async ({ input }) => {
    const trpc = await createAuthenticatedTrpcClient()
    const collection = await trpc.collections.create.mutate(input)
    revalidatePath('/products/collections')
    return collection
  })

/**
 * Update an existing collection.
 * Supports partial updates - only provided fields are changed.
 * Revalidates collections list cache after update.
 */
export const updateCollectionAction = createServerAction()
  .input(UpdateCollectionSchema)
  .handler(async ({ input }) => {
    const trpc = await createAuthenticatedTrpcClient()
    const collection = await trpc.collections.update.mutate(input)
    revalidatePath('/products/collections')
    revalidatePath(`/products/collections/${input.id}`)
    return collection
  })

/**
 * Delete a collection.
 * Products are NOT deleted, only the collection is removed.
 * Revalidates collections list cache after deletion.
 */
export const deleteCollectionAction = createServerAction()
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }): Promise<{ success: boolean }> => {
    const trpc = await createAuthenticatedTrpcClient()
    await trpc.collections.delete.mutate({ id: input.id })
    revalidatePath('/products/collections')
    return { success: true }
  })

/**
 * Add products to a collection.
 * Products that already belong to the collection are skipped (idempotent).
 * New products are added at the end of the list.
 */
export const addProductsToCollectionAction = createServerAction()
  .input(AddProductsToCollectionSchema)
  .handler(async ({ input }): Promise<{ success: boolean }> => {
    const trpc = await createAuthenticatedTrpcClient()
    await trpc.collections.addProducts.mutate(input)
    revalidatePath('/products/collections')
    revalidatePath(`/products/collections/${input.collectionId}`)
    revalidatePath('/products')
    return { success: true }
  })

/**
 * Remove products from a collection.
 * Only removes the collection assignment, not the products themselves.
 */
export const removeProductsFromCollectionAction = createServerAction()
  .input(RemoveProductsFromCollectionSchema)
  .handler(async ({ input }): Promise<{ success: boolean }> => {
    const trpc = await createAuthenticatedTrpcClient()
    await trpc.collections.removeProducts.mutate(input)
    revalidatePath('/products/collections')
    revalidatePath(`/products/collections/${input.collectionId}`)
    revalidatePath('/products')
    return { success: true }
  })

/**
 * Reorder products within a collection.
 * Provides complete control over product ordering.
 */
export const reorderCollectionProductsAction = createServerAction()
  .input(ReorderCollectionProductsSchema)
  .handler(async ({ input }): Promise<{ success: boolean }> => {
    const trpc = await createAuthenticatedTrpcClient()
    await trpc.collections.reorderProducts.mutate(input)
    revalidatePath(`/products/collections/${input.collectionId}`)
    return { success: true }
  })

/**
 * Get product count for a collection.
 */
export const getCollectionProductCountAction = createServerAction()
  .input(z.object({ collectionId: z.string() }))
  .handler(async ({ input }): Promise<{ count: number }> => {
    const trpc = await createAuthenticatedTrpcClient()
    return await trpc.collections.productCount.query({ collectionId: input.collectionId })
  })

/**
 * Get collections for a specific product.
 * Useful for showing which collections a product belongs to.
 */
export const getProductCollectionsAction = createServerAction()
  .input(z.object({ productId: z.string() }))
  .handler(async ({ input }): Promise<CollectionListItem[]> => {
    const trpc = await createAuthenticatedTrpcClient()
    return await trpc.collections.forProduct.query({ productId: input.productId })
  })
