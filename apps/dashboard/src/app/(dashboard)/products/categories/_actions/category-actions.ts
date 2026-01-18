'use server'

import { revalidatePath } from 'next/cache'
import { createServerAction } from 'zsa'
import { z } from '@trafi/zod'
import { createAuthenticatedTrpcClient } from '@/lib/trpc'
import {
  CreateCategorySchema,
  UpdateCategorySchema,
  ReorderCategorySchema,
  AssignProductsToCategorySchema,
  RemoveProductsFromCategorySchema,
  type CategoryTreeNode,
  type CategoryListItem,
} from '@trafi/validators'

/**
 * Category with product count for single category queries
 */
export interface CategoryWithProductCount {
  id: string
  storeId: string
  name: string
  slug: string
  description: string | null
  parentId: string | null
  imageUrl: string | null
  depth: number
  position: number
  createdAt: Date
  updatedAt: Date
  productCount?: number
}

/**
 * Get the full category tree for the current store.
 * Returns nested structure with children.
 *
 * @see Story 3.4 - Categories Management
 */
export const getCategoryTreeAction = createServerAction().handler(
  async (): Promise<CategoryTreeNode[]> => {
    const trpc = await createAuthenticatedTrpcClient()
    return await trpc.categories.tree.query()
  }
)

/**
 * Get a flat list of categories for selects/dropdowns.
 * Useful for category selection in product forms.
 */
export const getCategoryListAction = createServerAction().handler(
  async (): Promise<CategoryListItem[]> => {
    const trpc = await createAuthenticatedTrpcClient()
    return await trpc.categories.list.query()
  }
)

/**
 * Get a single category by ID with product count.
 */
export const getCategoryAction = createServerAction()
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }): Promise<CategoryWithProductCount> => {
    const trpc = await createAuthenticatedTrpcClient()
    return await trpc.categories.get.query({ id: input.id })
  })

/**
 * Create a new category.
 * Slug will be auto-generated from name if not provided.
 * Revalidates categories list cache after creation.
 */
export const createCategoryAction = createServerAction()
  .input(CreateCategorySchema)
  .handler(async ({ input }) => {
    const trpc = await createAuthenticatedTrpcClient()
    const category = await trpc.categories.create.mutate(input)
    revalidatePath('/products/categories')
    revalidatePath('/products') // Categories might be shown in product list
    return category
  })

/**
 * Update an existing category.
 * Supports partial updates - only provided fields are changed.
 * Revalidates categories list cache after update.
 */
export const updateCategoryAction = createServerAction()
  .input(UpdateCategorySchema)
  .handler(async ({ input }) => {
    const trpc = await createAuthenticatedTrpcClient()
    const category = await trpc.categories.update.mutate(input)
    revalidatePath('/products/categories')
    revalidatePath(`/products/categories/${input.id}`)
    return category
  })

/**
 * Reorder a category (move to new parent/position).
 * Updates depth for category and all descendants.
 * Revalidates categories list cache after reorder.
 */
export const reorderCategoryAction = createServerAction()
  .input(ReorderCategorySchema)
  .handler(async ({ input }) => {
    const trpc = await createAuthenticatedTrpcClient()
    const category = await trpc.categories.reorder.mutate(input)
    revalidatePath('/products/categories')
    return category
  })

/**
 * Delete a category.
 * Products are NOT deleted, only the category assignment is removed.
 * Revalidates categories list cache after deletion.
 */
export const deleteCategoryAction = createServerAction()
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }): Promise<{ success: boolean }> => {
    const trpc = await createAuthenticatedTrpcClient()
    await trpc.categories.delete.mutate({ id: input.id })
    revalidatePath('/products/categories')
    revalidatePath('/products')
    return { success: true }
  })

/**
 * Assign products to a category.
 * Products that already belong to the category are skipped (idempotent).
 */
export const assignProductsToCategoryAction = createServerAction()
  .input(AssignProductsToCategorySchema)
  .handler(async ({ input }): Promise<{ success: boolean }> => {
    const trpc = await createAuthenticatedTrpcClient()
    await trpc.categories.assignProducts.mutate(input)
    revalidatePath('/products/categories')
    revalidatePath(`/products/categories/${input.categoryId}`)
    revalidatePath('/products')
    return { success: true }
  })

/**
 * Remove products from a category.
 * Only removes the category assignment, not the products themselves.
 */
export const removeProductsFromCategoryAction = createServerAction()
  .input(RemoveProductsFromCategorySchema)
  .handler(async ({ input }): Promise<{ success: boolean }> => {
    const trpc = await createAuthenticatedTrpcClient()
    await trpc.categories.removeProducts.mutate(input)
    revalidatePath('/products/categories')
    revalidatePath(`/products/categories/${input.categoryId}`)
    revalidatePath('/products')
    return { success: true }
  })

/**
 * Get product count for a category.
 */
export const getCategoryProductCountAction = createServerAction()
  .input(z.object({ categoryId: z.string() }))
  .handler(async ({ input }): Promise<{ count: number }> => {
    const trpc = await createAuthenticatedTrpcClient()
    return await trpc.categories.productCount.query({ categoryId: input.categoryId })
  })

/**
 * Get categories for a specific product.
 */
export const getProductCategoriesAction = createServerAction()
  .input(z.object({ productId: z.string() }))
  .handler(async ({ input }): Promise<CategoryListItem[]> => {
    const trpc = await createAuthenticatedTrpcClient()
    return await trpc.categories.forProduct.query({ productId: input.productId })
  })
