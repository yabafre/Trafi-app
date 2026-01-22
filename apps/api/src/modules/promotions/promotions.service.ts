import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { PrismaService } from '@database/prisma.service'
import {
  type Promotion as PrismaPromotion,
  type PromotionStatus,
  type PromotionType,
  Prisma,
} from '@generated/prisma/client'
import type {
  CreatePromotionInput,
  UpdatePromotionInput,
  PromotionConditions,
} from '@trafi/validators'

/**
 * Input for listing promotions with optional filtering
 */
export interface ListPromotionsOptions {
  status?: string
  type?: string
  search?: string
  activeOnly?: boolean
  includeExpired?: boolean
  page?: number
  limit?: number
}

/**
 * Promotion response DTO for API consumers
 */
export interface PromotionResponseDto {
  id: string
  storeId: string
  name: string
  description: string | null
  type: PromotionType
  discountValue: number | null
  conditions: PromotionConditions
  conditionsVersion: number
  maxDiscountCents: number | null
  usageLimit: number | null
  usageCount: number
  perCustomerLimit: number | null
  startsAt: Date
  endsAt: Date | null
  status: PromotionStatus
  priority: number
  stackable: boolean
  createdAt: Date
  updatedAt: Date
  couponCount?: number
}

/**
 * Paginated promotions list result
 */
