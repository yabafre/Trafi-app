'use client'

import { useServerActionQuery } from '@/lib/server-action-hooks'
import { getUsersAction } from '../_actions/user-actions'
import type { ListUsersInput } from '@trafi/validators'

/**
 * Hook for fetching users list with React Query
 * Handles loading, error states, and caching automatically
 */
export function useUsers(input: ListUsersInput = { page: 1, limit: 20 }) {
  return useServerActionQuery(getUsersAction, {
    input,
    queryKey: ['users', input],
  })
}
