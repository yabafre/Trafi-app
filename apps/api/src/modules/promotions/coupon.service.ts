import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { PrismaService } from '@database/prisma.service'
import {
  type Coupon as PrismaCoupon,
  type PromotionStatus,
  Prisma,
} from '@generated/prisma/client'
import type {
  CreateCouponInput,
  GenerateCouponsInput,
  UpdateCouponInput,
  ValidateCouponInput,
  PromotionConditions,
} from '@trafi/validators'

import { randomBytes } from 'crypto'

/**
 * Input for listing coupons with optional filtering
 */
export interface ListCouponsOptions {
  promotionId?: string
  isActive?: boolean
  search?: string
  includeExpired?: boolean
  page?: number
  limit?: number
}

// Alphanumeric codes (no ambiguous chars like 0/O, 1/I/L)
const COUPON_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const ALPHABET_SIZE = COUPON_ALPHABET.length

/**
 * Generate a random coupon code string of given length
 * Uses crypto.randomBytes for cryptographic randomness
 */
function generateRandomCode(length: number): string {
  const bytes = randomBytes(length)
  let result = ''
  for (let i = 0; i < length; i++) {
    result += COUPON_ALPHABET[bytes[i] % ALPHABET_SIZE]
  }
  return result
}

/**
 * Coupon response DTO for API consumers
 */
