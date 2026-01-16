/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as jose from 'jose'
import {
  verifyToken,
  isTokenExpired,
  getTokenExpiresIn,
  toJwtPayload,
  type SessionPayload,
} from '../session'

const SECRET = new TextEncoder().encode(
  'development-secret-min-32-characters-long'
)

async function createTestToken(
  payload: Partial<SessionPayload>,
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
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-12T12:00:00Z'))
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

      const result = await verifyToken(token)

      expect(result).not.toBeNull()
      expect(result?.sub).toBe('user-123')
      expect(result?.tenantId).toBe('tenant-456')
      expect(result?.role).toBe('ADMIN')
      expect(result?.permissions).toEqual(['read', 'write'])
      expect(result?.type).toBe('session')
    })

    it('should return null for invalid token', async () => {
      const result = await verifyToken('invalid-token')
      expect(result).toBeNull()
    })

    it('should return null for expired token', async () => {
      const token = await createTestToken({}, '-1h') // Expired 1 hour ago

      const result = await verifyToken(token)
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

      const result = await verifyToken(token)
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

      const result = await verifyToken(token)
      expect(result).toBeNull()
    })
  })

  describe('isTokenExpired', () => {
    it('should return false for non-expired token', () => {
      const payload: SessionPayload = {
        sub: 'user-123',
        tenantId: 'tenant-456',
        role: 'ADMIN',
        permissions: [],
        type: 'session',
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      }

      expect(isTokenExpired(payload)).toBe(false)
    })

    it('should return true for expired token', () => {
      const payload: SessionPayload = {
        sub: 'user-123',
        tenantId: 'tenant-456',
        role: 'ADMIN',
        permissions: [],
        type: 'session',
        exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      }

      expect(isTokenExpired(payload)).toBe(true)
    })

    it('should return true for token without exp', () => {
      const payload: SessionPayload = {
        sub: 'user-123',
        tenantId: 'tenant-456',
        role: 'ADMIN',
        permissions: [],
        type: 'session',
      }

      expect(isTokenExpired(payload)).toBe(true)
    })

    it('should account for 5 second buffer', () => {
      const now = Math.floor(Date.now() / 1000)
      const payload: SessionPayload = {
        sub: 'user-123',
        tenantId: 'tenant-456',
        role: 'ADMIN',
        permissions: [],
        type: 'session',
        exp: now - 3, // 3 seconds ago (within 5 second buffer)
      }

      expect(isTokenExpired(payload)).toBe(false)
    })
  })

  describe('getTokenExpiresIn', () => {
    it('should return seconds until expiration', () => {
      const now = Math.floor(Date.now() / 1000)
      const payload: SessionPayload = {
        sub: 'user-123',
        tenantId: 'tenant-456',
        role: 'ADMIN',
        permissions: [],
        type: 'session',
        exp: now + 900, // 15 minutes from now
      }

      expect(getTokenExpiresIn(payload)).toBe(900)
    })

    it('should return 0 for expired token', () => {
      const payload: SessionPayload = {
        sub: 'user-123',
        tenantId: 'tenant-456',
        role: 'ADMIN',
        permissions: [],
        type: 'session',
        exp: Math.floor(Date.now() / 1000) - 3600,
      }

      expect(getTokenExpiresIn(payload)).toBe(0)
    })

    it('should return 0 for token without exp', () => {
      const payload: SessionPayload = {
        sub: 'user-123',
        tenantId: 'tenant-456',
        role: 'ADMIN',
        permissions: [],
        type: 'session',
      }

      expect(getTokenExpiresIn(payload)).toBe(0)
    })
  })

  describe('toJwtPayload', () => {
    it('should convert SessionPayload to JwtPayload', () => {
      const now = Math.floor(Date.now() / 1000)
      const session: SessionPayload = {
        sub: 'user-123',
        tenantId: 'tenant-456',
        role: 'ADMIN',
        permissions: ['read', 'write'],
        type: 'session',
        iat: now,
        exp: now + 900,
      }

      const result = toJwtPayload(session)

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
      const session: SessionPayload = {
        sub: 'user-123',
        tenantId: 'tenant-456',
        role: 'OWNER',
        permissions: [],
        type: 'session',
        exp: now + 900,
      }

      const result = toJwtPayload(session)

      expect(result.iat).toBe(now)
    })
  })
})
