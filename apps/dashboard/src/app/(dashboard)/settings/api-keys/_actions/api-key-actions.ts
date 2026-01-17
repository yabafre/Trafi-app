'use server'

import { cookies } from 'next/headers'
import { createServerAction } from 'zsa'
import {
  ListApiKeysSchema,
  CreateApiKeySchema,
  type ApiKeysListResponse,
  type ApiKeyCreatedResponse,
  type ApiKeyResponse,
} from '@trafi/validators'
import { z } from '@trafi/zod'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
const ACCESS_TOKEN_COOKIE = 'trafi_access_token'

/**
 * Get access token from cookies
 */
async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(ACCESS_TOKEN_COOKIE)?.value ?? null
}

/**
 * Make authenticated API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const accessToken = await getAccessToken()

  if (!accessToken) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || `API error: ${response.status}`)
  }

  return response.json()
}

/**
 * Get API keys list action
 */
export const getApiKeysAction = createServerAction()
  .input(ListApiKeysSchema)
  .handler(async ({ input }): Promise<ApiKeysListResponse> => {
    const params = new URLSearchParams()
    params.set('page', String(input.page ?? 1))
    params.set('limit', String(input.limit ?? 20))
    if (input.includeRevoked) {
      params.set('includeRevoked', 'true')
    }

    return apiRequest<ApiKeysListResponse>(`/api-keys?${params.toString()}`)
  })

/**
 * Create API key action
 * NOTE: The full key is returned ONLY in this response
 */
export const createApiKeyAction = createServerAction()
  .input(CreateApiKeySchema)
  .handler(async ({ input }): Promise<ApiKeyCreatedResponse> => {
    return apiRequest<ApiKeyCreatedResponse>('/api-keys', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  })

/**
 * Revoke API key action
 */
export const revokeApiKeyAction = createServerAction()
  .input(z.object({ keyId: z.string().min(1) }))
  .handler(async ({ input }): Promise<ApiKeyResponse> => {
    return apiRequest<ApiKeyResponse>(`/api-keys/${input.keyId}`, {
      method: 'DELETE',
    })
  })
