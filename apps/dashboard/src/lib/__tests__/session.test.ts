/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as jose from 'jose'

const TEST_SECRET = 'development-secret-min-32-characters-long'
const SECRET = new TextEncoder().encode(TEST_SECRET)

// Store original env value
const originalEnv = process.env.JWT_SECRET

// Type for the session module
type SessionModule = typeof import('../session')

async function createTestToken(
  payload: {
    sub?: string
    tenantId?: string
    role?: string
    permissions?: string[]
    type?: 'session' | 'api_key'
  },
  expiresIn: string = '15m'
): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  return new jose.SignJWT({
    sub: payload.sub ?? 'user-123',
    tenantId: payload.tenantId ?? 'tenant-456',
    role: payload.role ?? 'ADMIN',
    permissions: payload.permissions ?? ['read', 'write'],
    type: payload.type ?? 'session',
    iat: now,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(expiresIn)
    .sign(SECRET)
}

describe('session', () => {
  let sessionModule: SessionModule

  beforeEach(async () => {
    // Set env before importing
    process.env.JWT_SECRET = TEST_SECRET
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-12T12:00:00Z'))

    // Reset module cache and re-import to pick up new env value
    vi.resetModules()
    sessionModule = await import('../session')
  })

  afterEach(() => {
    vi.useRealTimers()
    process.env.JWT_SECRET = originalEnv
  })

  describe('verifyToken', () => {
    it('should return payload for valid token', async () => {
      const token = await createTestToken({
        sub: 'user-123',
        tenantId: 'tenant-456',
        role: 'ADMIN',
        permissions: ['read', 'write'],
        type: 'session',
      })

      const result = await sessionModule.verifyToken(token)

      expect(result).not.toBeNull()
      expect(result?.sub).toBe('user-123')
      expect(result?.tenantId).toBe('tenant-456')
      expect(result?.role).toBe('ADMIN')
      expect(result?.permissions).toEqual(['read', 'write'])
      expect(result?.type).toBe('session')
    })

    it('should return null for invalid token', async () => {
      const result = await sessionModule.verifyToken('invalid-token')
      expect(result).toBeNull()
    })

    it('should return null for expired token', async () => {
      const token = await createTestToken({}, '-1h') // Expired 1 hour ago

      const result = await sessionModule.verifyToken(token)
      expect(result).toBeNull()
    })

    it('should return null for token without sub', async () => {
      const token = await new jose.SignJWT({
        tenantId: 'tenant-456',
        role: 'ADMIN',
        permissions: [],
        type: 'session',
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('15m')
        .sign(SECRET)

      const result = await sessionModule.verifyToken(token)
      expect(result).toBeNull()
    })

    it('should return null for token without tenantId', async () => {
      const token = await new jose.SignJWT({
        sub: 'user-123',
        role: 'ADMIN',
        permissions: [],
        type: 'session',
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('15m')
        .sign(SECRET)

      const result = await sessionModule.verifyToken(token)
      expect(result).toBeNull()
    })
  })

  describe('isTokenExpired', () => {
    it('should return false for non-expired token', () => {
      const payload: SessionModule['SessionPayload'] = {
        sub: 'user-123',
        tenantId: 'tenant-456',
        role: 'ADMIN',
        permissions: [],
        type: 'session',
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      }

      expect(sessionModule.isTokenExpired(payload)).toBe(false)
    })

    it('should return true for expired token', () => {
      const payload: SessionModule['SessionPayload'] = {
        sub: 'user-123',
        tenantId: 'tenant-456',
        role: 'ADMIN',
        permissions: [],
        type: 'session',
        exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      }

      expect(sessionModule.isTokenExpired(payload)).toBe(true)
    })

    it('should return true for token without exp', () => {
      const payload: SessionModule['SessionPayload'] = {
        sub: 'user-123',
        tenantId: 'tenant-456',
        role: 'ADMIN',
        permissions: [],
        type: 'session',
      }

      expect(sessionModule.isTokenExpired(payload)).toBe(true)
    })

    it('should account for 5 second buffer', () => {
      const now = Math.floor(Date.now() / 1000)
      const payload: SessionModule['SessionPayload'] = {
        sub: 'user-123',
        tenantId: 'tenant-456',
        role: 'ADMIN',
        permissions: [],
        type: 'session',
        exp: now - 3, // 3 seconds ago (within 5 second buffer)
      }

      expect(sessionModule.isTokenExpired(payload)).toBe(false)
    })
  })

  describe('getTokenExpiresIn', () => {
    it('should return seconds until expiration', () => {
      const now = Math.floor(Date.now() / 1000)
      const payload: SessionModule['SessionPayload'] = {
        sub: 'user-123',
        tenantId: 'tenant-456',
        role: 'ADMIN',
        permissions: [],
        type: 'session',
        exp: now + 900, // 15 minutes from now
      }

      expect(sessionModule.getTokenExpiresIn(payload)).toBe(900)
    })

    it('should return 0 for expired token', () => {
      const payload: SessionModule['SessionPayload'] = {
        sub: 'user-123',
        tenantId: 'tenant-456',
        role: 'ADMIN',
        permissions: [],
        type: 'session',
        exp: Math.floor(Date.now() / 1000) - 3600,
      }

      expect(sessionModule.getTokenExpiresIn(payload)).toBe(0)
    })

    it('should return 0 for token without exp', () => {
      const payload: SessionModule['SessionPayload'] = {
        sub: 'user-123',
        tenantId: 'tenant-456',
        role: 'ADMIN',
        permissions: [],
        type: 'session',
      }

      expect(sessionModule.getTokenExpiresIn(payload)).toBe(0)
    })
  })

  describe('toJwtPayload', () => {
    it('should convert SessionPayload to JwtPayload', () => {
      const now = Math.floor(Date.now() / 1000)
      const session: SessionModule['SessionPayload'] = {
        sub: 'user-123',
        tenantId: 'tenant-456',
        role: 'ADMIN',
        permissions: ['read', 'write'],
        type: 'session',
        iat: now,
        exp: now + 900,
      }

      const result = sessionModule.toJwtPayload(session)

      expect(result).toEqual({
        sub: 'user-123',
        tenantId: 'tenant-456',
        role: 'ADMIN',
        permissions: ['read', 'write'],
        type: 'session',
        iat: now,
        exp: now + 900,
      })
    })

    it('should use current time for missing iat', () => {
      const now = Math.floor(Date.now() / 1000)
      const session: SessionModule['SessionPayload'] = {
        sub: 'user-123',
        tenantId: 'tenant-456',
        role: 'OWNER',
        permissions: [],
        type: 'session',
        exp: now + 900,
      }

      const result = sessionModule.toJwtPayload(session)

      expect(result.iat).toBe(now)
    })
  })
})
