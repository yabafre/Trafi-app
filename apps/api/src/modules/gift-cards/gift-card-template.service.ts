import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common'
import { PrismaService } from '@database/prisma.service'
import { type GiftCardTemplate as PrismaTemplate, Prisma } from '@generated/prisma/client'
import type {
  CreateGiftCardTemplateInput,
  UpdateGiftCardTemplateInput,
} from '@trafi/validators'
import type {
  GiftCardTemplateDTO,
  GiftCardTemplateListResult,
} from '@trafi/types'

// Re-export types for backwards compatibility
export type GiftCardTemplateDto = GiftCardTemplateDTO
export type TemplatesListResult = GiftCardTemplateListResult

/**
 * List gift card templates options (simplified for service use)
 */
export interface ListGiftCardTemplatesOptions {
  isActive?: boolean
  search?: string
  page?: number
  limit?: number
}

/**
 * Gift Card Template management service
 *
 * IMPORTANT: Use `protected` methods (not `private`) to support
 * merchant overrides in @trafi/core distribution model (RETRO-2).
 *
 * @see Story 3.10 - Gift Cards (AC1, AC6)
 */
@Injectable()
export class GiftCardTemplateService {
  protected readonly logger = new Logger(GiftCardTemplateService.name)

  constructor(protected readonly prisma: PrismaService) {}

  // ==========================================================================
  // Validation Methods
  // ==========================================================================

  /**
   * Validate denominations array.
   * Protected for merchant override.
   */
  protected validateDenominations(denominations: number[]): void {
    if (denominations.length === 0) {
      throw new BadRequestException('At least one denomination is required')
    }

    if (denominations.some((d) => d <= 0)) {
      throw new BadRequestException('All denominations must be positive')
    }

    // Check for duplicates
    const unique = new Set(denominations)
    if (unique.size !== denominations.length) {
      throw new BadRequestException('Denominations must be unique')
    }
  }

  /**
   * Validate custom amount range.
   * Protected for merchant override.
   */
  protected validateCustomAmountRange(
    allowCustomAmount: boolean,
    minAmountCents: number | null | undefined,
    maxAmountCents: number | null | undefined,
  ): void {
    if (allowCustomAmount) {
      if (minAmountCents === null || minAmountCents === undefined) {
        throw new BadRequestException('minAmountCents is required when allowCustomAmount is true')
      }
      if (maxAmountCents === null || maxAmountCents === undefined) {
        throw new BadRequestException('maxAmountCents is required when allowCustomAmount is true')
      }
      if (maxAmountCents < minAmountCents) {
        throw new BadRequestException('maxAmountCents must be >= minAmountCents')
      }
    }
  }

  // ==========================================================================
  // CRUD Methods
  // ==========================================================================

  /**
   * Create a new gift card template.
   *
   * @param storeId - Store ID for tenant isolation
   * @param input - Template creation data
   * @returns Created template
   */
  async create(storeId: string, input: CreateGiftCardTemplateInput): Promise<GiftCardTemplateDto> {
    // Validate denominations
    this.validateDenominations(input.denominations)

    // Validate custom amount range
    this.validateCustomAmountRange(
      input.allowCustomAmount ?? false,
      input.minAmountCents,
      input.maxAmountCents,
    )

    const template = await this.prisma.giftCardTemplate.create({
      data: {
        storeId,
        name: input.name,
        description: input.description ?? null,
        designImageUrl: input.designImageUrl ?? null,
        denominations: input.denominations,
        allowCustomAmount: input.allowCustomAmount ?? false,
        minAmountCents: input.minAmountCents ?? null,
        maxAmountCents: input.maxAmountCents ?? null,
        validityDays: input.validityDays ?? null,
        isActive: input.isActive ?? true,
      },
    })

    this.logger.log(`Gift card template created: ${template.id} in store ${storeId}`)

    return this.toTemplateDto(template)
  }

