'use server'

import { createServerAction } from 'zsa'
import { createAuthenticatedTrpcClient } from '@/lib/trpc'
import {
  ListApiKeysSchema,
  CreateApiKeySchema,
  type ApiKeysListResponse,
  type ApiKeyCreatedResponse,
  type ApiKeyResponse,
} from '@trafi/validators'
import { z } from '@trafi/zod'

/**
 * Get API keys list action
 * Uses tRPC for type-safe API communication
 */
export const getApiKeysAction = createServerAction()
  .input(ListApiKeysSchema)
  .handler(async ({ input }): Promise<ApiKeysListResponse> => {
    const trpc = await createAuthenticatedTrpcClient()
    return await trpc.apiKeys.list.query(input)
  })

/**
 * Create API key action
 * NOTE: The full key is returned ONLY in this response
 * Uses tRPC for type-safe API communication
 */
export const createApiKeyAction = createServerAction()
  .input(CreateApiKeySchema)
  .handler(async ({ input }): Promise<ApiKeyCreatedResponse> => {
    const trpc = await createAuthenticatedTrpcClient()
    return await trpc.apiKeys.create.mutate(input)
  })

/**
 * Revoke API key action
 * Uses tRPC for type-safe API communication
 */
export const revokeApiKeyAction = createServerAction()
  .input(z.object({ keyId: z.string().min(1) }))
  .handler(async ({ input }): Promise<ApiKeyResponse> => {
    const trpc = await createAuthenticatedTrpcClient()
    return await trpc.apiKeys.revoke.mutate(input)
  })
