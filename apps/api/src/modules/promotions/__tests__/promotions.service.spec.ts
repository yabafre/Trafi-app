import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException, BadRequestException } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { PromotionsService } from '../promotions.service'
import { PrismaService } from '@database/prisma.service'

/**
 * PromotionsService Unit Tests
 *
 * Tests cover:
 * - Promotion CRUD operations
 * - Tenant isolation (storeId scoping)
 * - Status transitions (DRAFT -> ACTIVE -> PAUSED -> ARCHIVED)
 * - Validation (discount values, dates, conditions)
 * - Event emission
 * - Pagination and filtering
 *
 * @see Story 3.9 - Promotions & Discounts Foundation
 */
describe('PromotionsService', () => {
  let service: PromotionsService
  let prismaService: {
    promotion: {
      findFirst: jest.Mock
      findMany: jest.Mock
      create: jest.Mock
      update: jest.Mock
      delete: jest.Mock
      count: jest.Mock
      updateMany: jest.Mock
    }
  }
  let eventEmitter: { emit: jest.Mock }

  const mockStoreId = 'store_test123'
  const mockPromotionId = 'promo_test123456789012'

  const mockPromotion = {
    id: mockPromotionId,
    storeId: mockStoreId,
    name: 'Summer Sale',
    description: '20% off all products',
    type: 'PERCENT' as const,
    discountValue: 20,
    conditions: { minOrderCents: 5000 },
    conditionsVersion: 1,
    maxDiscountCents: 10000,
    usageLimit: 100,
    usageCount: 0,
    perCustomerLimit: 2,
    startsAt: new Date('2026-01-01'),
    endsAt: new Date('2026-03-31'),
    status: 'DRAFT' as const,
    priority: 0,
    stackable: false,
    createdAt: new Date('2026-01-17'),
    updatedAt: new Date('2026-01-17'),
    _count: { coupons: 5 },
  }

  beforeEach(async () => {
    const mockPrismaService = {
      promotion: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        updateMany: jest.fn(),
      },
    }

    const mockEventEmitter = {
      emit: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromotionsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile()

    service = module.get<PromotionsService>(PromotionsService)
    prismaService = module.get(PrismaService)
    eventEmitter = module.get(EventEmitter2)
  })

  // ===========================================================================
  // CREATE Tests
  // ===========================================================================
  describe('create', () => {
    it('should create a promotion with valid percentage discount', async () => {
      prismaService.promotion.create.mockResolvedValue(mockPromotion)

      const input = {
        name: 'Summer Sale',
        description: '20% off all products',
        type: 'PERCENT' as const,
        discountValue: 20,
        conditions: { minOrderCents: 5000 },
        startsAt: new Date('2026-01-01'),
        endsAt: new Date('2026-03-31'),
        priority: 0,
        stackable: false,
      }

      const result = await service.create(mockStoreId, input)

      expect(result).toBeDefined()
      expect(result.name).toBe('Summer Sale')
      expect(result.type).toBe('PERCENT')
      expect(result.discountValue).toBe(20)
      expect(result.status).toBe('DRAFT')
      expect(prismaService.promotion.create).toHaveBeenCalled()
      expect(eventEmitter.emit).toHaveBeenCalledWith('promotion.created', expect.any(Object))
    })

    it('should create a promotion with fixed discount', async () => {
      const fixedPromotion = {
        ...mockPromotion,
        type: 'FIXED' as const,
        discountValue: 1000,
      }
      prismaService.promotion.create.mockResolvedValue(fixedPromotion)

      const input = {
        name: 'Fixed Discount',
        type: 'FIXED' as const,
        discountValue: 1000,
        startsAt: new Date('2026-01-01'),
        priority: 0,
        stackable: false,
      }

      const result = await service.create(mockStoreId, input)

      expect(result.type).toBe('FIXED')
      expect(result.discountValue).toBe(1000)
    })

    it('should create a free shipping promotion', async () => {
      const freeShippingPromotion = {
        ...mockPromotion,
        type: 'FREE_SHIPPING' as const,
        discountValue: null,
      }
      prismaService.promotion.create.mockResolvedValue(freeShippingPromotion)

      const input = {
        name: 'Free Shipping',
        type: 'FREE_SHIPPING' as const,
        startsAt: new Date('2026-01-01'),
        priority: 0,
        stackable: false,
      }

      const result = await service.create(mockStoreId, input)

      expect(result.type).toBe('FREE_SHIPPING')
    })

    it('should create a BUY_X_GET_Y promotion', async () => {
      const bxgyPromotion = {
        ...mockPromotion,
        type: 'BUY_X_GET_Y' as const,
        conditions: { buyQuantity: 2, getQuantity: 1 },
      }
      prismaService.promotion.create.mockResolvedValue(bxgyPromotion)

      const input = {
        name: 'Buy 2 Get 1',
        type: 'BUY_X_GET_Y' as const,
        conditions: { buyQuantity: 2, getQuantity: 1 },
        startsAt: new Date('2026-01-01'),
        priority: 0,
        stackable: false,
      }

      const result = await service.create(mockStoreId, input)

      expect(result.type).toBe('BUY_X_GET_Y')
      expect(result.conditions).toEqual({ buyQuantity: 2, getQuantity: 1 })
    })

    it('should throw BadRequestException for percentage discount without value', async () => {
      const input = {
        name: 'Invalid Promo',
        type: 'PERCENT' as const,
        startsAt: new Date('2026-01-01'),
        priority: 0,
        stackable: false,
      }

      await expect(service.create(mockStoreId, input)).rejects.toThrow(BadRequestException)
    })

    it('should throw BadRequestException for percentage discount > 100', async () => {
      const input = {
        name: 'Invalid Promo',
        type: 'PERCENT' as const,
        discountValue: 150,
        startsAt: new Date('2026-01-01'),
        priority: 0,
        stackable: false,
      }

      await expect(service.create(mockStoreId, input)).rejects.toThrow(BadRequestException)
    })

    it('should throw BadRequestException for percentage discount < 1', async () => {
      const input = {
        name: 'Invalid Promo',
        type: 'PERCENT' as const,
        discountValue: 0,
        startsAt: new Date('2026-01-01'),
        priority: 0,
        stackable: false,
      }

      await expect(service.create(mockStoreId, input)).rejects.toThrow(BadRequestException)
    })

    it('should throw BadRequestException for fixed discount <= 0', async () => {
      const input = {
        name: 'Invalid Promo',
        type: 'FIXED' as const,
        discountValue: 0,
        startsAt: new Date('2026-01-01'),
        priority: 0,
        stackable: false,
      }

      await expect(service.create(mockStoreId, input)).rejects.toThrow(BadRequestException)
    })

    it('should throw BadRequestException for BUY_X_GET_Y without conditions', async () => {
      const input = {
        name: 'Invalid BXGY',
        type: 'BUY_X_GET_Y' as const,
        startsAt: new Date('2026-01-01'),
        priority: 0,
        stackable: false,
      }

      await expect(service.create(mockStoreId, input)).rejects.toThrow(BadRequestException)
    })

    it('should throw BadRequestException if endsAt is before startsAt', async () => {
      const input = {
        name: 'Invalid Dates',
        type: 'PERCENT' as const,
        discountValue: 20,
        startsAt: new Date('2026-03-01'),
        endsAt: new Date('2026-01-01'),
        priority: 0,
        stackable: false,
      }

      await expect(service.create(mockStoreId, input)).rejects.toThrow(BadRequestException)
    })
  })

  // ===========================================================================
  // UPDATE Tests
  // ===========================================================================
  describe('update', () => {
    it('should update an existing promotion', async () => {
      const updatedPromotion = { ...mockPromotion, name: 'Updated Sale' }
      prismaService.promotion.findFirst.mockResolvedValue(mockPromotion)
      prismaService.promotion.update.mockResolvedValue(updatedPromotion)

      const result = await service.update(mockStoreId, mockPromotionId, {
        name: 'Updated Sale',
      })

      expect(result.name).toBe('Updated Sale')
      expect(eventEmitter.emit).toHaveBeenCalledWith('promotion.updated', expect.any(Object))
    })

    it('should throw NotFoundException if promotion does not exist', async () => {
      prismaService.promotion.findFirst.mockResolvedValue(null)

      await expect(
        service.update(mockStoreId, mockPromotionId, { name: 'Updated' }),
      ).rejects.toThrow(NotFoundException)
    })

    it('should validate discount value when type changes', async () => {
      prismaService.promotion.findFirst.mockResolvedValue(mockPromotion)

      await expect(
        service.update(mockStoreId, mockPromotionId, {
          type: 'FIXED' as const,
          discountValue: 0,
        }),
      ).rejects.toThrow(BadRequestException)
    })

    it('should validate dates on update', async () => {
      prismaService.promotion.findFirst.mockResolvedValue(mockPromotion)

      await expect(
        service.update(mockStoreId, mockPromotionId, {
          startsAt: new Date('2026-12-01'),
          endsAt: new Date('2026-01-01'),
        }),
      ).rejects.toThrow(BadRequestException)
    })

    it('should enforce tenant isolation on update', async () => {
      prismaService.promotion.findFirst.mockResolvedValue(null)

      await expect(
        service.update('other_store', mockPromotionId, { name: 'Hacked!' }),
      ).rejects.toThrow(NotFoundException)

      expect(prismaService.promotion.findFirst).toHaveBeenCalledWith({
        where: { id: mockPromotionId, storeId: 'other_store' },
        include: { _count: { select: { coupons: true } } },
      })
    })
  })

  // ===========================================================================
  // DELETE Tests
  // ===========================================================================
  describe('delete', () => {
    it('should delete an existing promotion', async () => {
      prismaService.promotion.findFirst.mockResolvedValue({
        ...mockPromotion,
        _count: { usages: 0 },
      })
      prismaService.promotion.delete.mockResolvedValue(mockPromotion)

      await service.delete(mockStoreId, mockPromotionId)

      expect(prismaService.promotion.delete).toHaveBeenCalledWith({
        where: { id: mockPromotionId },
      })
      expect(eventEmitter.emit).toHaveBeenCalledWith('promotion.deleted', expect.any(Object))
    })

    it('should throw NotFoundException if promotion does not exist', async () => {
      prismaService.promotion.findFirst.mockResolvedValue(null)

      await expect(service.delete(mockStoreId, mockPromotionId)).rejects.toThrow(NotFoundException)
    })

    it('should still delete promotion with existing usages (with warning)', async () => {
      prismaService.promotion.findFirst.mockResolvedValue({
        ...mockPromotion,
        _count: { usages: 10 },
      })
      prismaService.promotion.delete.mockResolvedValue(mockPromotion)

      await service.delete(mockStoreId, mockPromotionId)

      expect(prismaService.promotion.delete).toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // FIND BY ID Tests
  // ===========================================================================
  describe('findById', () => {
    it('should return a promotion by ID', async () => {
      prismaService.promotion.findFirst.mockResolvedValue(mockPromotion)

      const result = await service.findById(mockStoreId, mockPromotionId)

      expect(result.id).toBe(mockPromotionId)
      expect(result.name).toBe('Summer Sale')
      expect(result.couponCount).toBe(5)
    })

    it('should throw NotFoundException if promotion does not exist', async () => {
      prismaService.promotion.findFirst.mockResolvedValue(null)

      await expect(service.findById(mockStoreId, mockPromotionId)).rejects.toThrow(NotFoundException)
    })

    it('should enforce tenant isolation', async () => {
      prismaService.promotion.findFirst.mockResolvedValue(null)

      await expect(service.findById('other_store', mockPromotionId)).rejects.toThrow(
        NotFoundException,
      )
      expect(prismaService.promotion.findFirst).toHaveBeenCalledWith({
        where: { id: mockPromotionId, storeId: 'other_store' },
        include: { _count: { select: { coupons: true } } },
      })
    })
  })

  // ===========================================================================
  // LIST Tests
  // ===========================================================================
  describe('list', () => {
    it('should return paginated promotions', async () => {
      const promotions = [mockPromotion, { ...mockPromotion, id: 'promo_2', name: 'Promo 2' }]
      prismaService.promotion.findMany.mockResolvedValue(promotions)
      prismaService.promotion.count.mockResolvedValue(2)

      const result = await service.list(mockStoreId, { page: 1, limit: 20 })

      expect(result.items).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.page).toBe(1)
      expect(result.hasMore).toBe(false)
    })

    it('should filter by status', async () => {
      prismaService.promotion.findMany.mockResolvedValue([mockPromotion])
      prismaService.promotion.count.mockResolvedValue(1)

      // includeExpired: true to avoid the default "status: { not: EXPIRED }" filter
      await service.list(mockStoreId, { status: 'DRAFT', includeExpired: true })

      expect(prismaService.promotion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'DRAFT',
          }),
        }),
      )
    })

    it('should filter by type', async () => {
      prismaService.promotion.findMany.mockResolvedValue([mockPromotion])
      prismaService.promotion.count.mockResolvedValue(1)

      await service.list(mockStoreId, { type: 'PERCENT' })

      expect(prismaService.promotion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'PERCENT',
          }),
        }),
      )
    })

    it('should filter by search term', async () => {
      prismaService.promotion.findMany.mockResolvedValue([mockPromotion])
      prismaService.promotion.count.mockResolvedValue(1)

      await service.list(mockStoreId, { search: 'summer' })

      expect(prismaService.promotion.findMany).toHaveBeenCalledWith(
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
      const promotions = Array(20).fill(mockPromotion)
      prismaService.promotion.findMany.mockResolvedValue(promotions)
      prismaService.promotion.count.mockResolvedValue(50)

      const result = await service.list(mockStoreId, { page: 1, limit: 20 })

      expect(result.hasMore).toBe(true)
    })
  })

  // ===========================================================================
  // STATUS TRANSITION Tests
  // ===========================================================================
  describe('status transitions', () => {
    describe('activate', () => {
      it('should activate a DRAFT promotion', async () => {
        const activePromotion = { ...mockPromotion, status: 'ACTIVE' as const }
        prismaService.promotion.findFirst.mockResolvedValue(mockPromotion)
        prismaService.promotion.update.mockResolvedValue(activePromotion)

        const result = await service.activate(mockStoreId, mockPromotionId)

        expect(result.status).toBe('ACTIVE')
        expect(eventEmitter.emit).toHaveBeenCalledWith(
          'promotion.statusChanged',
          expect.objectContaining({
            previousStatus: 'DRAFT',
            newStatus: 'ACTIVE',
          }),
        )
      })

      it('should activate a PAUSED promotion', async () => {
        const pausedPromotion = { ...mockPromotion, status: 'PAUSED' as const }
        const activePromotion = { ...mockPromotion, status: 'ACTIVE' as const }
        prismaService.promotion.findFirst.mockResolvedValue(pausedPromotion)
        prismaService.promotion.update.mockResolvedValue(activePromotion)

        const result = await service.activate(mockStoreId, mockPromotionId)

        expect(result.status).toBe('ACTIVE')
      })

      it('should throw BadRequestException when activating an ARCHIVED promotion', async () => {
        const archivedPromotion = { ...mockPromotion, status: 'ARCHIVED' as const }
        prismaService.promotion.findFirst.mockResolvedValue(archivedPromotion)

        await expect(service.activate(mockStoreId, mockPromotionId)).rejects.toThrow(
          BadRequestException,
        )
      })

      it('should throw BadRequestException when activating an expired promotion', async () => {
        const expiredPromotion = {
          ...mockPromotion,
          status: 'DRAFT' as const,
          endsAt: new Date('2020-01-01'), // Past date
        }
        prismaService.promotion.findFirst.mockResolvedValue(expiredPromotion)

        await expect(service.activate(mockStoreId, mockPromotionId)).rejects.toThrow(
          BadRequestException,
        )
      })
    })

    describe('pause', () => {
      it('should pause an ACTIVE promotion', async () => {
        const activePromotion = { ...mockPromotion, status: 'ACTIVE' as const }
        const pausedPromotion = { ...mockPromotion, status: 'PAUSED' as const }
        prismaService.promotion.findFirst.mockResolvedValue(activePromotion)
        prismaService.promotion.update.mockResolvedValue(pausedPromotion)

        const result = await service.pause(mockStoreId, mockPromotionId)

        expect(result.status).toBe('PAUSED')
      })

      it('should throw BadRequestException when pausing a DRAFT promotion', async () => {
        prismaService.promotion.findFirst.mockResolvedValue(mockPromotion)

        await expect(service.pause(mockStoreId, mockPromotionId)).rejects.toThrow(
          BadRequestException,
        )
      })
    })

    describe('archive', () => {
      it('should archive a DRAFT promotion', async () => {
        const archivedPromotion = { ...mockPromotion, status: 'ARCHIVED' as const }
        prismaService.promotion.findFirst.mockResolvedValue(mockPromotion)
        prismaService.promotion.update.mockResolvedValue(archivedPromotion)

        const result = await service.archive(mockStoreId, mockPromotionId)

        expect(result.status).toBe('ARCHIVED')
      })

      it('should archive an ACTIVE promotion', async () => {
        const activePromotion = { ...mockPromotion, status: 'ACTIVE' as const }
        const archivedPromotion = { ...mockPromotion, status: 'ARCHIVED' as const }
        prismaService.promotion.findFirst.mockResolvedValue(activePromotion)
        prismaService.promotion.update.mockResolvedValue(archivedPromotion)

        const result = await service.archive(mockStoreId, mockPromotionId)

        expect(result.status).toBe('ARCHIVED')
      })

      it('should archive a PAUSED promotion', async () => {
        const pausedPromotion = { ...mockPromotion, status: 'PAUSED' as const }
        const archivedPromotion = { ...mockPromotion, status: 'ARCHIVED' as const }
        prismaService.promotion.findFirst.mockResolvedValue(pausedPromotion)
        prismaService.promotion.update.mockResolvedValue(archivedPromotion)

        const result = await service.archive(mockStoreId, mockPromotionId)

        expect(result.status).toBe('ARCHIVED')
      })

      it('should archive an EXPIRED promotion', async () => {
        const expiredPromotion = { ...mockPromotion, status: 'EXPIRED' as const }
        const archivedPromotion = { ...mockPromotion, status: 'ARCHIVED' as const }
        prismaService.promotion.findFirst.mockResolvedValue(expiredPromotion)
        prismaService.promotion.update.mockResolvedValue(archivedPromotion)

        const result = await service.archive(mockStoreId, mockPromotionId)

        expect(result.status).toBe('ARCHIVED')
      })
    })

    describe('updateStatus', () => {
      it('should throw NotFoundException if promotion does not exist', async () => {
        prismaService.promotion.findFirst.mockResolvedValue(null)

        await expect(
          service.updateStatus(mockStoreId, mockPromotionId, 'ACTIVE'),
        ).rejects.toThrow(NotFoundException)
      })

      it('should throw BadRequestException for invalid transitions', async () => {
        const activePromotion = { ...mockPromotion, status: 'ACTIVE' as const }
        prismaService.promotion.findFirst.mockResolvedValue(activePromotion)

        // ACTIVE cannot transition to DRAFT
        await expect(
          service.updateStatus(mockStoreId, mockPromotionId, 'DRAFT'),
        ).rejects.toThrow(BadRequestException)
      })

      it('should throw BadRequestException when transitioning from ARCHIVED', async () => {
        const archivedPromotion = { ...mockPromotion, status: 'ARCHIVED' as const }
        prismaService.promotion.findFirst.mockResolvedValue(archivedPromotion)

        // ARCHIVED is terminal, cannot transition to anything
        await expect(
          service.updateStatus(mockStoreId, mockPromotionId, 'ACTIVE'),
        ).rejects.toThrow(BadRequestException)
      })
    })
  })

  // ===========================================================================
  // USAGE TRACKING Tests
  // ===========================================================================
  describe('incrementUsage', () => {
    it('should increment usage count', async () => {
      const updatedPromotion = { ...mockPromotion, usageCount: 1 }
      prismaService.promotion.update.mockResolvedValue(updatedPromotion)

      const result = await service.incrementUsage(mockStoreId, mockPromotionId)

      expect(result.usageCount).toBe(1)
      expect(prismaService.promotion.update).toHaveBeenCalledWith({
        where: { id: mockPromotionId, storeId: mockStoreId },
        data: { usageCount: { increment: 1 } },
        include: { _count: { select: { coupons: true } } },
      })
    })

    it('should emit limitReached event when usage limit is met', async () => {
      const limitReachedPromotion = {
        ...mockPromotion,
        usageCount: 100,
        usageLimit: 100,
      }
      prismaService.promotion.update.mockResolvedValue(limitReachedPromotion)

      await service.incrementUsage(mockStoreId, mockPromotionId)

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'promotion.limitReached',
        expect.objectContaining({
          promotionId: mockPromotionId,
          usageCount: 100,
          usageLimit: 100,
        }),
      )
    })
  })

  // ===========================================================================
  // EXPIRE PROMOTIONS Tests
  // ===========================================================================
  describe('expireEndedPromotions', () => {
    it('should expire active promotions past their end date', async () => {
      prismaService.promotion.updateMany.mockResolvedValue({ count: 3 })

      const result = await service.expireEndedPromotions(mockStoreId)

      expect(result).toBe(3)
      expect(prismaService.promotion.updateMany).toHaveBeenCalledWith({
        where: {
          storeId: mockStoreId,
          status: 'ACTIVE',
          endsAt: { lt: expect.any(Date) },
        },
        data: { status: 'EXPIRED' },
      })
    })

    it('should work without storeId (global expiration)', async () => {
      prismaService.promotion.updateMany.mockResolvedValue({ count: 10 })

      const result = await service.expireEndedPromotions()

      expect(result).toBe(10)
      expect(prismaService.promotion.updateMany).toHaveBeenCalledWith({
        where: {
          status: 'ACTIVE',
          endsAt: { lt: expect.any(Date) },
        },
        data: { status: 'EXPIRED' },
      })
    })
  })

  // ===========================================================================
  // LIST FOR SELECT Tests
  // ===========================================================================
  describe('listForSelect', () => {
    it('should return promotions for dropdown (excluding archived)', async () => {
      const selectList = [
        { id: 'promo_1', name: 'Promo 1', type: 'PERCENT', status: 'ACTIVE' },
        { id: 'promo_2', name: 'Promo 2', type: 'FIXED', status: 'DRAFT' },
      ]
      prismaService.promotion.findMany.mockResolvedValue(selectList)

      const result = await service.listForSelect(mockStoreId)

      expect(result).toHaveLength(2)
      expect(prismaService.promotion.findMany).toHaveBeenCalledWith({
        where: { storeId: mockStoreId, status: { not: 'ARCHIVED' } },
        select: { id: true, name: true, type: true, status: true },
        orderBy: [{ status: 'asc' }, { name: 'asc' }],
      })
    })
  })
})
