/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCsrfToken(): string {
  // Use Web Crypto API for Edge Runtime compatibility
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Validate that the CSRF token from the header matches the cookie token
 * Uses constant-time comparison to prevent timing attacks
 */
export function validateCsrfToken(
  cookieToken: string | null | undefined,
  headerToken: string | null | undefined
): boolean {
  if (!cookieToken || !headerToken) {
    return false
  }

  if (cookieToken.length !== headerToken.length) {
    return false
  }

  // Constant-time comparison
  let result = 0
  for (let i = 0; i < cookieToken.length; i++) {
    result |= cookieToken.charCodeAt(i) ^ headerToken.charCodeAt(i)
  }

  return result === 0
}

/**
 * CSRF header name for client requests
 */
export const CSRF_HEADER_NAME = 'X-CSRF-Token'

/**
 * CSRF cookie name (must match server-side)
 */
export const CSRF_COOKIE_NAME = 'trafi_csrf_token'

/**
 * Get CSRF token from cookie (client-side only)
 * Returns null if cookie is not found or if running on server
 */
export function getCsrfTokenClient(): string | null {
  if (typeof document === 'undefined') {
    return null
  }

  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === CSRF_COOKIE_NAME) {
      return decodeURIComponent(value)
    }
  }

  return null
}
