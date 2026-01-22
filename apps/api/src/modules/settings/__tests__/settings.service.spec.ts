import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { SettingsService } from '../settings.service'
import { PrismaService } from '@database/prisma.service'

describe('SettingsService', () => {
  let service: SettingsService
  let mockPrisma: {
    store: {
      findUnique: jest.Mock
    }
    storeSettings: {
      upsert: jest.Mock
    }
  }
  let mockEventEmitter: {
    emit: jest.Mock
  }

  const mockStoreId = 'store-123'
  const mockSettingsId = 'settings-123'

  const createMockStore = (overrides = {}) => ({
    id: mockStoreId,
    name: 'Test Store',
    slug: 'test-store',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    settings: null,
    ...overrides,
  })

  const createMockSettings = (overrides = {}) => ({
    id: mockSettingsId,
    storeId: mockStoreId,
    name: 'My Store',
    description: null,
    slug: null,
    defaultCurrency: 'EUR',
    defaultLocale: 'en',
    timezone: 'UTC',
    weightUnit: 'g',
    taxIncluded: true,
    autoArchiveOrders: false,
    orderNumberPrefix: 'ORD-',
    lowStockThreshold: 5,
    contactEmail: null,
    supportEmail: null,
    phoneNumber: null,
    address: null,
    primaryColor: '#CCFF00',
    logoUrl: null,
    faviconUrl: null,
    // Commerce Feature Flags (Story 3.R1)
    promotionsEnabled: true,
    maxDiscountPercent: 100,
    allowStackablePromos: false,
    giftCardsEnabled: false,
    giftCardMinCents: 1000,
    giftCardMaxCents: 50000,
    giftCardValidityDays: null,
    multiCurrencyEnabled: false,
    displayPriceIncTax: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  })

  beforeEach(async () => {
    mockPrisma = {
      store: {
        findUnique: jest.fn(),
      },
      storeSettings: {
        upsert: jest.fn(),
      },
    }

    mockEventEmitter = {
      emit: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile()

    service = module.get<SettingsService>(SettingsService)
  })

  describe('get', () => {
    it('should return default settings when none exist', async () => {
      const mockStore = createMockStore({ settings: null })
      mockPrisma.store.findUnique.mockResolvedValue(mockStore)

      const result = await service.get(mockStoreId)

      expect(result.storeId).toBe(mockStoreId)
      expect(result.name).toBe('My Store')
      expect(result.defaultCurrency).toBe('EUR')
      expect(result.primaryColor).toBe('#CCFF00')
      expect(result.id).toBe('') // Empty ID for default settings

      expect(mockPrisma.store.findUnique).toHaveBeenCalledWith({
        where: { id: mockStoreId },
        include: { settings: true },
      })
    })

    it('should return existing settings when they exist', async () => {
      const mockSettings = createMockSettings({
        name: 'Custom Store Name',
        defaultCurrency: 'USD',
        primaryColor: '#FF0000',
      })
      const mockStore = createMockStore({ settings: mockSettings })
      mockPrisma.store.findUnique.mockResolvedValue(mockStore)

      const result = await service.get(mockStoreId)

      expect(result.id).toBe(mockSettingsId)
      expect(result.name).toBe('Custom Store Name')
      expect(result.defaultCurrency).toBe('USD')
      expect(result.primaryColor).toBe('#FF0000')
    })

    it('should throw NotFoundException if store not found', async () => {
      mockPrisma.store.findUnique.mockResolvedValue(null)

      await expect(service.get('nonexistent-store')).rejects.toThrow(NotFoundException)
    })
  })

  describe('update', () => {
    it('should create settings with upsert when updating for first time', async () => {
      const mockStore = createMockStore({ settings: null })
      const newSettings = createMockSettings({
        name: 'New Store Name',
        description: 'A great store',
      })

      mockPrisma.store.findUnique.mockResolvedValue(mockStore)
      mockPrisma.storeSettings.upsert.mockResolvedValue(newSettings)

      const result = await service.update(mockStoreId, {
        name: 'New Store Name',
        description: 'A great store',
      })

      expect(result.name).toBe('New Store Name')
      expect(result.description).toBe('A great store')

      expect(mockPrisma.storeSettings.upsert).toHaveBeenCalledWith({
        where: { storeId: mockStoreId },
        update: expect.objectContaining({
          name: 'New Store Name',
          description: 'A great store',
          updatedAt: expect.any(Date),
        }),
        create: expect.objectContaining({
          storeId: mockStoreId,
          name: 'New Store Name',
          description: 'A great store',
        }),
      })
    })

    it('should emit event on settings update', async () => {
      const mockStore = createMockStore()
      const updatedSettings = createMockSettings({ name: 'Updated Name' })

      mockPrisma.store.findUnique.mockResolvedValue(mockStore)
      mockPrisma.storeSettings.upsert.mockResolvedValue(updatedSettings)

      await service.update(mockStoreId, { name: 'Updated Name' })

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'system.store.settings_updated',
        expect.objectContaining({
          storeId: mockStoreId,
          settings: expect.objectContaining({
            name: 'Updated Name',
          }),
          timestamp: expect.any(String),
        })
      )
    })

    it('should throw NotFoundException if store not found', async () => {
      mockPrisma.store.findUnique.mockResolvedValue(null)

      await expect(
        service.update('nonexistent-store', { name: 'Test' })
      ).rejects.toThrow(NotFoundException)

      expect(mockEventEmitter.emit).not.toHaveBeenCalled()
    })

    it('should only update provided fields', async () => {
      const mockStore = createMockStore()
      const updatedSettings = createMockSettings({ primaryColor: '#00FF00' })

      mockPrisma.store.findUnique.mockResolvedValue(mockStore)
      mockPrisma.storeSettings.upsert.mockResolvedValue(updatedSettings)

      await service.update(mockStoreId, { primaryColor: '#00FF00' })

      expect(mockPrisma.storeSettings.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            primaryColor: '#00FF00',
          }),
        })
      )

      // Verify other fields are not in update
      const upsertCall = mockPrisma.storeSettings.upsert.mock.calls[0][0]
      expect(upsertCall.update).not.toHaveProperty('name')
      expect(upsertCall.update).not.toHaveProperty('defaultCurrency')
    })
  })

  describe('tenant isolation', () => {
    it('should get settings only for specified storeId', async () => {
      const mockStore = createMockStore()
      mockPrisma.store.findUnique.mockResolvedValue(mockStore)

      await service.get(mockStoreId)

      expect(mockPrisma.store.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockStoreId },
        })
      )
    })

    it('should not return settings from different store', async () => {
      const differentStoreId = 'different-store-456'
      const mockStore = createMockStore({ id: differentStoreId, settings: null })
      mockPrisma.store.findUnique.mockResolvedValue(mockStore)

      const result = await service.get(differentStoreId)

      expect(result.storeId).toBe(differentStoreId)
      expect(mockPrisma.store.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: differentStoreId },
        })
      )
    })

    it('should update settings only for specified storeId', async () => {
      const mockStore = createMockStore()
      const updatedSettings = createMockSettings()

      mockPrisma.store.findUnique.mockResolvedValue(mockStore)
      mockPrisma.storeSettings.upsert.mockResolvedValue(updatedSettings)

      await service.update(mockStoreId, { name: 'Test' })

      expect(mockPrisma.storeSettings.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { storeId: mockStoreId },
          create: expect.objectContaining({
            storeId: mockStoreId,
          }),
        })
      )
    })
  })

  describe('default settings values', () => {
    it('should return correct default values', async () => {
      const mockStore = createMockStore({ settings: null })
      mockPrisma.store.findUnique.mockResolvedValue(mockStore)

      const result = await service.get(mockStoreId)

      // Verify all default values
      expect(result.name).toBe('My Store')
      expect(result.description).toBeNull()
      expect(result.slug).toBeNull()
      expect(result.defaultCurrency).toBe('EUR')
      expect(result.defaultLocale).toBe('en')
      expect(result.timezone).toBe('UTC')
      expect(result.weightUnit).toBe('g')
      expect(result.taxIncluded).toBe(true)
      expect(result.autoArchiveOrders).toBe(false)
      expect(result.orderNumberPrefix).toBe('ORD-')
      expect(result.lowStockThreshold).toBe(5)
      expect(result.contactEmail).toBeNull()
      expect(result.supportEmail).toBeNull()
      expect(result.phoneNumber).toBeNull()
      expect(result.address).toBeNull()
      expect(result.primaryColor).toBe('#CCFF00') // Brutalist accent
      expect(result.logoUrl).toBeNull()
      expect(result.faviconUrl).toBeNull()
    })
  })

  describe('response mapping', () => {
    it('should correctly map Prisma model to response DTO', async () => {
      const mockSettings = createMockSettings({
        id: 'settings-xyz',
        storeId: 'store-abc',
        name: 'Mapped Store',
        description: 'A description',
        slug: 'mapped-store',
        address: { street: '123 Main St', city: 'Paris', postalCode: '75001', country: 'FR' },
      })
      const mockStore = createMockStore({ settings: mockSettings })
      mockPrisma.store.findUnique.mockResolvedValue(mockStore)

      const result = await service.get('store-abc')

      expect(result).toEqual(
        expect.objectContaining({
          id: 'settings-xyz',
          storeId: 'store-abc',
          name: 'Mapped Store',
          description: 'A description',
          slug: 'mapped-store',
          address: {
            street: '123 Main St',
            city: 'Paris',
            postalCode: '75001',
            country: 'FR',
          },
        })
      )
    })
  })

  // Story 3.R1 - Commerce Feature Flags Tests
  describe('commerce feature flags (Story 3.R1)', () => {
    it('should return default commerce feature flags when none exist', async () => {
      const mockStore = createMockStore({ settings: null })
      mockPrisma.store.findUnique.mockResolvedValue(mockStore)

      const result = await service.get(mockStoreId)

      // Promotions defaults
      expect(result.promotionsEnabled).toBe(true)
      expect(result.maxDiscountPercent).toBe(100)
      expect(result.allowStackablePromos).toBe(false)

      // Gift cards defaults
      expect(result.giftCardsEnabled).toBe(false)
      expect(result.giftCardMinCents).toBe(1000)
      expect(result.giftCardMaxCents).toBe(50000)
      expect(result.giftCardValidityDays).toBeNull()

      // Multi-currency defaults
      expect(result.multiCurrencyEnabled).toBe(false)
      expect(result.displayPriceIncTax).toBe(true)
    })

    it('should update promotions feature flags', async () => {
      const mockStore = createMockStore()
      const updatedSettings = createMockSettings({
        promotionsEnabled: false,
        maxDiscountPercent: 50,
        allowStackablePromos: true,
      })

      mockPrisma.store.findUnique.mockResolvedValue(mockStore)
      mockPrisma.storeSettings.upsert.mockResolvedValue(updatedSettings)

      const result = await service.update(mockStoreId, {
        promotionsEnabled: false,
        maxDiscountPercent: 50,
        allowStackablePromos: true,
      })

      expect(result.promotionsEnabled).toBe(false)
      expect(result.maxDiscountPercent).toBe(50)
      expect(result.allowStackablePromos).toBe(true)
    })

    it('should update gift cards feature flags', async () => {
      const mockStore = createMockStore()
      const updatedSettings = createMockSettings({
        giftCardsEnabled: true,
        giftCardMinCents: 500,
        giftCardMaxCents: 100000,
        giftCardValidityDays: 365,
      })

      mockPrisma.store.findUnique.mockResolvedValue(mockStore)
      mockPrisma.storeSettings.upsert.mockResolvedValue(updatedSettings)

      const result = await service.update(mockStoreId, {
        giftCardsEnabled: true,
        giftCardMinCents: 500,
        giftCardMaxCents: 100000,
        giftCardValidityDays: 365,
      })

      expect(result.giftCardsEnabled).toBe(true)
      expect(result.giftCardMinCents).toBe(500)
      expect(result.giftCardMaxCents).toBe(100000)
      expect(result.giftCardValidityDays).toBe(365)
    })

    it('should update multi-currency feature flags', async () => {
      const mockStore = createMockStore()
      const updatedSettings = createMockSettings({
        multiCurrencyEnabled: true,
        displayPriceIncTax: false,
      })

      mockPrisma.store.findUnique.mockResolvedValue(mockStore)
      mockPrisma.storeSettings.upsert.mockResolvedValue(updatedSettings)

      const result = await service.update(mockStoreId, {
        multiCurrencyEnabled: true,
        displayPriceIncTax: false,
      })

      expect(result.multiCurrencyEnabled).toBe(true)
      expect(result.displayPriceIncTax).toBe(false)
    })

    it('should preserve commerce flags when updating other fields', async () => {
      const mockSettings = createMockSettings({
        promotionsEnabled: false,
        giftCardsEnabled: true,
        multiCurrencyEnabled: true,
      })
      const mockStore = createMockStore({ settings: mockSettings })
      const updatedSettings = createMockSettings({
        ...mockSettings,
        name: 'Updated Name',
      })

      mockPrisma.store.findUnique.mockResolvedValue(mockStore)
      mockPrisma.storeSettings.upsert.mockResolvedValue(updatedSettings)

      await service.update(mockStoreId, { name: 'Updated Name' })

      // Verify only name is in update payload, not commerce flags
      const upsertCall = mockPrisma.storeSettings.upsert.mock.calls[0][0]
      expect(upsertCall.update).toHaveProperty('name', 'Updated Name')
      expect(upsertCall.update).not.toHaveProperty('promotionsEnabled')
      expect(upsertCall.update).not.toHaveProperty('giftCardsEnabled')
    })
  })
})