export interface CouponResponseDto {
  id: string
  storeId: string
  promotionId: string
  code: string
  usageLimit: number | null
  usageCount: number
  expiresAt: Date | null
  isActive: boolean
  metadata: Record<string, unknown> | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Paginated coupons list result
 */
export interface CouponsListResult {
  items: CouponResponseDto[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

/**
 * Coupon validation result
 */
export interface CouponValidationResultDto {
  valid: boolean
  coupon?: CouponResponseDto
  promotion?: {
    id: string
    name: string
    type: string
    discountValue: number | null
    maxDiscountCents: number | null
    conditions: PromotionConditions
  }
  errorCode?:
    | 'NOT_FOUND'
    | 'INACTIVE'
    | 'EXPIRED'
    | 'USAGE_LIMIT_REACHED'
    | 'CUSTOMER_LIMIT_REACHED'
    | 'PROMOTION_INACTIVE'
    | 'MIN_ORDER_NOT_MET'
    | 'NOT_STARTED'
  errorMessage?: string
}

/**
 * Bulk coupon generation result
 */
export interface GenerateCouponsResultDto {
  promotionId: string
  count: number
  coupons: CouponResponseDto[]
}

/**
 * Coupon management service
 *
 * IMPORTANT: Use `protected` methods (not `private`) to support
 * merchant overrides in @trafi/core distribution model (RETRO-2).
 *
 * Key behaviors:
 * - Coupons are tenant-scoped via storeId (defense-in-depth)
 * - Coupon codes are case-insensitive (Citext column)
 * - IDs automatically generated with coup_ prefix via PrismaService extension
 * - Emits events for coupon changes
 *
 * @see Story 3.9 - Promotions & Discounts Foundation
 */
@Injectable()
export class CouponService {
  protected readonly logger = new Logger(CouponService.name)

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly eventEmitter: EventEmitter2,
  ) {}

  // ==========================================================================
  // Protected Validation Methods
  // ==========================================================================

  /**
   * Validate that a coupon code is unique within a store.
   * Protected for merchant override.
   */
  protected async validateCodeUnique(storeId: string, code: string): Promise<void> {
    const existing = await this.prisma.coupon.findFirst({
      where: { storeId, code: code.toUpperCase() },
    })

    if (existing) {
      throw new ConflictException(`Coupon code "${code}" already exists`)
    }
  }

  /**
   * Validate that promotion exists and is valid.
   * Protected for merchant override.
   */
  protected async validatePromotion(
    storeId: string,
    promotionId: string,
  ): Promise<void> {
    const promotion = await this.prisma.promotion.findFirst({
      where: { id: promotionId, storeId },
    })

    if (!promotion) {
      throw new NotFoundException('Promotion not found')
    }

    if (promotion.status === 'ARCHIVED') {
      throw new BadRequestException('Cannot create coupons for archived promotion')
    }
  }

  /**
   * Generate a unique coupon code.
   * Protected for merchant override.
   */
  protected async generateUniqueCode(
    storeId: string,
    prefix?: string,
    suffix?: string,
    length: number = 8,
  ): Promise<string> {
    const maxAttempts = 10
    let attempts = 0

    while (attempts < maxAttempts) {
      const randomPart = generateRandomCode(length)
      const code = [prefix, randomPart, suffix].filter(Boolean).join('')

      const existing = await this.prisma.coupon.findFirst({
        where: { storeId, code },
      })

      if (!existing) {
        return code
      }

      attempts++
    }

    throw new BadRequestException('Could not generate unique coupon code after multiple attempts')
  }

  // ==========================================================================
  // CRUD Methods
  // ==========================================================================

  /**
   * Create a single coupon.
   *
   * @param storeId - Store ID for tenant isolation
   * @param input - Coupon creation data
   * @returns Created coupon
   */
  async create(storeId: string, input: CreateCouponInput): Promise<CouponResponseDto> {
    // Validate promotion exists
    await this.validatePromotion(storeId, input.promotionId)

    // Normalize code to uppercase
    const code = input.code.toUpperCase()

    // Validate code uniqueness
    await this.validateCodeUnique(storeId, code)

    const coupon = await this.prisma.coupon.create({
      data: {
        storeId,
        promotionId: input.promotionId,
        code,
        usageLimit: input.usageLimit ?? null,
        expiresAt: input.expiresAt ?? null,
        metadata: (input.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        isActive: true,
      },
    })

    const response = this.toCouponResponse(coupon)

    // Emit event
    this.eventEmitter.emit('coupon.created', {
      couponId: coupon.id,
      storeId,
      promotionId: coupon.promotionId,
      code: coupon.code,
      timestamp: new Date().toISOString(),
    })

    this.logger.log(`Coupon created: ${coupon.id} (${code}) in store ${storeId}`)

    return response
  }

  /**
   * Generate multiple coupons in bulk.
   *
   * @param storeId - Store ID for tenant isolation
   * @param input - Bulk generation parameters
   * @returns Generated coupons
   */
  async generateBulk(
    storeId: string,
    input: GenerateCouponsInput,
  ): Promise<GenerateCouponsResultDto> {
    // Validate promotion exists
    await this.validatePromotion(storeId, input.promotionId)

    // Generate unique codes
    const codes: string[] = []
    for (let i = 0; i < input.count; i++) {
      const code = await this.generateUniqueCode(
        storeId,
        input.prefix?.toUpperCase(),
        input.suffix?.toUpperCase(),
        input.codeLength,
      )
      codes.push(code)
    }

    // Create all coupons in a transaction
    const coupons = await this.prisma.$transaction(
      codes.map((code) =>
        this.prisma.coupon.create({
          data: {
            storeId,
            promotionId: input.promotionId,
            code,
            usageLimit: input.usageLimit ?? null,
            expiresAt: input.expiresAt ?? null,
            metadata: (input.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
            isActive: true,
          },
        }),
      ),
    )

    const response = {
      promotionId: input.promotionId,
      count: coupons.length,
      coupons: coupons.map((c) => this.toCouponResponse(c)),
    }

    // Emit event
    this.eventEmitter.emit('coupons.generated', {
      storeId,
      promotionId: input.promotionId,
      count: coupons.length,
      couponIds: coupons.map((c) => c.id),
      timestamp: new Date().toISOString(),
    })

    this.logger.log(
      `Generated ${coupons.length} coupons for promotion ${input.promotionId} in store ${storeId}`,
    )

    return response
  }

  /**
   * Update a coupon.
   *
   * @param storeId - Store ID for tenant isolation
   * @param couponId - Coupon ID to update
   * @param input - Update data
   * @returns Updated coupon
   */
  async update(
    storeId: string,
    couponId: string,
    input: UpdateCouponInput,
  ): Promise<CouponResponseDto> {
    const existing = await this.prisma.coupon.findFirst({
      where: { id: couponId, storeId },
    })

    if (!existing) {
      throw new NotFoundException('Coupon not found')
    }

    const updateData: Prisma.CouponUncheckedUpdateInput = {}
    if (input.isActive !== undefined) updateData.isActive = input.isActive
    if (input.usageLimit !== undefined) updateData.usageLimit = input.usageLimit
    if (input.expiresAt !== undefined) updateData.expiresAt = input.expiresAt
    if (input.metadata !== undefined) {
      updateData.metadata = (input.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull
    }

    const coupon = await this.prisma.coupon.update({
      where: { id: couponId },
      data: updateData,
    })

    const response = this.toCouponResponse(coupon)

    // Emit event
    this.eventEmitter.emit('coupon.updated', {
      couponId: coupon.id,
      storeId,
      changes: updateData,
      timestamp: new Date().toISOString(),
    })

    this.logger.log(`Coupon updated: ${couponId} in store ${storeId}`)

    return response
  }

  /**
   * Deactivate a coupon.
   *
   * @param storeId - Store ID for tenant isolation
   * @param couponId - Coupon ID to deactivate
   * @returns Updated coupon
   */
  async deactivate(storeId: string, couponId: string): Promise<CouponResponseDto> {
    return this.update(storeId, couponId, { isActive: false })
  }

  /**
   * Delete a coupon.
   *
   * @param storeId - Store ID for tenant isolation
   * @param couponId - Coupon ID to delete
   */
  async delete(storeId: string, couponId: string): Promise<void> {
    const existing = await this.prisma.coupon.findFirst({
      where: { id: couponId, storeId },
      include: { _count: { select: { usages: true } } },
    })

    if (!existing) {
      throw new NotFoundException('Coupon not found')
    }

    // Warn if coupon has been used
    if (existing._count.usages > 0) {
      this.logger.warn(
        `Deleting coupon ${couponId} that has ${existing._count.usages} usage records`,
      )
    }

    await this.prisma.coupon.delete({ where: { id: couponId } })

    // Emit event
    this.eventEmitter.emit('coupon.deleted', {
      couponId,
      storeId,
      timestamp: new Date().toISOString(),
    })

    this.logger.log(`Coupon deleted: ${couponId} from store ${storeId}`)
  }

  /**
   * Get a coupon by ID.
   *
   * @param storeId - Store ID for tenant isolation
   * @param couponId - Coupon ID
   * @returns Coupon or throws NotFoundException
   */
  async findById(storeId: string, couponId: string): Promise<CouponResponseDto> {
    const coupon = await this.prisma.coupon.findFirst({
      where: { id: couponId, storeId },
    })

    if (!coupon) {
      throw new NotFoundException('Coupon not found')
    }

    return this.toCouponResponse(coupon)
  }

  /**
   * Find a coupon by code.
   *
   * @param storeId - Store ID for tenant isolation
   * @param code - Coupon code (case-insensitive)
   * @returns Coupon or null
   */
  async findByCode(storeId: string, code: string): Promise<CouponResponseDto | null> {
    const coupon = await this.prisma.coupon.findFirst({
      where: { storeId, code: code.toUpperCase() },
    })

    return coupon ? this.toCouponResponse(coupon) : null
  }

  /**
   * List coupons with optional filtering.
   *
   * @param storeId - Store ID for tenant isolation
   * @param input - List query parameters
   * @returns Paginated coupons list
   */
  async list(storeId: string, input: ListCouponsOptions = {}): Promise<CouponsListResult> {
    const page = input.page ?? 1
    const limit = input.limit ?? 50
    const skip = (page - 1) * limit

    const now = new Date()

    // Build where clause
    const where: Prisma.CouponWhereInput = {
      storeId,
      ...(input.promotionId && { promotionId: input.promotionId }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      ...(input.search && { code: { contains: input.search.toUpperCase(), mode: 'insensitive' } }),
      ...(!input.includeExpired && {
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      }),
    }

    // Execute queries in parallel
    const [coupons, total] = await Promise.all([
      this.prisma.coupon.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.coupon.count({ where }),
    ])

    return {
      items: coupons.map((c) => this.toCouponResponse(c)),
      total,
      page,
      limit,
      hasMore: skip + coupons.length < total,
    }
  }

  // ==========================================================================
  // Validation Methods
  // ==========================================================================

  /**
   * Validate a coupon code for use.
   * Checks all validity conditions.
   *
   * @param storeId - Store ID for tenant isolation
   * @param input - Validation input
   * @returns Validation result with details
   */
  async validate(storeId: string, input: ValidateCouponInput): Promise<CouponValidationResultDto> {
    const now = new Date()

    // Find coupon with promotion
    const coupon = await this.prisma.coupon.findFirst({
      where: { storeId, code: input.code.toUpperCase() },
      include: { promotion: true },
    })

    // Not found
    if (!coupon) {
      return {
        valid: false,
        errorCode: 'NOT_FOUND',
        errorMessage: 'Coupon code not found',
      }
    }

    // Coupon inactive
    if (!coupon.isActive) {
      return {
        valid: false,
        coupon: this.toCouponResponse(coupon),
        errorCode: 'INACTIVE',
        errorMessage: 'Coupon is not active',
      }
    }

    // Coupon expired
    if (coupon.expiresAt && coupon.expiresAt <= now) {
      return {
        valid: false,
        coupon: this.toCouponResponse(coupon),
        errorCode: 'EXPIRED',
        errorMessage: 'Coupon has expired',
      }
    }

    // Coupon usage limit reached
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return {
        valid: false,
        coupon: this.toCouponResponse(coupon),
        errorCode: 'USAGE_LIMIT_REACHED',
        errorMessage: 'Coupon usage limit reached',
      }
    }

    // Check promotion status
    const promotion = coupon.promotion
    const invalidStatuses: PromotionStatus[] = ['DRAFT', 'PAUSED', 'EXPIRED', 'ARCHIVED']
    if (invalidStatuses.includes(promotion.status)) {
      return {
        valid: false,
        coupon: this.toCouponResponse(coupon),
        errorCode: 'PROMOTION_INACTIVE',
        errorMessage: `Promotion is ${promotion.status.toLowerCase()}`,
      }
    }

    // Promotion not started
    if (promotion.startsAt > now) {
      return {
        valid: false,
        coupon: this.toCouponResponse(coupon),
        errorCode: 'NOT_STARTED',
        errorMessage: 'Promotion has not started yet',
      }
    }

    // Promotion ended
    if (promotion.endsAt && promotion.endsAt <= now) {
      return {
        valid: false,
        coupon: this.toCouponResponse(coupon),
        errorCode: 'EXPIRED',
        errorMessage: 'Promotion has ended',
      }
    }

    // Promotion usage limit reached
    if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
      return {
        valid: false,
        coupon: this.toCouponResponse(coupon),
        errorCode: 'USAGE_LIMIT_REACHED',
        errorMessage: 'Promotion usage limit reached',
      }
    }

    // Check per-customer limit if customerId provided
    if (input.customerId && promotion.perCustomerLimit) {
      const customerUsageCount = await this.prisma.promotionUsage.count({
        where: {
          promotionId: promotion.id,
          customerId: input.customerId,
        },
      })

      if (customerUsageCount >= promotion.perCustomerLimit) {
        return {
          valid: false,
          coupon: this.toCouponResponse(coupon),
          errorCode: 'CUSTOMER_LIMIT_REACHED',
          errorMessage: 'You have reached the maximum uses for this promotion',
        }
      }
    }

    // Check min order amount if provided
    const conditions = promotion.conditions as PromotionConditions
    if (conditions?.minOrderCents && input.orderTotalCents !== undefined) {
      if (input.orderTotalCents < conditions.minOrderCents) {
        return {
          valid: false,
          coupon: this.toCouponResponse(coupon),
          errorCode: 'MIN_ORDER_NOT_MET',
          errorMessage: `Minimum order amount of ${conditions.minOrderCents / 100} required`,
        }
      }
    }

    // All checks passed - valid
    return {
      valid: true,
      coupon: this.toCouponResponse(coupon),
      promotion: {
        id: promotion.id,
        name: promotion.name,
        type: promotion.type,
        discountValue: promotion.discountValue,
        maxDiscountCents: promotion.maxDiscountCents,
        conditions: conditions,
      },
    }
  }

  // ==========================================================================
  // Usage Tracking Methods
  // ==========================================================================

  /**
   * Increment usage count for a coupon.
   * Called when a coupon is used in an order.
   *
   * @param storeId - Store ID for tenant isolation
   * @param couponId - Coupon ID
   * @returns Updated coupon
   */
  async incrementUsage(storeId: string, couponId: string): Promise<CouponResponseDto> {
    const coupon = await this.prisma.coupon.update({
      where: { id: couponId, storeId },
      data: { usageCount: { increment: 1 } },
    })

    return this.toCouponResponse(coupon)
  }

  // ==========================================================================
  // Protected Helpers
  // ==========================================================================

  /**
   * Convert Prisma Coupon to API response.
   * Protected for @trafi/core customization.
   */
  protected toCouponResponse(coupon: PrismaCoupon): CouponResponseDto {
    return {
      id: coupon.id,
      storeId: coupon.storeId,
      promotionId: coupon.promotionId,
      code: coupon.code,
      usageLimit: coupon.usageLimit,
      usageCount: coupon.usageCount,
      expiresAt: coupon.expiresAt,
      isActive: coupon.isActive,
      metadata: coupon.metadata as Record<string, unknown> | null,
      createdAt: coupon.createdAt,
      updatedAt: coupon.updatedAt,
    }
  }
}
