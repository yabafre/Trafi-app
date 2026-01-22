import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException, BadRequestException } from '@nestjs/common'
import { GiftCardTemplateService } from '../gift-card-template.service'
import { PrismaService } from '@database/prisma.service'

/**
 * GiftCardTemplateService Unit Tests
 *
 * Tests cover:
 * - Template CRUD operations
 * - Denomination validation
 * - Custom amount range validation
 * - Activate/Deactivate operations
 * - Tenant isolation (storeId scoping)
 * - Pagination and filtering
 *
 * @see Story 3.10 - Gift Cards (AC1, AC6)
 */
describe('GiftCardTemplateService', () => {
  let service: GiftCardTemplateService
  let prismaService: {
    giftCardTemplate: {
      findFirst: jest.Mock
      findMany: jest.Mock
      create: jest.Mock
      update: jest.Mock
      delete: jest.Mock
      count: jest.Mock
    }
  }

  const mockStoreId = 'store_test123'
  const mockTemplateId = 'gctpl_test123456789012'

  const mockTemplate = {
    id: mockTemplateId,
    storeId: mockStoreId,
    name: 'Birthday Card',
    description: 'Perfect for birthdays',
    designImageUrl: 'https://example.com/birthday.png',
    denominations: [2500, 5000, 10000],
    allowCustomAmount: false,
    minAmountCents: null,
    maxAmountCents: null,
    validityDays: 365,
    isActive: true,
    createdAt: new Date('2026-01-17'),
    updatedAt: new Date('2026-01-17'),
  }

  beforeEach(async () => {
    const mockPrismaService = {
      giftCardTemplate: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GiftCardTemplateService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile()

    service = module.get<GiftCardTemplateService>(GiftCardTemplateService)
    prismaService = module.get(PrismaService)
  })

  // ===========================================================================
  // CREATE Tests
  // ===========================================================================
  describe('create', () => {
    it('should create a template with valid data', async () => {
      prismaService.giftCardTemplate.create.mockResolvedValue(mockTemplate)

      const result = await service.create(mockStoreId, {
        name: 'Birthday Card',
        description: 'Perfect for birthdays',
        designImageUrl: 'https://example.com/birthday.png',
        denominations: [2500, 5000, 10000],
        allowCustomAmount: false,
        isActive: true,
        validityDays: 365,
      })

      expect(result).toBeDefined()
      expect(result.name).toBe('Birthday Card')
      expect(result.denominations).toEqual([2500, 5000, 10000])
      expect(result.validityDays).toBe(365)
      expect(result.isActive).toBe(true)
    })

    it('should create template with custom amount enabled', async () => {
      const templateWithCustom = {
        ...mockTemplate,
        allowCustomAmount: true,
        minAmountCents: 500,
        maxAmountCents: 50000,
      }
      prismaService.giftCardTemplate.create.mockResolvedValue(templateWithCustom)

      const result = await service.create(mockStoreId, {
        name: 'Custom Amount Card',
        denominations: [5000],
        allowCustomAmount: true,
        isActive: true,
        minAmountCents: 500,
        maxAmountCents: 50000,
      })

      expect(result.allowCustomAmount).toBe(true)
      expect(result.minAmountCents).toBe(500)
      expect(result.maxAmountCents).toBe(50000)
    })

    it('should throw BadRequestException for empty denominations', async () => {
      await expect(
        service.create(mockStoreId, {
          name: 'Invalid Template',
          denominations: [],
          allowCustomAmount: false,
          isActive: true,
        }),
      ).rejects.toThrow(BadRequestException)
    })

    it('should throw BadRequestException for negative denominations', async () => {
      await expect(
        service.create(mockStoreId, {
          name: 'Invalid Template',
          denominations: [5000, -1000, 10000],
          allowCustomAmount: false,
          isActive: true,
        }),
      ).rejects.toThrow(BadRequestException)
    })

    it('should throw BadRequestException for duplicate denominations', async () => {
      await expect(
        service.create(mockStoreId, {
          name: 'Invalid Template',
          denominations: [5000, 5000, 10000],
          allowCustomAmount: false,
          isActive: true,
        }),
      ).rejects.toThrow(BadRequestException)
    })

    it('should throw BadRequestException when allowCustomAmount is true but min/max missing', async () => {
      await expect(
        service.create(mockStoreId, {
          name: 'Invalid Template',
          denominations: [5000],
          allowCustomAmount: true,
          isActive: true,
          // Missing minAmountCents and maxAmountCents
        }),
      ).rejects.toThrow(BadRequestException)
    })

    it('should throw BadRequestException when maxAmountCents < minAmountCents', async () => {
      await expect(
        service.create(mockStoreId, {
          name: 'Invalid Template',
          denominations: [5000],
          allowCustomAmount: true,
          isActive: true,
          minAmountCents: 10000,
          maxAmountCents: 5000,
        }),
      ).rejects.toThrow(BadRequestException)
    })
  })

  // ===========================================================================
  // UPDATE Tests
  // ===========================================================================
  describe('update', () => {
    it('should update an existing template', async () => {
      const updatedTemplate = { ...mockTemplate, name: 'Updated Birthday Card' }
      prismaService.giftCardTemplate.findFirst.mockResolvedValue(mockTemplate)
      prismaService.giftCardTemplate.update.mockResolvedValue(updatedTemplate)

      const result = await service.update(mockStoreId, mockTemplateId, {
        name: 'Updated Birthday Card',
      })

      expect(result.name).toBe('Updated Birthday Card')
    })

    it('should throw NotFoundException if template does not exist', async () => {
      prismaService.giftCardTemplate.findFirst.mockResolvedValue(null)

      await expect(
        service.update(mockStoreId, mockTemplateId, { name: 'Updated' }),
      ).rejects.toThrow(NotFoundException)
    })

    it('should validate denominations when updated', async () => {
      prismaService.giftCardTemplate.findFirst.mockResolvedValue(mockTemplate)

      await expect(
        service.update(mockStoreId, mockTemplateId, {
          denominations: [],
        }),
      ).rejects.toThrow(BadRequestException)
    })

    it('should validate custom amount range on update', async () => {
      prismaService.giftCardTemplate.findFirst.mockResolvedValue(mockTemplate)

      await expect(
        service.update(mockStoreId, mockTemplateId, {
          allowCustomAmount: true,
          // Missing min/max
        }),
      ).rejects.toThrow(BadRequestException)
    })

    it('should enforce tenant isolation on update', async () => {
      prismaService.giftCardTemplate.findFirst.mockResolvedValue(null)

      await expect(
        service.update('other_store', mockTemplateId, { name: 'Hacked!' }),
      ).rejects.toThrow(NotFoundException)

      expect(prismaService.giftCardTemplate.findFirst).toHaveBeenCalledWith({
        where: { id: mockTemplateId, storeId: 'other_store' },
      })
    })
  })

  // ===========================================================================
  // DELETE Tests
  // ===========================================================================
  describe('delete', () => {
    it('should delete an existing template', async () => {
      prismaService.giftCardTemplate.findFirst.mockResolvedValue({
        ...mockTemplate,
        _count: { giftCards: 0 },
      })
      prismaService.giftCardTemplate.delete.mockResolvedValue(mockTemplate)

      await service.delete(mockStoreId, mockTemplateId)

      expect(prismaService.giftCardTemplate.delete).toHaveBeenCalledWith({
        where: { id: mockTemplateId },
      })
    })

    it('should throw NotFoundException if template does not exist', async () => {
      prismaService.giftCardTemplate.findFirst.mockResolvedValue(null)

      await expect(service.delete(mockStoreId, mockTemplateId)).rejects.toThrow(NotFoundException)
    })

    it('should still delete template with associated gift cards (with warning)', async () => {
      prismaService.giftCardTemplate.findFirst.mockResolvedValue({
        ...mockTemplate,
        _count: { giftCards: 10 },
      })
      prismaService.giftCardTemplate.delete.mockResolvedValue(mockTemplate)

      await service.delete(mockStoreId, mockTemplateId)

      expect(prismaService.giftCardTemplate.delete).toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // FIND BY ID Tests
  // ===========================================================================
  describe('findById', () => {
    it('should return a template by ID', async () => {
      prismaService.giftCardTemplate.findFirst.mockResolvedValue({
        ...mockTemplate,
        _count: { giftCards: 5 },
      })

      const result = await service.findById(mockStoreId, mockTemplateId)

      expect(result.id).toBe(mockTemplateId)
      expect(result.name).toBe('Birthday Card')
      expect(result.activeCardCount).toBe(5)
    })

    it('should throw NotFoundException if template does not exist', async () => {
      prismaService.giftCardTemplate.findFirst.mockResolvedValue(null)

      await expect(service.findById(mockStoreId, mockTemplateId)).rejects.toThrow(NotFoundException)
    })

    it('should enforce tenant isolation', async () => {
      prismaService.giftCardTemplate.findFirst.mockResolvedValue(null)

      await expect(service.findById('other_store', mockTemplateId)).rejects.toThrow(
        NotFoundException,
      )
      expect(prismaService.giftCardTemplate.findFirst).toHaveBeenCalledWith({
        where: { id: mockTemplateId, storeId: 'other_store' },
        include: expect.any(Object),
      })
    })
  })

  // ===========================================================================
  // LIST Tests
  // ===========================================================================
  describe('list', () => {
    it('should return paginated templates', async () => {
      const templates = [
        { ...mockTemplate, _count: { giftCards: 5 } },
        { ...mockTemplate, id: 'gctpl_2', name: 'Holiday Card', _count: { giftCards: 3 } },
      ]
      prismaService.giftCardTemplate.findMany.mockResolvedValue(templates)
      prismaService.giftCardTemplate.count.mockResolvedValue(2)

      const result = await service.list(mockStoreId, { page: 1, limit: 20 })

      expect(result.items).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.page).toBe(1)
      expect(result.hasMore).toBe(false)
    })

    it('should filter by isActive', async () => {
      prismaService.giftCardTemplate.findMany.mockResolvedValue([])
      prismaService.giftCardTemplate.count.mockResolvedValue(0)

      await service.list(mockStoreId, { isActive: true })

      expect(prismaService.giftCardTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
          }),
        }),
      )
    })

    it('should filter by search term', async () => {
      prismaService.giftCardTemplate.findMany.mockResolvedValue([])
      prismaService.giftCardTemplate.count.mockResolvedValue(0)

      await service.list(mockStoreId, { search: 'birthday' })

      expect(prismaService.giftCardTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: expect.any(Object) }),
              expect.objectContaining({ description: expect.any(Object) }),
            ]),
          }),
        }),
      )
    })

    it('should calculate hasMore correctly', async () => {
      const templates = Array(20).fill({ ...mockTemplate, _count: { giftCards: 0 } })
      prismaService.giftCardTemplate.findMany.mockResolvedValue(templates)
      prismaService.giftCardTemplate.count.mockResolvedValue(50)

      const result = await service.list(mockStoreId, { page: 1, limit: 20 })

      expect(result.hasMore).toBe(true)
    })
  })

  // ===========================================================================
  // ACTIVATE/DEACTIVATE Tests
  // ===========================================================================
  describe('activate', () => {
    it('should activate a template', async () => {
      const inactiveTemplate = { ...mockTemplate, isActive: false }
      prismaService.giftCardTemplate.findFirst.mockResolvedValue(inactiveTemplate)
      prismaService.giftCardTemplate.update.mockResolvedValue({ ...mockTemplate, isActive: true })

      const result = await service.activate(mockStoreId, mockTemplateId)

      expect(result.isActive).toBe(true)
      expect(prismaService.giftCardTemplate.update).toHaveBeenCalledWith({
        where: { id: mockTemplateId },
        data: { isActive: true },
      })
    })

    it('should throw NotFoundException if template does not exist', async () => {
      prismaService.giftCardTemplate.findFirst.mockResolvedValue(null)

      await expect(service.activate(mockStoreId, mockTemplateId)).rejects.toThrow(NotFoundException)
    })
  })

  describe('deactivate', () => {
    it('should deactivate a template', async () => {
      prismaService.giftCardTemplate.findFirst.mockResolvedValue(mockTemplate)
      prismaService.giftCardTemplate.update.mockResolvedValue({ ...mockTemplate, isActive: false })

      const result = await service.deactivate(mockStoreId, mockTemplateId)

      expect(result.isActive).toBe(false)
      expect(prismaService.giftCardTemplate.update).toHaveBeenCalledWith({
        where: { id: mockTemplateId },
        data: { isActive: false },
      })
    })

    it('should throw NotFoundException if template does not exist', async () => {
      prismaService.giftCardTemplate.findFirst.mockResolvedValue(null)

      await expect(service.deactivate(mockStoreId, mockTemplateId)).rejects.toThrow(NotFoundException)
    })
  })

  // ===========================================================================
  // LIST FOR SELECT Tests
  // ===========================================================================
  describe('listForSelect', () => {
    it('should return active templates for dropdown selection', async () => {
      const selectList = [
        { id: 'gctpl_1', name: 'Birthday Card', denominations: [5000, 10000], allowCustomAmount: false, validityDays: 365 },
        { id: 'gctpl_2', name: 'Holiday Card', denominations: [2500, 5000], allowCustomAmount: true, validityDays: null },
      ]
      prismaService.giftCardTemplate.findMany.mockResolvedValue(selectList)

      const result = await service.listForSelect(mockStoreId)

      expect(result).toHaveLength(2)
      expect(prismaService.giftCardTemplate.findMany).toHaveBeenCalledWith({
        where: { storeId: mockStoreId, isActive: true },
        select: {
          id: true,
          name: true,
          denominations: true,
          allowCustomAmount: true,
          validityDays: true,
        },
        orderBy: { name: 'asc' },
      })
    })
  })

  // ===========================================================================
  // Validation Method Tests
  // ===========================================================================
  describe('validation methods', () => {
    describe('validateDenominations', () => {
      it('should throw for empty array', () => {
        expect(() => (service as any).validateDenominations([])).toThrow(BadRequestException)
      })

      it('should throw for zero denomination', () => {
        expect(() => (service as any).validateDenominations([5000, 0, 10000])).toThrow(
          BadRequestException,
        )
      })

      it('should throw for negative denomination', () => {
        expect(() => (service as any).validateDenominations([5000, -1000])).toThrow(
          BadRequestException,
        )
      })

      it('should throw for duplicate denominations', () => {
        expect(() => (service as any).validateDenominations([5000, 5000])).toThrow(
          BadRequestException,
        )
      })

      it('should pass for valid denominations', () => {
        expect(() => (service as any).validateDenominations([2500, 5000, 10000])).not.toThrow()
      })
    })

    describe('validateCustomAmountRange', () => {
      it('should throw when allowCustomAmount is true and minAmountCents is missing', () => {
        expect(() =>
          (service as any).validateCustomAmountRange(true, null, 50000),
        ).toThrow(BadRequestException)
      })

      it('should throw when allowCustomAmount is true and maxAmountCents is missing', () => {
        expect(() =>
          (service as any).validateCustomAmountRange(true, 500, null),
        ).toThrow(BadRequestException)
      })

      it('should throw when maxAmountCents < minAmountCents', () => {
        expect(() =>
          (service as any).validateCustomAmountRange(true, 10000, 5000),
        ).toThrow(BadRequestException)
      })

      it('should pass when allowCustomAmount is false', () => {
        expect(() =>
          (service as any).validateCustomAmountRange(false, null, null),
        ).not.toThrow()
      })

      it('should pass with valid custom amount range', () => {
        expect(() =>
          (service as any).validateCustomAmountRange(true, 500, 50000),
        ).not.toThrow()
      })

      it('should pass when min equals max', () => {
        expect(() =>
          (service as any).validateCustomAmountRange(true, 5000, 5000),
        ).not.toThrow()
      })
    })
  })
})
