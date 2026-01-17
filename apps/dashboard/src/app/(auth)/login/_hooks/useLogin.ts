'use client'

/**
 * useLogin Hook
 *
 * Custom hook for login functionality using zsa-react-query.
 *
 * Data Flow:
 * LoginForm → useLogin → useServerActionMutation → loginAction → tRPC → API
 *
 * @see Epic-02 for architecture documentation
 */
import { useRouter } from 'next/navigation'
import { useServerActionMutation } from '@/lib/server-action-hooks'
import { loginAction } from '../_actions/login'

/**
 * useLogin hook
 *
 * Provides login mutation with loading state and error handling.
 *
 * @example
 * ```tsx
 * const { login, isLoading, error } = useLogin()
 *
 * const handleSubmit = () => {
 *   login({ email, password })
 * }
 * ```
 */
export function useLogin() {
  const router = useRouter()

  const {
    mutate,
    mutateAsync,
    isPending: isLoading,
    error,
    isError,
    isSuccess,
    data,
    reset,
  } = useServerActionMutation(loginAction, {
    onSuccess: () => {
      // Redirect to dashboard on successful login
      router.push('/')
      router.refresh()
    },
  })

  return {
    /**
     * Execute login mutation (fire-and-forget)
     */
    login: mutate,

    /**
     * Execute login mutation (returns promise)
     */
    loginAsync: mutateAsync,

    /**
     * Loading state
     */
    isLoading,

    /**
     * Error from the last mutation
     */
    error: error?.message ?? null,

    /**
     * Whether the last mutation errored
     */
    isError,

    /**
     * Whether the last mutation succeeded
     */
    isSuccess,

    /**
     * Data from successful mutation
     */
    data,

    /**
     * Reset mutation state
     */
    reset,
  }
}
