'use server'

/**
 * Auth Server Actions
 *
 * Server Actions for authentication using zsa + tRPC.
 *
 * Data Flow:
 * Client Component → useServerActionMutation → Server Action → tRPC Client → NestJS API
 *
 * @see Epic-02 for architecture documentation
 */
import { createServerAction } from 'zsa'
import { LoginSchema } from '@trafi/validators'
import { trpc } from '@/lib/trpc'
import { setAuthCookies, deleteSession } from '@/lib/auth'
import { generateCsrfToken } from '@/lib/csrf'

/**
 * Login Server Action
 *
 * Authenticates user via tRPC and sets session cookies.
 * Returns user data on success.
 */
export const loginAction = createServerAction()
  .input(LoginSchema)
  .handler(async ({ input }) => {
    const { email, password } = input

    try {
      // Call tRPC auth.login mutation
      const result = await trpc.auth.login.mutate({ email, password })

      if (!result.success) {
        throw new Error('Login failed')
      }

      // Generate CSRF token for this session
      const csrfToken = generateCsrfToken()

      // Set auth cookies
      await setAuthCookies(result.accessToken, result.refreshToken, csrfToken)

      return {
        success: true as const,
        user: result.user,
      }
    } catch (error) {
      // Re-throw with user-friendly message
      if (error instanceof Error && error.message.includes('UNAUTHORIZED')) {
        throw new Error('Invalid credentials')
      }
      throw new Error('Unable to connect to the server')
    }
  })

/**
 * Logout Server Action
 *
 * Clears session cookies. Does not call tRPC logout
 * since we're using cookie-based auth.
 */
export const logoutAction = createServerAction()
  .handler(async () => {
    await deleteSession()
    return { success: true as const }
  })

/**
 * Alias for backward compatibility
 */
export const logout = logoutAction

/**
 * Refresh Token Server Action
 *
 * Refreshes access token via tRPC and updates cookies.
 */
export const refreshTokenAction = createServerAction()
  .handler(async () => {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get('trafi_refresh_token')?.value

    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    try {
      const result = await trpc.auth.refresh.mutate({ refreshToken })

      if (!result.success) {
        throw new Error('Refresh failed')
      }

      // Generate new CSRF token
      const csrfToken = generateCsrfToken()

      // Update cookies with new tokens
      await setAuthCookies(result.accessToken, result.refreshToken, csrfToken)

      return {
        success: true as const,
        user: result.user,
      }
    } catch {
      // Clear session on refresh failure
      await deleteSession()
      throw new Error('Session expired')
    }
  })
