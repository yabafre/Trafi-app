'use server'

import { cookies } from 'next/headers'
import { createServerAction } from 'zsa'
import {
  UpdateStoreSettingsSchema,
  type StoreSettingsResponse,
} from '@trafi/validators'

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
 * Get store settings action
 * Returns current settings or defaults if none configured
 */
export const getStoreSettingsAction = createServerAction()
  .handler(async (): Promise<StoreSettingsResponse> => {
    return apiRequest<StoreSettingsResponse>('/store-settings')
  })

/**
 * Update store settings action
 * Supports partial updates - only provided fields are changed
 */
export const updateStoreSettingsAction = createServerAction()
  .input(UpdateStoreSettingsSchema)
  .handler(async ({ input }): Promise<StoreSettingsResponse> => {
    return apiRequest<StoreSettingsResponse>('/store-settings', {
      method: 'PATCH',
      body: JSON.stringify(input),
    })
  })
