'use server'

/**
 * Server Actions for Product Variants
 *
 * All mutations use tRPC client and revalidate the product detail page.
 * @see Story 3.2 - Product Variants Management
 */

import { revalidatePath } from 'next/cache'
import { createServerAction } from 'zsa'
import { z } from '@trafi/zod'
import { createAuthenticatedTrpcClient } from '@/lib/trpc'
import {
  CreateVariantSchema,
  UpdateVariantSchema,
  BulkCreateVariantsSchema,
  ListVariantsSchema,
  type VariantResponse,
} from '@trafi/validators'

/**
 * Create a single variant for a product
 */
export const createVariantAction = createServerAction()
  .input(CreateVariantSchema)
  .handler(async ({ input }): Promise<VariantResponse> => {
    const trpc = await createAuthenticatedTrpcClient()
    const result = await trpc.variants.create.mutate(input)
    revalidatePath(`/products/${input.productId}`)
    return result as VariantResponse
  })

/**
 * Bulk create variants from option type combinations
 */
export const bulkCreateVariantsAction = createServerAction()
  .input(BulkCreateVariantsSchema)
  .handler(async ({ input }): Promise<VariantResponse[]> => {
    const trpc = await createAuthenticatedTrpcClient()
    const result = await trpc.variants.bulkCreate.mutate(input)
    revalidatePath(`/products/${input.productId}`)
    return result as VariantResponse[]
  })

/**
 * Update an existing variant
 */
export const updateVariantAction = createServerAction()
  .input(UpdateVariantSchema)
  .handler(async ({ input }): Promise<VariantResponse> => {
    const trpc = await createAuthenticatedTrpcClient()
    const result = await trpc.variants.update.mutate(input)
    if (input.productId) {
      revalidatePath(`/products/${input.productId}`)
    }
    return result as VariantResponse
  })

/**
 * Delete a variant
 */
export const deleteVariantAction = createServerAction()
  .input(
    z.object({
      id: z.string(),
      productId: z.string(),
    }),
  )
  .handler(async ({ input }): Promise<{ success: boolean }> => {
    const trpc = await createAuthenticatedTrpcClient()
    const result = await trpc.variants.delete.mutate({ id: input.id })
    revalidatePath(`/products/${input.productId}`)
    return result
  })

/**
 * Get all variants for a product
 */
export const getVariantsAction = createServerAction()
  .input(z.string())
  .handler(async ({ input: productId }): Promise<VariantResponse[]> => {
    const trpc = await createAuthenticatedTrpcClient()
    const result = await trpc.variants.list.query({ productId })
    return result as VariantResponse[]
  })

/**
 * Get a single variant by ID
 */
export const getVariantAction = createServerAction()
  .input(z.string())
  .handler(async ({ input: id }): Promise<VariantResponse> => {
    const trpc = await createAuthenticatedTrpcClient()
    const result = await trpc.variants.get.query({ id })
    return result as VariantResponse
  })