  /**
   * Update an existing template.
   *
   * @param storeId - Store ID for tenant isolation
   * @param templateId - Template ID
   * @param input - Update data
   * @returns Updated template
   */
  async update(
    storeId: string,
    templateId: string,
    input: UpdateGiftCardTemplateInput,
  ): Promise<GiftCardTemplateDto> {
    // Find existing template
    const existing = await this.prisma.giftCardTemplate.findFirst({
      where: { id: templateId, storeId },
    })

    if (!existing) {
      throw new NotFoundException('Gift card template not found')
    }

    // Validate denominations if provided
    if (input.denominations) {
      this.validateDenominations(input.denominations)
    }

    // Validate custom amount range
    const effectiveAllowCustom = input.allowCustomAmount ?? existing.allowCustomAmount
    const effectiveMin = input.minAmountCents !== undefined ? input.minAmountCents : existing.minAmountCents
    const effectiveMax = input.maxAmountCents !== undefined ? input.maxAmountCents : existing.maxAmountCents

    if (input.allowCustomAmount !== undefined || input.minAmountCents !== undefined || input.maxAmountCents !== undefined) {
      this.validateCustomAmountRange(effectiveAllowCustom, effectiveMin, effectiveMax)
    }

    // Build update data
    const updateData: Prisma.GiftCardTemplateUpdateInput = {}
    if (input.name !== undefined) updateData.name = input.name
    if (input.description !== undefined) updateData.description = input.description
    if (input.designImageUrl !== undefined) updateData.designImageUrl = input.designImageUrl
    if (input.denominations !== undefined) updateData.denominations = input.denominations
    if (input.allowCustomAmount !== undefined) updateData.allowCustomAmount = input.allowCustomAmount
    if (input.minAmountCents !== undefined) updateData.minAmountCents = input.minAmountCents
    if (input.maxAmountCents !== undefined) updateData.maxAmountCents = input.maxAmountCents
    if (input.validityDays !== undefined) updateData.validityDays = input.validityDays
    if (input.isActive !== undefined) updateData.isActive = input.isActive

    const template = await this.prisma.giftCardTemplate.update({
      where: { id: templateId },
      data: updateData,
    })

    this.logger.log(`Gift card template updated: ${templateId}`)

    return this.toTemplateDto(template)
  }

  /**
   * Delete a template.
   *
   * @param storeId - Store ID for tenant isolation
   * @param templateId - Template ID
   */
  async delete(storeId: string, templateId: string): Promise<void> {
    // Find existing template
    const existing = await this.prisma.giftCardTemplate.findFirst({
      where: { id: templateId, storeId },
      include: { _count: { select: { giftCards: true } } },
    })

    if (!existing) {
      throw new NotFoundException('Gift card template not found')
    }

    // Warn if template has gift cards
    if (existing._count.giftCards > 0) {
      this.logger.warn(
        `Deleting template ${templateId} that has ${existing._count.giftCards} gift cards`,
      )
    }

    // Delete template (gift cards keep templateId as null)
    await this.prisma.giftCardTemplate.delete({ where: { id: templateId } })

    this.logger.log(`Gift card template deleted: ${templateId}`)
  }

  /**
   * Get a template by ID.
   *
   * @param storeId - Store ID for tenant isolation
   * @param templateId - Template ID
   * @returns Template or throws NotFoundException
   */
  async findById(storeId: string, templateId: string): Promise<GiftCardTemplateDto> {
    const template = await this.prisma.giftCardTemplate.findFirst({
      where: { id: templateId, storeId },
      include: {
        _count: {
          select: {
            giftCards: { where: { status: 'ACTIVE' } },
          },
        },
      },
    })

    if (!template) {
      throw new NotFoundException('Gift card template not found')
    }

    return this.toTemplateDto(template, template._count.giftCards)
  }

