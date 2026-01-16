'use server'

import { cookies } from 'next/headers'
import { createServerAction } from 'zsa'
import {
  ListUsersSchema,
  InviteUserSchema,
  UpdateUserRoleSchema,
  type UsersListResponse,
  type UserResponse,
  type ListUsersInput,
  type InviteUserInput,
  type UpdateUserRoleInput,
} from '@trafi/validators'
import { z } from 'zod'

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
 * Get users list action
 */
export const getUsersAction = createServerAction()
  .input(ListUsersSchema)
  .handler(async ({ input }): Promise<UsersListResponse> => {
    const params = new URLSearchParams()
    params.set('page', String(input.page ?? 1))
    params.set('limit', String(input.limit ?? 20))
    if (input.status) {
      params.set('status', input.status)
    }

    return apiRequest<UsersListResponse>(`/users?${params.toString()}`)
  })

/**
 * Invite user action
 */
export const inviteUserAction = createServerAction()
  .input(InviteUserSchema.omit({ storeId: true }))
  .handler(async ({ input }): Promise<UserResponse> => {
    return apiRequest<UserResponse>('/users/invite', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  })

/**
 * Update user role action
 */
export const updateUserRoleAction = createServerAction()
  .input(UpdateUserRoleSchema)
  .handler(async ({ input }): Promise<UserResponse> => {
    return apiRequest<UserResponse>(`/users/${input.userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role: input.role }),
    })
  })

/**
 * Deactivate user action
 */
export const deactivateUserAction = createServerAction()
  .input(z.object({ userId: z.string().min(1) }))
  .handler(async ({ input }): Promise<UserResponse> => {
    return apiRequest<UserResponse>(`/users/${input.userId}/deactivate`, {
      method: 'PATCH',
    })
  })
