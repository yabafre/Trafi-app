import { describe, it, expect } from 'vitest'
import { generateCsrfToken, validateCsrfToken, CSRF_HEADER_NAME } from '../csrf'

describe('csrf', () => {
  describe('generateCsrfToken', () => {
    it('should generate a 64-character hex string', () => {
      const token = generateCsrfToken()

      expect(token).toHaveLength(64)
      expect(/^[0-9a-f]+$/.test(token)).toBe(true)
    })

    it('should generate unique tokens', () => {
      const token1 = generateCsrfToken()
      const token2 = generateCsrfToken()

      expect(token1).not.toBe(token2)
    })
  })

  describe('validateCsrfToken', () => {
    it('should return true for matching tokens', () => {
      const token = generateCsrfToken()
      expect(validateCsrfToken(token, token)).toBe(true)
    })

    it('should return false for non-matching tokens', () => {
      const token1 = generateCsrfToken()
      const token2 = generateCsrfToken()

      expect(validateCsrfToken(token1, token2)).toBe(false)
    })

    it('should return false when cookie token is null', () => {
      const token = generateCsrfToken()
      expect(validateCsrfToken(null, token)).toBe(false)
    })

    it('should return false when header token is null', () => {
      const token = generateCsrfToken()
      expect(validateCsrfToken(token, null)).toBe(false)
    })

    it('should return false when cookie token is undefined', () => {
      const token = generateCsrfToken()
      expect(validateCsrfToken(undefined, token)).toBe(false)
    })

    it('should return false when header token is undefined', () => {
      const token = generateCsrfToken()
      expect(validateCsrfToken(token, undefined)).toBe(false)
    })

    it('should return false for tokens of different lengths', () => {
      expect(validateCsrfToken('short', 'this-is-a-much-longer-token')).toBe(false)
    })

    it('should use constant-time comparison', () => {
      // This test verifies the comparison logic works correctly
      // Actual timing analysis would require more sophisticated testing
      const token = 'a'.repeat(64)
      const differentToken = 'b'.repeat(64)
      const almostSameToken = 'a'.repeat(63) + 'b'

      expect(validateCsrfToken(token, token)).toBe(true)
      expect(validateCsrfToken(token, differentToken)).toBe(false)
      expect(validateCsrfToken(token, almostSameToken)).toBe(false)
    })
  })

  describe('CSRF_HEADER_NAME', () => {
    it('should be X-CSRF-Token', () => {
      expect(CSRF_HEADER_NAME).toBe('X-CSRF-Token')
    })
  })
})
