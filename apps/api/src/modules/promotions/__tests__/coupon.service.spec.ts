import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { CouponService } from '../coupon.service'
import { PrismaService } from '@database/prisma.service'

/**
 * CouponService Unit Tests
 *
 * Tests cover:
 * - Coupon CRUD operations
 * - Bulk coupon generation
 * - Code uniqueness validation
 * - Coupon validation logic
 * - Usage tracking
 * - Tenant isolation (storeId scoping)
 * - Event emission
 *
 * @see Story 3.9 - Promotions & Discounts Foundation
 */
describe('CouponService', () => {
  let service: CouponService
  let prismaService: {
    coupon: {
      findFirst: jest.Mock
      findMany: jest.Mock
      create: jest.Mock
      update: jest.Mock
      delete: jest.Mock
      count: jest.Mock
    }
    promotion: {
      findFirst: jest.Mock
    }
    promotionUsage: {
      count: jest.Mock
    }
    $transaction: jest.Mock
  }
  let eventEmitter: { emit: jest.Mock }

  const mockStoreId = 'store_test123'
  const mockPromotionId = 'promo_test123456789012'
  const mockCouponId = 'coup_test123456789012'

  const mockPromotion = {
    id: mockPromotionId,
    storeId: mockStoreId,
    name: 'Summer Sale',
    type: 'PERCENT' as const,
    discountValue: 20,
    conditions: { minOrderCents: 5000 },
    maxDiscountCents: 10000,
    usageLimit: 100,
    usageCount: 0,
    perCustomerLimit: 2,
    startsAt: new Date('2026-01-01'),
    endsAt: new Date('2026-12-31'),
    status: 'ACTIVE' as const,
  }

  const mockCoupon = {
    id: mockCouponId,
    storeId: mockStoreId,
    promotionId: mockPromotionId,
    code: 'SUMMER20',
    usageLimit: 10,
    usageCount: 0,
    expiresAt: new Date('2026-12-31'),
    isActive: true,
    metadata: null,
    createdAt: new Date('2026-01-17'),
    updatedAt: new Date('2026-01-17'),
  }

  beforeEach(async () => {
    const mockPrismaService = {
      coupon: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      promotion: {
        findFirst: jest.fn(),
      },
      promotionUsage: {
        count: jest.fn(),
      },
      $transaction: jest.fn(),
    }

    const mockEventEmitter = {
      emit: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile()

    service = module.get<CouponService>(CouponService)
    prismaService = module.get(PrismaService)
    eventEmitter = module.get(EventEmitter2)
  })

  // ===========================================================================
  // CREATE Tests
  // ===========================================================================
  describe('create', () => {
    it('should create a coupon with valid data', async () => {
      prismaService.promotion.findFirst.mockResolvedValue(mockPromotion)
      prismaService.coupon.findFirst.mockResolvedValue(null) // No existing code
      prismaService.coupon.create.mockResolvedValue(mockCoupon)

      const input = {
        promotionId: mockPromotionId,
        code: 'SUMMER20',
        usageLimit: 10,
        expiresAt: new Date('2026-12-31'),
      }

      const result = await service.create(mockStoreId, input)

      expect(result).toBeDefined()
      expect(result.code).toBe('SUMMER20')
      expect(result.promotionId).toBe(mockPromotionId)
      expect(prismaService.coupon.create).toHaveBeenCalled()
      expect(eventEmitter.emit).toHaveBeenCalledWith('coupon.created', expect.any(Object))
    })

    it('should normalize coupon code to uppercase', async () => {
      prismaService.promotion.findFirst.mockResolvedValue(mockPromotion)
      prismaService.coupon.findFirst.mockResolvedValue(null)
      prismaService.coupon.create.mockImplementation(async ({ data }) => ({
        ...mockCoupon,
        code: data.code,
      }))

      await service.create(mockStoreId, {
        promotionId: mockPromotionId,
        code: 'summer20',
      })

      expect(prismaService.coupon.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            code: 'SUMMER20',
          }),
        }),
      )
    })

    it('should throw NotFoundException if promotion does not exist', async () => {
      prismaService.promotion.findFirst.mockResolvedValue(null)

      await expect(
        service.create(mockStoreId, {
          promotionId: mockPromotionId,
          code: 'TEST123',
        }),
      ).rejects.toThrow(NotFoundException)
    })

    it('should throw BadRequestException if promotion is archived', async () => {
      const archivedPromotion = { ...mockPromotion, status: 'ARCHIVED' as const }
      prismaService.promotion.findFirst.mockResolvedValue(archivedPromotion)

      await expect(
        service.create(mockStoreId, {
          promotionId: mockPromotionId,
          code: 'TEST123',
        }),
      ).rejects.toThrow(BadRequestException)
    })

    it('should throw ConflictException if code already exists', async () => {
      prismaService.promotion.findFirst.mockResolvedValue(mockPromotion)
      prismaService.coupon.findFirst.mockResolvedValue(mockCoupon) // Existing code

      await expect(
        service.create(mockStoreId, {
          promotionId: mockPromotionId,
          code: 'SUMMER20',
        }),
      ).rejects.toThrow(ConflictException)
    })
  })

  // ===========================================================================
  // BULK GENERATION Tests
  // ===========================================================================
  describe('generateBulk', () => {
    it('should generate multiple unique coupons', async () => {
      prismaService.promotion.findFirst.mockResolvedValue(mockPromotion)
      // For unique code generation: return null (no existing code)
      prismaService.coupon.findFirst.mockResolvedValue(null)

      const generatedCoupons = [
        { ...mockCoupon, id: 'coup_1', code: 'PREFIXABC12345SUFFIX' },
        { ...mockCoupon, id: 'coup_2', code: 'PREFIXDEF67890SUFFIX' },
        { ...mockCoupon, id: 'coup_3', code: 'PREFIXGHI24680SUFFIX' },
      ]

      prismaService.$transaction.mockResolvedValue(generatedCoupons)

      const result = await service.generateBulk(mockStoreId, {
        promotionId: mockPromotionId,
        count: 3,
        prefix: 'PREFIX',
        suffix: 'SUFFIX',
        codeLength: 8,
        usageLimit: 5,
      })

      expect(result.count).toBe(3)
      expect(result.coupons).toHaveLength(3)
      expect(result.promotionId).toBe(mockPromotionId)
      expect(eventEmitter.emit).toHaveBeenCalledWith('coupons.generated', expect.any(Object))
    })

    it('should throw NotFoundException if promotion does not exist', async () => {
      prismaService.promotion.findFirst.mockResolvedValue(null)

      await expect(
        service.generateBulk(mockStoreId, {
          promotionId: mockPromotionId,
          count: 5,
          codeLength: 8,
        }),
      ).rejects.toThrow(NotFoundException)
    })

    it('should throw BadRequestException after max attempts to generate unique code', async () => {
      prismaService.promotion.findFirst.mockResolvedValue(mockPromotion)
      // Always return existing coupon (code collision)
      prismaService.coupon.findFirst.mockResolvedValue(mockCoupon)

      await expect(
        service.generateBulk(mockStoreId, {
          promotionId: mockPromotionId,
          count: 1,
          codeLength: 8,
        }),
      ).rejects.toThrow(BadRequestException)
    })
  })

  // ===========================================================================
  // UPDATE Tests
  // ===========================================================================
  describe('update', () => {
    it('should update coupon isActive status', async () => {
      const updatedCoupon = { ...mockCoupon, isActive: false }
      prismaService.coupon.findFirst.mockResolvedValue(mockCoupon)
      prismaService.coupon.update.mockResolvedValue(updatedCoupon)

      const result = await service.update(mockStoreId, mockCouponId, { isActive: false })

      expect(result.isActive).toBe(false)
      expect(eventEmitter.emit).toHaveBeenCalledWith('coupon.updated', expect.any(Object))
    })

    it('should update coupon usage limit', async () => {
      const updatedCoupon = { ...mockCoupon, usageLimit: 50 }
      prismaService.coupon.findFirst.mockResolvedValue(mockCoupon)
      prismaService.coupon.update.mockResolvedValue(updatedCoupon)

      const result = await service.update(mockStoreId, mockCouponId, { usageLimit: 50 })

      expect(result.usageLimit).toBe(50)
    })

    it('should update coupon expiration date', async () => {
      const newExpiry = new Date('2027-06-30')
      const updatedCoupon = { ...mockCoupon, expiresAt: newExpiry }
      prismaService.coupon.findFirst.mockResolvedValue(mockCoupon)
      prismaService.coupon.update.mockResolvedValue(updatedCoupon)

      const result = await service.update(mockStoreId, mockCouponId, { expiresAt: newExpiry })

      expect(result.expiresAt).toEqual(newExpiry)
    })

    it('should throw NotFoundException if coupon does not exist', async () => {
      prismaService.coupon.findFirst.mockResolvedValue(null)

      await expect(
        service.update(mockStoreId, mockCouponId, { isActive: false }),
      ).rejects.toThrow(NotFoundException)
    })
  })

  // ===========================================================================
  // DEACTIVATE Tests
  // ===========================================================================
  describe('deactivate', () => {
    it('should deactivate a coupon', async () => {
      const deactivatedCoupon = { ...mockCoupon, isActive: false }
      prismaService.coupon.findFirst.mockResolvedValue(mockCoupon)
      prismaService.coupon.update.mockResolvedValue(deactivatedCoupon)

      const result = await service.deactivate(mockStoreId, mockCouponId)

      expect(result.isActive).toBe(false)
    })
  })

  // ===========================================================================
  // DELETE Tests
  // ===========================================================================
  describe('delete', () => {
    it('should delete a coupon', async () => {
      prismaService.coupon.findFirst.mockResolvedValue({
        ...mockCoupon,
        _count: { usages: 0 },
      })
      prismaService.coupon.delete.mockResolvedValue(mockCoupon)

      await service.delete(mockStoreId, mockCouponId)

      expect(prismaService.coupon.delete).toHaveBeenCalledWith({
        where: { id: mockCouponId },
      })
      expect(eventEmitter.emit).toHaveBeenCalledWith('coupon.deleted', expect.any(Object))
    })

    it('should throw NotFoundException if coupon does not exist', async () => {
      prismaService.coupon.findFirst.mockResolvedValue(null)

      await expect(service.delete(mockStoreId, mockCouponId)).rejects.toThrow(NotFoundException)
    })

    it('should still delete coupon with existing usages (with warning)', async () => {
      prismaService.coupon.findFirst.mockResolvedValue({
        ...mockCoupon,
        _count: { usages: 5 },
      })
      prismaService.coupon.delete.mockResolvedValue(mockCoupon)

      await service.delete(mockStoreId, mockCouponId)

      expect(prismaService.coupon.delete).toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // FIND BY ID Tests
  // ===========================================================================
  describe('findById', () => {
    it('should return a coupon by ID', async () => {
      prismaService.coupon.findFirst.mockResolvedValue(mockCoupon)

      const result = await service.findById(mockStoreId, mockCouponId)

      expect(result.id).toBe(mockCouponId)
      expect(result.code).toBe('SUMMER20')
    })

    it('should throw NotFoundException if coupon does not exist', async () => {
      prismaService.coupon.findFirst.mockResolvedValue(null)

      await expect(service.findById(mockStoreId, mockCouponId)).rejects.toThrow(NotFoundException)
    })

    it('should enforce tenant isolation', async () => {
      prismaService.coupon.findFirst.mockResolvedValue(null)

      await expect(service.findById('other_store', mockCouponId)).rejects.toThrow(NotFoundException)
      expect(prismaService.coupon.findFirst).toHaveBeenCalledWith({
        where: { id: mockCouponId, storeId: 'other_store' },
      })
    })
  })

  // ===========================================================================
  // FIND BY CODE Tests
  // ===========================================================================
  describe('findByCode', () => {
    it('should return a coupon by code (case insensitive)', async () => {
      prismaService.coupon.findFirst.mockResolvedValue(mockCoupon)

      const result = await service.findByCode(mockStoreId, 'summer20')

      expect(result).not.toBeNull()
      expect(result!.code).toBe('SUMMER20')
      expect(prismaService.coupon.findFirst).toHaveBeenCalledWith({
        where: { storeId: mockStoreId, code: 'SUMMER20' },
      })
    })

    it('should return null if coupon not found', async () => {
      prismaService.coupon.findFirst.mockResolvedValue(null)

      const result = await service.findByCode(mockStoreId, 'NONEXISTENT')

      expect(result).toBeNull()
    })
  })

  // ===========================================================================
  // LIST Tests
  // ===========================================================================
  describe('list', () => {
    it('should return paginated coupons', async () => {
      const coupons = [mockCoupon, { ...mockCoupon, id: 'coup_2', code: 'CODE2' }]
      prismaService.coupon.findMany.mockResolvedValue(coupons)
      prismaService.coupon.count.mockResolvedValue(2)

      const result = await service.list(mockStoreId, { page: 1, limit: 20 })

      expect(result.items).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.page).toBe(1)
      expect(result.hasMore).toBe(false)
    })

    it('should filter by promotionId', async () => {
      prismaService.coupon.findMany.mockResolvedValue([mockCoupon])
      prismaService.coupon.count.mockResolvedValue(1)

      await service.list(mockStoreId, { promotionId: mockPromotionId })

      expect(prismaService.coupon.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            promotionId: mockPromotionId,
          }),
        }),
      )
    })

    it('should filter by isActive', async () => {
      prismaService.coupon.findMany.mockResolvedValue([mockCoupon])
      prismaService.coupon.count.mockResolvedValue(1)

      await service.list(mockStoreId, { isActive: true })

      expect(prismaService.coupon.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
          }),
        }),
      )
    })

    it('should filter by search term (code)', async () => {
      prismaService.coupon.findMany.mockResolvedValue([mockCoupon])
      prismaService.coupon.count.mockResolvedValue(1)

      await service.list(mockStoreId, { search: 'summer' })

      expect(prismaService.coupon.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            code: expect.any(Object),
          }),
        }),
      )
    })
  })

  // ===========================================================================
  // VALIDATE Tests
  // ===========================================================================
  describe('validate', () => {
    const mockCouponWithPromotion = {
      ...mockCoupon,
      promotion: mockPromotion,
    }

    it('should return valid result for a valid coupon', async () => {
      prismaService.coupon.findFirst.mockResolvedValue(mockCouponWithPromotion)

      const result = await service.validate(mockStoreId, {
        code: 'SUMMER20',
        orderTotalCents: 10000,
      })

      expect(result.valid).toBe(true)
      expect(result.coupon).toBeDefined()
      expect(result.promotion).toBeDefined()
    })

    it('should return NOT_FOUND for non-existent coupon', async () => {
      prismaService.coupon.findFirst.mockResolvedValue(null)

      const result = await service.validate(mockStoreId, { code: 'INVALID' })

      expect(result.valid).toBe(false)
      expect(result.errorCode).toBe('NOT_FOUND')
    })

    it('should return INACTIVE for deactivated coupon', async () => {
      const inactiveCoupon = { ...mockCouponWithPromotion, isActive: false }
      prismaService.coupon.findFirst.mockResolvedValue(inactiveCoupon)

      const result = await service.validate(mockStoreId, { code: 'SUMMER20' })

      expect(result.valid).toBe(false)
      expect(result.errorCode).toBe('INACTIVE')
    })

    it('should return EXPIRED for expired coupon', async () => {
      const expiredCoupon = {
        ...mockCouponWithPromotion,
        expiresAt: new Date('2020-01-01'), // Past date
      }
      prismaService.coupon.findFirst.mockResolvedValue(expiredCoupon)

      const result = await service.validate(mockStoreId, { code: 'SUMMER20' })

      expect(result.valid).toBe(false)
      expect(result.errorCode).toBe('EXPIRED')
    })

    it('should return USAGE_LIMIT_REACHED for coupon at usage limit', async () => {
      const usedCoupon = {
        ...mockCouponWithPromotion,
        usageCount: 10,
        usageLimit: 10,
      }
      prismaService.coupon.findFirst.mockResolvedValue(usedCoupon)

      const result = await service.validate(mockStoreId, { code: 'SUMMER20' })

      expect(result.valid).toBe(false)
      expect(result.errorCode).toBe('USAGE_LIMIT_REACHED')
    })

    it('should return PROMOTION_INACTIVE for draft promotion', async () => {
      const draftPromotion = { ...mockPromotion, status: 'DRAFT' as const }
      prismaService.coupon.findFirst.mockResolvedValue({
        ...mockCoupon,
        promotion: draftPromotion,
      })

      const result = await service.validate(mockStoreId, { code: 'SUMMER20' })

      expect(result.valid).toBe(false)
      expect(result.errorCode).toBe('PROMOTION_INACTIVE')
    })

    it('should return PROMOTION_INACTIVE for paused promotion', async () => {
      const pausedPromotion = { ...mockPromotion, status: 'PAUSED' as const }
      prismaService.coupon.findFirst.mockResolvedValue({
        ...mockCoupon,
        promotion: pausedPromotion,
      })

      const result = await service.validate(mockStoreId, { code: 'SUMMER20' })

      expect(result.valid).toBe(false)
      expect(result.errorCode).toBe('PROMOTION_INACTIVE')
    })

    it('should return NOT_STARTED for promotion not yet started', async () => {
      const futurePromotion = {
        ...mockPromotion,
        startsAt: new Date('2030-01-01'), // Future date
      }
      prismaService.coupon.findFirst.mockResolvedValue({
        ...mockCoupon,
        promotion: futurePromotion,
      })

      const result = await service.validate(mockStoreId, { code: 'SUMMER20' })

      expect(result.valid).toBe(false)
      expect(result.errorCode).toBe('NOT_STARTED')
    })

    it('should return EXPIRED for ended promotion', async () => {
      const endedPromotion = {
        ...mockPromotion,
        startsAt: new Date('2020-01-01'),
        endsAt: new Date('2020-12-31'), // Past date
      }
      prismaService.coupon.findFirst.mockResolvedValue({
        ...mockCoupon,
        promotion: endedPromotion,
      })

      const result = await service.validate(mockStoreId, { code: 'SUMMER20' })

      expect(result.valid).toBe(false)
      expect(result.errorCode).toBe('EXPIRED')
    })

    it('should return USAGE_LIMIT_REACHED for promotion at usage limit', async () => {
      const limitedPromotion = {
        ...mockPromotion,
        usageCount: 100,
        usageLimit: 100,
      }
      prismaService.coupon.findFirst.mockResolvedValue({
        ...mockCoupon,
        promotion: limitedPromotion,
      })

      const result = await service.validate(mockStoreId, { code: 'SUMMER20' })

      expect(result.valid).toBe(false)
      expect(result.errorCode).toBe('USAGE_LIMIT_REACHED')
    })

    it('should return CUSTOMER_LIMIT_REACHED for customer at limit', async () => {
      prismaService.coupon.findFirst.mockResolvedValue(mockCouponWithPromotion)
      prismaService.promotionUsage.count.mockResolvedValue(2) // Customer has used 2 times

      const result = await service.validate(mockStoreId, {
        code: 'SUMMER20',
        customerId: 'cust_123',
      })

      expect(result.valid).toBe(false)
      expect(result.errorCode).toBe('CUSTOMER_LIMIT_REACHED')
    })

    it('should return MIN_ORDER_NOT_MET for insufficient order total', async () => {
      prismaService.coupon.findFirst.mockResolvedValue(mockCouponWithPromotion)

      const result = await service.validate(mockStoreId, {
        code: 'SUMMER20',
        orderTotalCents: 2000, // Below minOrderCents of 5000
      })

      expect(result.valid).toBe(false)
      expect(result.errorCode).toBe('MIN_ORDER_NOT_MET')
    })
  })

  // ===========================================================================
  // INCREMENT USAGE Tests
  // ===========================================================================
  describe('incrementUsage', () => {
    it('should increment usage count', async () => {
      const updatedCoupon = { ...mockCoupon, usageCount: 1 }
      prismaService.coupon.update.mockResolvedValue(updatedCoupon)

      const result = await service.incrementUsage(mockStoreId, mockCouponId)

      expect(result.usageCount).toBe(1)
      expect(prismaService.coupon.update).toHaveBeenCalledWith({
        where: { id: mockCouponId, storeId: mockStoreId },
        data: { usageCount: { increment: 1 } },
      })
    })
  })
})
