import { cookies } from 'next/headers'
import { verifyToken, isTokenExpired, type SessionPayload } from './session'
import { generateCsrfToken } from './csrf'

const ACCESS_TOKEN_COOKIE = 'trafi_access_token'
const REFRESH_TOKEN_COOKIE = 'trafi_refresh_token'
const CSRF_TOKEN_COOKIE = 'trafi_csrf_token'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export interface AuthUser {
  id: string
  email: string
  name: string | null
  role: string
  tenantId: string
  permissions: string[]
}

export interface AuthSession {
  user: AuthUser
  accessToken: string
  expiresAt: number
}

/**
 * Get the current session from cookies (Server-side only)
 * Returns null if no valid session exists
 */
export async function getSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value

  if (!accessToken) {
    return null
  }

  const payload = await verifyToken(accessToken)

  if (!payload) {
    return null
  }

  // Check if token is expired
  if (isTokenExpired(payload)) {
    // Try to refresh the token
    const refreshed = await refreshSession()
    if (refreshed) {
      return refreshed
    }
    return null
  }

  // Fetch user data from API
  try {
    const user = await fetchCurrentUser(accessToken)
    if (!user) {
      return null
    }

    return {
      user,
      accessToken,
      expiresAt: payload.exp ?? 0,
    }
  } catch {
    return null
  }
}

/**
 * Verify if a valid session exists (faster than getSession - doesn't fetch user)
 */
export async function verifySession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value

  if (!accessToken) {
    return null
  }

  const payload = await verifyToken(accessToken)

  if (!payload || isTokenExpired(payload)) {
    return null
  }

  return payload
}

/**
 * Refresh the session using the refresh token
 */
export async function refreshSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value

  if (!refreshToken) {
    return null
  }

  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()

    const payload = await verifyToken(data.accessToken)
    if (!payload) {
      return null
    }

    // Persist new tokens to cookies
    const csrfToken = generateCsrfToken()
    await setAuthCookies(data.accessToken, data.refreshToken, csrfToken)

    return {
      user: data.user,
      accessToken: data.accessToken,
      expiresAt: payload.exp ?? 0,
    }
  } catch {
    return null
  }
}

/**
 * Fetch current user from API
 */
async function fetchCurrentUser(accessToken: string): Promise<AuthUser | null> {
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return null
    }

    return response.json()
  } catch {
    return null
  }
}

/**
 * Set auth cookies (Server Actions only)
 */
export async function setAuthCookies(
  accessToken: string,
  refreshToken: string,
  csrfToken: string
): Promise<void> {
  const cookieStore = await cookies()

  // Access token - 15 minutes
  cookieStore.set(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60, // 15 minutes
  })

  // Refresh token - 7 days
  cookieStore.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  })

  // CSRF token - NOT httpOnly so client JS can read it for double-submit pattern
  cookieStore.set(CSRF_TOKEN_COOKIE, csrfToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  })
}

/**
 * Clear all auth cookies (Server Actions only)
 */
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies()

  cookieStore.delete(ACCESS_TOKEN_COOKIE)
  cookieStore.delete(REFRESH_TOKEN_COOKIE)
  cookieStore.delete(CSRF_TOKEN_COOKIE)
}

/**
 * Get CSRF token from cookie
 */
export async function getCsrfToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(CSRF_TOKEN_COOKIE)?.value ?? null
}
