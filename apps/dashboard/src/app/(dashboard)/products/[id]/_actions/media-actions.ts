'use server'

/**
 * Server Actions for Product Media
 *
 * Upload uses REST endpoint (tRPC doesn't handle multipart well).
 * All other mutations use tRPC client.
 *
 * @see Story 3.3 - Product Media Upload
 */

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createServerAction } from 'zsa'
import { z } from '@trafi/zod'
import { createAuthenticatedTrpcClient } from '@/lib/trpc'
import {
  UpdateMediaSchema,
  ReorderMediaSchema,
  ListMediaSchema,
  type MediaResponse,
} from '@trafi/validators'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
const ACCESS_TOKEN_COOKIE = 'trafi_access_token'

/**
 * Upload media using FormData (for direct file upload)
 *
 * Uses REST endpoint because tRPC doesn't handle multipart form data well.
 * Accepts FormData with:
 * - file: File
 * - productId: string
 * - variantId?: string (optional)
 */
export async function uploadMediaFormAction(formData: FormData): Promise<MediaResponse> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value

  if (!accessToken) {
    throw new Error('Not authenticated')
  }

  const productId = formData.get('productId') as string
  const variantId = formData.get('variantId') as string | null
  const file = formData.get('file') as File

  if (!productId) {
    throw new Error('Product ID is required')
  }

  if (!file || !(file instanceof File)) {
    throw new Error('File is required')
  }

  // Build the URL with optional variantId query param
  let url = `${API_URL}/api/v1/products/${productId}/media`
  if (variantId) {
    url += `?variantId=${encodeURIComponent(variantId)}`
  }

  // Create FormData for the REST request
  const restFormData = new FormData()
  restFormData.append('file', file)

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: restFormData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Upload failed' }))
    throw new Error(error.message || `Upload failed with status ${response.status}`)
  }

  const media = await response.json()

  // Revalidate the product page
  revalidatePath(`/products/${productId}`)

  return media as MediaResponse
}

/**
 * Update media metadata (alt text, primary status)
 */
export const updateMediaAction = createServerAction()
  .input(
    z.object({
      mediaId: z.string().min(1, 'Media ID is required'),
      productId: z.string().min(1, 'Product ID is required'),
      altText: z.string().max(500).optional(),
      isPrimary: z.boolean().optional(),
    })
  )
  .handler(async ({ input }): Promise<MediaResponse> => {
    const trpc = await createAuthenticatedTrpcClient()

    const result = await trpc.media.update.mutate({
      id: input.mediaId,
      altText: input.altText,
      isPrimary: input.isPrimary,
    })

    revalidatePath(`/products/${input.productId}`)
    return result as MediaResponse
  })

/**
 * Reorder media within a product
 *
 * First media in the new order becomes primary.
 */
export const reorderMediaAction = createServerAction()
  .input(ReorderMediaSchema)
  .handler(async ({ input }): Promise<MediaResponse[]> => {
    const trpc = await createAuthenticatedTrpcClient()

    const result = await trpc.media.reorder.mutate(input)

    revalidatePath(`/products/${input.productId}`)
    return result as MediaResponse[]
  })

/**
 * Delete a media item
 */
export const deleteMediaAction = createServerAction()
  .input(
    z.object({
      id: z.string().min(1, 'Media ID is required'),
      productId: z.string().min(1, 'Product ID is required'),
    })
  )
  .handler(async ({ input }): Promise<{ success: boolean }> => {
    const trpc = await createAuthenticatedTrpcClient()

    const result = await trpc.media.delete.mutate({ id: input.id })

    revalidatePath(`/products/${input.productId}`)
    return result
  })

/**
 * Get all media for a product
 */
export const getMediaAction = createServerAction()
  .input(z.string())
  .handler(async ({ input: productId }): Promise<MediaResponse[]> => {
    const trpc = await createAuthenticatedTrpcClient()

    const result = await trpc.media.list.query({ productId })
    return result as MediaResponse[]
  })

/**
 * Get a single media item by ID
 */
export const getMediaByIdAction = createServerAction()
  .input(z.string())
  .handler(async ({ input: id }): Promise<MediaResponse> => {
    const trpc = await createAuthenticatedTrpcClient()

    const result = await trpc.media.get.query({ id })
    return result as MediaResponse
  })
