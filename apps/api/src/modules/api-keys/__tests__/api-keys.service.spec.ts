import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { ApiKeysService } from '../api-keys.service'
import { PrismaService } from '@database/prisma.service'
import { createHash } from 'crypto'

describe('ApiKeysService', () => {
  let service: ApiKeysService
  let mockPrisma: {
    apiKey: {
      findMany: jest.Mock
      findUnique: jest.Mock
      findFirst: jest.Mock
      count: jest.Mock
      create: jest.Mock
      update: jest.Mock
    }
  }

  const mockStoreId = 'store-123'
  const mockUserId = 'user-123'
  const mockApiKeyId = 'apikey-123'

  const createMockApiKey = (overrides = {}) => ({
    id: mockApiKeyId,
    storeId: mockStoreId,
    createdById: mockUserId,
    name: 'Test API Key',
    keyHash: 'hashed-key-value',
    keyPrefix: 'trafi_sk_12345678',
    lastFourChars: 'abcd',
    scopes: ['products:read', 'orders:read'],
    expiresAt: null,
    lastUsedAt: null,
    revokedAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  })

  beforeEach(async () => {
    mockPrisma = {
      apiKey: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeysService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile()

    service = module.get<ApiKeysService>(ApiKeysService)
  })

  describe('create', () => {
    it('should create a new API key and return the plain key', async () => {
      const mockApiKey = createMockApiKey()
      mockPrisma.apiKey.create.mockResolvedValue(mockApiKey)

      const result = await service.create(mockStoreId, mockUserId, {
        name: 'Test API Key',
        scopes: ['products:read', 'orders:read'],
      })

      expect(result).toMatchObject({
        id: mockApiKeyId,
        name: 'Test API Key',
        keyPrefix: expect.stringContaining('trafi_sk_'),
        lastFourChars: expect.any(String),
        scopes: ['products:read', 'orders:read'],
        createdAt: mockApiKey.createdAt,
      })

      // Verify the plain key is returned
      expect(result.key).toBeDefined()
      expect(result.key).toMatch(/^trafi_sk_[a-f0-9]{64}$/)

      // Verify the hash is stored correctly
      expect(mockPrisma.apiKey.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          storeId: mockStoreId,
          createdById: mockUserId,
          name: 'Test API Key',
          scopes: ['products:read', 'orders:read'],
          keyHash: expect.any(String),
          keyPrefix: expect.stringContaining('trafi_sk_'),
          lastFourChars: expect.any(String),
        }),
      })
    })

    it('should create API key with expiration date', async () => {
      const expiresAt = new Date('2025-12-31')
      const mockApiKey = createMockApiKey({ expiresAt })
      mockPrisma.apiKey.create.mockResolvedValue(mockApiKey)

      const result = await service.create(mockStoreId, mockUserId, {
        name: 'Expiring Key',
        scopes: ['products:read'],
        expiresAt,
      })

      expect(result.expiresAt).toEqual(expiresAt)
      expect(mockPrisma.apiKey.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          expiresAt,
        }),
      })
    })
  })

  describe('list', () => {
    it('should return paginated API keys list', async () => {
      const mockApiKeys = [
        createMockApiKey({ id: 'key-1', name: 'Key 1' }),
        createMockApiKey({ id: 'key-2', name: 'Key 2' }),
      ]
      mockPrisma.apiKey.findMany.mockResolvedValue(mockApiKeys)
      mockPrisma.apiKey.count.mockResolvedValue(2)

      const result = await service.list(mockStoreId, { page: 1, limit: 20, includeRevoked: false })

      expect(result).toEqual({
        data: expect.arrayContaining([
          expect.objectContaining({ id: 'key-1', name: 'Key 1' }),
          expect.objectContaining({ id: 'key-2', name: 'Key 2' }),
        ]),
        meta: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1,
        },
      })

      // Verify query excludes revoked keys by default
      expect(mockPrisma.apiKey.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { storeId: mockStoreId, revokedAt: null },
          skip: 0,
          take: 20,
        })
      )
    })

    it('should include revoked keys when requested', async () => {
      mockPrisma.apiKey.findMany.mockResolvedValue([])
      mockPrisma.apiKey.count.mockResolvedValue(0)

      await service.list(mockStoreId, { page: 1, limit: 10, includeRevoked: true })

      expect(mockPrisma.apiKey.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { storeId: mockStoreId },
        })
      )
    })

    it('should calculate pagination correctly', async () => {
      mockPrisma.apiKey.findMany.mockResolvedValue([])
      mockPrisma.apiKey.count.mockResolvedValue(50)

      const result = await service.list(mockStoreId, { page: 2, limit: 10, includeRevoked: false })

      expect(mockPrisma.apiKey.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10, // (page 2 - 1) * limit 10
          take: 10,
        })
      )
      expect(result.meta.totalPages).toBe(5)
    })
  })

  describe('findOne', () => {
    it('should return a single API key', async () => {
      const mockApiKey = createMockApiKey()
      mockPrisma.apiKey.findFirst.mockResolvedValue(mockApiKey)

      const result = await service.findOne(mockStoreId, mockApiKeyId)

      expect(result).toMatchObject({
        id: mockApiKeyId,
        name: 'Test API Key',
        keyPrefix: 'trafi_sk_12345678',
        lastFourChars: 'abcd',
      })

      // Verify it doesn't return the plain key
      expect(result).not.toHaveProperty('key')
    })

    it('should throw NotFoundException if key not found', async () => {
      mockPrisma.apiKey.findFirst.mockResolvedValue(null)

      await expect(
        service.findOne(mockStoreId, 'nonexistent-key')
      ).rejects.toThrow(NotFoundException)
    })

    it('should throw NotFoundException if key belongs to different store', async () => {
      mockPrisma.apiKey.findFirst.mockResolvedValue(null) // findFirst with storeId filter returns null

      await expect(
        service.findOne('different-store', mockApiKeyId)
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('revoke', () => {
    it('should revoke an API key', async () => {
      const mockApiKey = createMockApiKey()
      const revokedAt = new Date()
      const revokedApiKey = { ...mockApiKey, revokedAt }

      mockPrisma.apiKey.findFirst.mockResolvedValue(mockApiKey)
      mockPrisma.apiKey.update.mockResolvedValue(revokedApiKey)

      const result = await service.revoke(mockStoreId, mockApiKeyId)

      expect(result.revokedAt).toBeTruthy()
      expect(mockPrisma.apiKey.update).toHaveBeenCalledWith({
        where: { id: mockApiKeyId },
        data: { revokedAt: expect.any(Date) },
      })
    })

    it('should return already revoked key without updating', async () => {
      const revokedAt = new Date('2024-01-15')
      const alreadyRevokedKey = createMockApiKey({ revokedAt })
      mockPrisma.apiKey.findFirst.mockResolvedValue(alreadyRevokedKey)

      const result = await service.revoke(mockStoreId, mockApiKeyId)

      expect(result.revokedAt).toEqual(revokedAt)
      expect(mockPrisma.apiKey.update).not.toHaveBeenCalled()
    })

    it('should throw NotFoundException if key not found', async () => {
      mockPrisma.apiKey.findFirst.mockResolvedValue(null)

      await expect(
        service.revoke(mockStoreId, 'nonexistent-key')
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('validateApiKey', () => {
    it('should return ApiKey for valid key', async () => {
      // Generate a valid test key
      const testKey = 'trafi_sk_' + 'a'.repeat(64)
      const keyHash = createHash('sha256').update(testKey).digest('hex')
      const mockApiKey = createMockApiKey({ keyHash })

      mockPrisma.apiKey.findUnique.mockResolvedValue(mockApiKey)
      mockPrisma.apiKey.update.mockResolvedValue(mockApiKey) // For lastUsedAt update

      const result = await service.validateApiKey(testKey)

      expect(result).toEqual(mockApiKey)
      expect(mockPrisma.apiKey.findUnique).toHaveBeenCalledWith({
        where: { keyHash },
      })
    })

    it('should return null for invalid key format', async () => {
      const result = await service.validateApiKey('invalid-key-format')

      expect(result).toBeNull()
      expect(mockPrisma.apiKey.findUnique).not.toHaveBeenCalled()
    })

    it('should return null for nonexistent key', async () => {
      mockPrisma.apiKey.findUnique.mockResolvedValue(null)

      const result = await service.validateApiKey('trafi_sk_' + 'b'.repeat(64))

      expect(result).toBeNull()
    })

    it('should return null for revoked key', async () => {
      const revokedKey = createMockApiKey({ revokedAt: new Date() })
      mockPrisma.apiKey.findUnique.mockResolvedValue(revokedKey)

      const result = await service.validateApiKey('trafi_sk_' + 'c'.repeat(64))

      expect(result).toBeNull()
    })

    it('should return null for expired key', async () => {
      const expiredKey = createMockApiKey({
        expiresAt: new Date('2020-01-01'), // Past date
      })
      mockPrisma.apiKey.findUnique.mockResolvedValue(expiredKey)

      const result = await service.validateApiKey('trafi_sk_' + 'd'.repeat(64))

      expect(result).toBeNull()
    })

    it('should return valid key if not yet expired', async () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1) // 1 year from now

      const validKey = createMockApiKey({ expiresAt: futureDate })
      mockPrisma.apiKey.findUnique.mockResolvedValue(validKey)
      mockPrisma.apiKey.update.mockResolvedValue(validKey)

      const result = await service.validateApiKey('trafi_sk_' + 'e'.repeat(64))

      expect(result).toEqual(validKey)
    })
  })

  describe('key generation', () => {
    it('should generate keys with correct format', async () => {
      const mockApiKey = createMockApiKey()
      mockPrisma.apiKey.create.mockResolvedValue(mockApiKey)

      const result = await service.create(mockStoreId, mockUserId, {
        name: 'Test',
        scopes: ['products:read'],
      })

      // Key format: trafi_sk_{64 hex chars}
      expect(result.key).toMatch(/^trafi_sk_[a-f0-9]{64}$/)

      // Prefix should be trafi_sk_ + first 8 hex chars = 18 chars total
      expect(result.keyPrefix).toMatch(/^trafi_sk_[a-f0-9]{8}$/)

      // Last four chars should be 4 hex chars
      expect(result.lastFourChars).toMatch(/^[a-f0-9]{4}$/)
    })

    it('should generate unique keys', async () => {
      const mockApiKey = createMockApiKey()
      mockPrisma.apiKey.create.mockResolvedValue(mockApiKey)

      const keys = new Set<string>()

      // Generate 10 keys and verify uniqueness
      for (let i = 0; i < 10; i++) {
        const result = await service.create(mockStoreId, mockUserId, {
          name: `Key ${i}`,
          scopes: ['products:read'],
        })
        keys.add(result.key)
      }

      expect(keys.size).toBe(10)
    })
  })
})
