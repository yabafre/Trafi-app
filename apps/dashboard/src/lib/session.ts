import { jwtVerify, type JWTPayload } from 'jose'
import type { JwtPayload } from '@trafi/types'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'development-secret-min-32-characters-long'
)

export interface SessionPayload extends JWTPayload {
  sub: string
  tenantId: string
  role: string
  permissions: string[]
  type: 'session' | 'api_key'
}

/**
 * Verify and decode a JWT token
 * Uses jose library for Edge Runtime compatibility
 */
export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    })

    // Validate required fields
    if (
      !payload.sub ||
      typeof payload.sub !== 'string' ||
      !payload.tenantId ||
      typeof payload.tenantId !== 'string'
    ) {
      return null
    }

    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

/**
 * Check if a token is expired
 */
export function isTokenExpired(payload: SessionPayload): boolean {
  if (!payload.exp) {
    return true
  }

  // Add 5 second buffer to account for clock skew
  const now = Math.floor(Date.now() / 1000)
  return payload.exp < now - 5
}

/**
 * Get time until token expires in seconds
 */
export function getTokenExpiresIn(payload: SessionPayload): number {
  if (!payload.exp) {
    return 0
  }

  const now = Math.floor(Date.now() / 1000)
  return Math.max(0, payload.exp - now)
}

/**
 * Convert SessionPayload to JwtPayload type from @trafi/types
 */
export function toJwtPayload(session: SessionPayload): JwtPayload {
  return {
    sub: session.sub,
    tenantId: session.tenantId,
    role: session.role as 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER',
    permissions: session.permissions,
    type: session.type,
    iat: session.iat ?? Math.floor(Date.now() / 1000),
    exp: session.exp ?? 0,
  }
}
