'use server'

import type { z } from 'zod'
import { LoginSchema } from '@trafi/validators'
import { setAuthCookies, deleteSession } from '@/lib/auth'
import { generateCsrfToken } from '@/lib/csrf'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

type LoginInput = z.infer<typeof LoginSchema>

interface LoginResult {
  success: boolean
  error?: string
}

/**
 * Login server action - authenticates user and sets session cookies
 */
export async function login(input: LoginInput): Promise<LoginResult> {
  // Validate input
  const validationResult = LoginSchema.safeParse(input)
  if (!validationResult.success) {
    return {
      success: false,
      error: 'Invalid email or password format',
    }
  }

  const { email, password } = validationResult.data

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      // API returns 401 for invalid credentials
      if (response.status === 401) {
        return {
          success: false,
          error: 'Invalid credentials',
        }
      }

      // Other errors
      return {
        success: false,
        error: 'An error occurred during login',
      }
    }

    const data = await response.json()

    // Generate CSRF token for this session
    const csrfToken = generateCsrfToken()

    // Set auth cookies
    await setAuthCookies(data.accessToken, data.refreshToken, csrfToken)

    return { success: true }
  } catch {
    return {
      success: false,
      error: 'Unable to connect to the server',
    }
  }
}

/**
 * Logout server action - clears session cookies
 */
export async function logout(): Promise<{ success: boolean }> {
  try {
    await deleteSession()
    return { success: true }
  } catch {
    return { success: false }
  }
}