  /**
   * List templates with filtering and pagination.
   *
   * @param storeId - Store ID for tenant isolation
   * @param input - List options
   * @returns Paginated list
   */
  async list(storeId: string, input: ListGiftCardTemplatesOptions = {}): Promise<TemplatesListResult> {
    const page = input.page ?? 1
    const limit = input.limit ?? 50
    const skip = (page - 1) * limit

    // Build where clause
    const where: Prisma.GiftCardTemplateWhereInput = {
      storeId,
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      ...(input.search && {
        OR: [
          { name: { contains: input.search, mode: 'insensitive' } },
          { description: { contains: input.search, mode: 'insensitive' } },
        ],
      }),
    }

    // Execute queries in parallel
    const [templates, total] = await Promise.all([
      this.prisma.giftCardTemplate.findMany({
        where,
        orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              giftCards: { where: { status: 'ACTIVE' } },
            },
          },
        },
      }),
      this.prisma.giftCardTemplate.count({ where }),
    ])

    return {
      items: templates.map((t) => this.toTemplateDto(t, t._count.giftCards)),
      total,
      page,
      limit,
      hasMore: skip + templates.length < total,
    }
  }

  /**
   * Activate a template.
   *
   * @param storeId - Store ID for tenant isolation
   * @param templateId - Template ID
   * @returns Updated template
   */
  async activate(storeId: string, templateId: string): Promise<GiftCardTemplateDto> {
    const existing = await this.prisma.giftCardTemplate.findFirst({
      where: { id: templateId, storeId },
    })

    if (!existing) {
      throw new NotFoundException('Gift card template not found')
    }

    const template = await this.prisma.giftCardTemplate.update({
      where: { id: templateId },
      data: { isActive: true },
    })

    this.logger.log(`Gift card template activated: ${templateId}`)

    return this.toTemplateDto(template)
  }

  /**
   * Deactivate a template.
   *
   * @param storeId - Store ID for tenant isolation
   * @param templateId - Template ID
   * @returns Updated template
   */
  async deactivate(storeId: string, templateId: string): Promise<GiftCardTemplateDto> {
    const existing = await this.prisma.giftCardTemplate.findFirst({
      where: { id: templateId, storeId },
    })

    if (!existing) {
      throw new NotFoundException('Gift card template not found')
    }

    const template = await this.prisma.giftCardTemplate.update({
      where: { id: templateId },
      data: { isActive: false },
    })

    this.logger.log(`Gift card template deactivated: ${templateId}`)

    return this.toTemplateDto(template)
  }

  /**
   * Get templates for select dropdown (active only).
   *
   * @param storeId - Store ID for tenant isolation
   * @returns List of templates for selection
   */
  async listForSelect(storeId: string): Promise<
    Array<{
      id: string
      name: string
      denominations: number[]
      allowCustomAmount: boolean
      validityDays: number | null
    }>
  > {
    const templates = await this.prisma.giftCardTemplate.findMany({
      where: { storeId, isActive: true },
      select: {
        id: true,
        name: true,
        denominations: true,
        allowCustomAmount: true,
        validityDays: true,
      },
      orderBy: { name: 'asc' },
    })

    return templates
  }

  // ==========================================================================
  // Protected Helpers
  // ==========================================================================

  /**
   * Convert Prisma Template to DTO.
   * Protected for @trafi/core customization.
   */
  protected toTemplateDto(
    template: PrismaTemplate,
    activeCardCount?: number,
  ): GiftCardTemplateDto {
    return {
      id: template.id,
      storeId: template.storeId,
      name: template.name,
      description: template.description,
      designImageUrl: template.designImageUrl,
      denominations: template.denominations,
      allowCustomAmount: template.allowCustomAmount,
      minAmountCents: template.minAmountCents,
      maxAmountCents: template.maxAmountCents,
      validityDays: template.validityDays,
      isActive: template.isActive,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
      ...(activeCardCount !== undefined && { activeCardCount }),
    }
  }
}