export interface PromotionsListResult {
  items: PromotionResponseDto[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

/**
 * Valid status transitions for promotions
 */
const STATUS_TRANSITIONS: Record<PromotionStatus, PromotionStatus[]> = {
  DRAFT: ['ACTIVE', 'ARCHIVED'],
  ACTIVE: ['PAUSED', 'EXPIRED', 'ARCHIVED'],
  PAUSED: ['ACTIVE', 'ARCHIVED'],
  EXPIRED: ['ARCHIVED'],
  ARCHIVED: [], // Terminal state
}

/**
 * Promotions management service
 *
 * IMPORTANT: Use `protected` methods (not `private`) to support
 * merchant overrides in @trafi/core distribution model (RETRO-2).
 *
 * Key behaviors:
 * - Promotions are tenant-scoped via storeId (defense-in-depth)
 * - IDs automatically generated with promo_ prefix via PrismaService extension
 * - Status transitions are validated
 * - Emits events for promotion changes
 *
 * @see Story 3.9 - Promotions & Discounts Foundation
 */
@Injectable()
export class PromotionsService {
  protected readonly logger = new Logger(PromotionsService.name)

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly eventEmitter: EventEmitter2,
  ) {}

  // ==========================================================================
  // Protected Validation Methods
  // ==========================================================================

  /**
   * Validate discount value based on promotion type.
   * Protected for merchant override.
   */
  protected validateDiscountValue(
    type: PromotionType,
    discountValue: number | null | undefined,
    conditions: PromotionConditions,
  ): void {
    switch (type) {
      case 'PERCENT':
        if (discountValue === null || discountValue === undefined) {
          throw new BadRequestException('Percentage discount requires a value')
        }
        if (discountValue < 1 || discountValue > 100) {
          throw new BadRequestException('Percentage discount must be between 1 and 100')
        }
        break
      case 'FIXED':
        if (discountValue === null || discountValue === undefined || discountValue <= 0) {
          throw new BadRequestException('Fixed discount requires a positive value in cents')
        }
        break
      case 'FREE_SHIPPING':
        // No discount value needed
        break
      case 'BUY_X_GET_Y':
        if (!conditions?.buyQuantity || !conditions?.getQuantity) {
          throw new BadRequestException('BUY_X_GET_Y requires buyQuantity and getQuantity in conditions')
        }
        break
    }
  }

  /**
   * Validate date range.
   * Protected for merchant override.
   */
  protected validateDateRange(startsAt: Date, endsAt?: Date | null): void {
    if (endsAt && endsAt <= startsAt) {
      throw new BadRequestException('End date must be after start date')
    }
  }

  /**
   * Validate status transition.
   * Protected for merchant override.
   */
  protected validateStatusTransition(currentStatus: PromotionStatus, newStatus: PromotionStatus): void {
    const allowed = STATUS_TRANSITIONS[currentStatus]
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${currentStatus} to ${newStatus}. Allowed: ${allowed.join(', ') || 'none'}`,
      )
    }
  }

  // ==========================================================================
  // CRUD Methods
  // ==========================================================================

  /**
   * Create a new promotion.
   *
   * ID is automatically generated with promo_ prefix by PrismaService extension.
   *
   * @param storeId - Store ID for tenant isolation
   * @param input - Promotion creation data
   * @returns Created promotion
   */
  async create(storeId: string, input: CreatePromotionInput): Promise<PromotionResponseDto> {
    // Validate discount value
    this.validateDiscountValue(
      input.type as PromotionType,
      input.discountValue,
      input.conditions as PromotionConditions,
    )

    // Validate dates
    this.validateDateRange(input.startsAt, input.endsAt)

    const promotion = await this.prisma.promotion.create({
      data: {
        storeId,
        name: input.name,
        description: input.description ?? null,
        type: input.type as PromotionType,
        discountValue: input.discountValue ?? null,
        conditions: input.conditions ?? Prisma.JsonNull,
        maxDiscountCents: input.maxDiscountCents ?? null,
        usageLimit: input.usageLimit ?? null,
        perCustomerLimit: input.perCustomerLimit ?? null,
        startsAt: input.startsAt,
        endsAt: input.endsAt ?? null,
        priority: input.priority ?? 0,
        stackable: input.stackable ?? false,
        status: 'DRAFT',
      },
      include: {
        _count: { select: { coupons: true } },
      },
    })

    const response = this.toPromotionResponse(promotion, promotion._count.coupons)

    // Emit event
    this.eventEmitter.emit('promotion.created', {
      promotionId: promotion.id,
      storeId,
      name: promotion.name,
      type: promotion.type,
      timestamp: new Date().toISOString(),
    })

    this.logger.log(`Promotion created: ${promotion.id} in store ${storeId}`)

    return response
  }

  /**
   * Update an existing promotion.
   *
   * @param storeId - Store ID for tenant isolation
   * @param promotionId - Promotion ID to update
   * @param input - Update data
   * @returns Updated promotion
   */
  async update(
    storeId: string,
    promotionId: string,
    input: UpdatePromotionInput,
  ): Promise<PromotionResponseDto> {
    // Find existing promotion (with tenant check)
    const existing = await this.prisma.promotion.findFirst({
      where: { id: promotionId, storeId },
      include: { _count: { select: { coupons: true } } },
    })

    if (!existing) {
      throw new NotFoundException('Promotion not found')
    }

    // Determine effective type and conditions
    const effectiveType = (input.type ?? existing.type) as PromotionType
    const effectiveConditions =
      input.conditions !== undefined
        ? (input.conditions as PromotionConditions)
        : (existing.conditions as PromotionConditions)

    // Validate discount value if type or value changed
    if (input.type !== undefined || input.discountValue !== undefined) {
      const effectiveValue = input.discountValue ?? existing.discountValue
      this.validateDiscountValue(effectiveType, effectiveValue, effectiveConditions)
    }

    // Validate dates if changed
    if (input.startsAt || input.endsAt !== undefined) {
      const effectiveStartsAt = input.startsAt ?? existing.startsAt
      const effectiveEndsAt = input.endsAt !== undefined ? input.endsAt : existing.endsAt
      this.validateDateRange(effectiveStartsAt, effectiveEndsAt)
    }

    // Build update data
    const updateData: Prisma.PromotionUncheckedUpdateInput = {}
    if (input.name !== undefined) updateData.name = input.name
    if (input.description !== undefined) updateData.description = input.description
    if (input.type !== undefined) updateData.type = input.type as PromotionType
    if (input.discountValue !== undefined) updateData.discountValue = input.discountValue
    if (input.conditions !== undefined) {
      updateData.conditions = input.conditions ?? Prisma.JsonNull
    }
    if (input.maxDiscountCents !== undefined) updateData.maxDiscountCents = input.maxDiscountCents
    if (input.usageLimit !== undefined) updateData.usageLimit = input.usageLimit
    if (input.perCustomerLimit !== undefined) updateData.perCustomerLimit = input.perCustomerLimit
    if (input.startsAt !== undefined) updateData.startsAt = input.startsAt
    if (input.endsAt !== undefined) updateData.endsAt = input.endsAt
    if (input.priority !== undefined) updateData.priority = input.priority
    if (input.stackable !== undefined) updateData.stackable = input.stackable

    const promotion = await this.prisma.promotion.update({
      where: { id: promotionId },
      data: updateData,
      include: { _count: { select: { coupons: true } } },
    })

    const response = this.toPromotionResponse(promotion, promotion._count.coupons)

    // Emit event
    this.eventEmitter.emit('promotion.updated', {
      promotionId: promotion.id,
      storeId,
      changes: updateData,
      timestamp: new Date().toISOString(),
    })

    this.logger.log(`Promotion updated: ${promotionId} in store ${storeId}`)

    return response
  }

  /**
   * Delete a promotion and all associated coupons.
   *
   * @param storeId - Store ID for tenant isolation
   * @param promotionId - Promotion ID to delete
   */
  async delete(storeId: string, promotionId: string): Promise<void> {
    // Find existing promotion
    const existing = await this.prisma.promotion.findFirst({
      where: { id: promotionId, storeId },
      include: { _count: { select: { usages: true } } },
    })

    if (!existing) {
      throw new NotFoundException('Promotion not found')
    }

    // Warn if promotion has been used (but still allow delete)
    if (existing._count.usages > 0) {
      this.logger.warn(
        `Deleting promotion ${promotionId} that has ${existing._count.usages} usage records`,
      )
    }

    // Delete promotion (cascades to coupons and usages)
    await this.prisma.promotion.delete({ where: { id: promotionId } })

    // Emit event
    this.eventEmitter.emit('promotion.deleted', {
      promotionId,
      storeId,
      timestamp: new Date().toISOString(),
    })

    this.logger.log(`Promotion deleted: ${promotionId} from store ${storeId}`)
  }

  /**
   * Get a promotion by ID.
   *
   * @param storeId - Store ID for tenant isolation
   * @param promotionId - Promotion ID
   * @returns Promotion or throws NotFoundException
   */
  async findById(storeId: string, promotionId: string): Promise<PromotionResponseDto> {
    const promotion = await this.prisma.promotion.findFirst({
      where: { id: promotionId, storeId },
      include: { _count: { select: { coupons: true } } },
    })

    if (!promotion) {
      throw new NotFoundException('Promotion not found')
    }

    return this.toPromotionResponse(promotion, promotion._count.coupons)
  }

  /**
   * List promotions for a store with optional filtering.
   *
   * @param storeId - Store ID for tenant isolation
   * @param input - List query parameters
   * @returns Paginated promotions list
   */
  async list(storeId: string, input: ListPromotionsOptions = {}): Promise<PromotionsListResult> {
    const page = input.page ?? 1
    const limit = input.limit ?? 50
    const skip = (page - 1) * limit

    const now = new Date()

    // Build where clause
    const where: Prisma.PromotionWhereInput = {
      storeId,
      ...(input.status && { status: input.status as PromotionStatus }),
      ...(input.type && { type: input.type as PromotionType }),
      ...(input.search && {
        OR: [
          { name: { contains: input.search, mode: 'insensitive' } },
          { description: { contains: input.search, mode: 'insensitive' } },
        ],
      }),
      ...(input.activeOnly && {
        status: 'ACTIVE',
        startsAt: { lte: now },
        OR: [{ endsAt: null }, { endsAt: { gt: now } }],
      }),
      ...(!input.includeExpired && {
        status: { not: 'EXPIRED' },
      }),
    }

    // Execute queries in parallel
    const [promotions, total] = await Promise.all([
      this.prisma.promotion.findMany({
        where,
        orderBy: [{ status: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
        include: { _count: { select: { coupons: true } } },
      }),
      this.prisma.promotion.count({ where }),
    ])

    return {
      items: promotions.map((p) => this.toPromotionResponse(p, p._count.coupons)),
      total,
      page,
      limit,
      hasMore: skip + promotions.length < total,
    }
  }

  // ==========================================================================
  // Status Transition Methods
  // ==========================================================================

  /**
   * Activate a promotion.
   *
   * @param storeId - Store ID for tenant isolation
   * @param promotionId - Promotion ID to activate
   * @returns Updated promotion
   */
  async activate(storeId: string, promotionId: string): Promise<PromotionResponseDto> {
    return this.updateStatus(storeId, promotionId, 'ACTIVE')
  }

  /**
   * Pause a promotion.
   *
   * @param storeId - Store ID for tenant isolation
   * @param promotionId - Promotion ID to pause
   * @returns Updated promotion
   */
  async pause(storeId: string, promotionId: string): Promise<PromotionResponseDto> {
    return this.updateStatus(storeId, promotionId, 'PAUSED')
  }

  /**
   * Archive a promotion (soft delete).
   *
   * @param storeId - Store ID for tenant isolation
   * @param promotionId - Promotion ID to archive
   * @returns Updated promotion
   */
  async archive(storeId: string, promotionId: string): Promise<PromotionResponseDto> {
    return this.updateStatus(storeId, promotionId, 'ARCHIVED')
  }

  /**
   * Update promotion status with validation.
   *
   * @param storeId - Store ID for tenant isolation
   * @param promotionId - Promotion ID
   * @param newStatus - New status to transition to
   * @returns Updated promotion
   */
  async updateStatus(
    storeId: string,
    promotionId: string,
    newStatus: PromotionStatus,
  ): Promise<PromotionResponseDto> {
    const existing = await this.prisma.promotion.findFirst({
      where: { id: promotionId, storeId },
      include: { _count: { select: { coupons: true } } },
    })

    if (!existing) {
      throw new NotFoundException('Promotion not found')
    }

    // Validate transition
    this.validateStatusTransition(existing.status, newStatus)

    // Additional validation for ACTIVE
    if (newStatus === 'ACTIVE') {
      const now = new Date()
      if (existing.endsAt && existing.endsAt <= now) {
        throw new BadRequestException('Cannot activate promotion that has already ended')
      }
    }

    const previousStatus = existing.status

    const promotion = await this.prisma.promotion.update({
      where: { id: promotionId },
      data: { status: newStatus },
      include: { _count: { select: { coupons: true } } },
    })

    const response = this.toPromotionResponse(promotion, promotion._count.coupons)

    // Emit event
    this.eventEmitter.emit('promotion.statusChanged', {
      promotionId: promotion.id,
      storeId,
      previousStatus,
      newStatus,
      timestamp: new Date().toISOString(),
    })

    this.logger.log(
      `Promotion status changed: ${promotionId} from ${previousStatus} to ${newStatus}`,
    )

    return response
  }

  // ==========================================================================
  // Usage Tracking Methods
  // ==========================================================================

  /**
   * Increment usage count for a promotion.
   * Called when a promotion is applied to an order.
   *
   * @param storeId - Store ID for tenant isolation
   * @param promotionId - Promotion ID
   * @returns Updated promotion
   */
  async incrementUsage(storeId: string, promotionId: string): Promise<PromotionResponseDto> {
    const promotion = await this.prisma.promotion.update({
      where: { id: promotionId, storeId },
      data: { usageCount: { increment: 1 } },
      include: { _count: { select: { coupons: true } } },
    })

    // Check if usage limit reached
    if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
      // Emit limit reached event
      this.eventEmitter.emit('promotion.limitReached', {
        promotionId: promotion.id,
        storeId,
        usageCount: promotion.usageCount,
        usageLimit: promotion.usageLimit,
        timestamp: new Date().toISOString(),
      })
    }

    return this.toPromotionResponse(promotion, promotion._count.coupons)
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Check and expire promotions that have passed their end date.
   * Called by a scheduled job.
   *
   * @param storeId - Optional store ID to scope to a single store
   * @returns Number of promotions expired
   */
  async expireEndedPromotions(storeId?: string): Promise<number> {
    const now = new Date()

    const result = await this.prisma.promotion.updateMany({
      where: {
        ...(storeId && { storeId }),
        status: 'ACTIVE',
        endsAt: { lt: now },
      },
      data: { status: 'EXPIRED' },
    })

    if (result.count > 0) {
      this.logger.log(`Expired ${result.count} promotions`)
    }

    return result.count
  }

  /**
   * Get promotions for select dropdown.
   *
   * @param storeId - Store ID for tenant isolation
   * @returns List of promotions with basic info
   */
  async listForSelect(
    storeId: string,
  ): Promise<{ id: string; name: string; type: PromotionType; status: PromotionStatus }[]> {
    const promotions = await this.prisma.promotion.findMany({
      where: { storeId, status: { not: 'ARCHIVED' } },
      select: { id: true, name: true, type: true, status: true },
      orderBy: [{ status: 'asc' }, { name: 'asc' }],
    })

    return promotions
  }

  // ==========================================================================
  // Protected Helpers
  // ==========================================================================

  /**
   * Convert Prisma Promotion to API response.
   * Protected for @trafi/core customization.
   */
  protected toPromotionResponse(
    promotion: PrismaPromotion,
    couponCount?: number,
  ): PromotionResponseDto {
    return {
      id: promotion.id,
      storeId: promotion.storeId,
      name: promotion.name,
      description: promotion.description,
      type: promotion.type,
      discountValue: promotion.discountValue,
      conditions: promotion.conditions as PromotionConditions,
      conditionsVersion: promotion.conditionsVersion,
      maxDiscountCents: promotion.maxDiscountCents,
      usageLimit: promotion.usageLimit,
      usageCount: promotion.usageCount,
      perCustomerLimit: promotion.perCustomerLimit,
      startsAt: promotion.startsAt,
      endsAt: promotion.endsAt,
      status: promotion.status,
      priority: promotion.priority,
      stackable: promotion.stackable,
      createdAt: promotion.createdAt,
      updatedAt: promotion.updatedAt,
      ...(couponCount !== undefined && { couponCount }),
    }
  }
}
