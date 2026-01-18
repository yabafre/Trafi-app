import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@database/prisma.service';
import type { TaxRule as PrismaTaxRule, Prisma } from '@generated/prisma/client';
/**
 * Input for creating a tax rule
 */
export interface CreateTaxRuleOptions {
  name: string;
  rate: number;
  countryIso2: string;
  isDefault?: boolean;
  appliesToShipping?: boolean;
}

/**
 * Input for updating a tax rule
 */
export interface UpdateTaxRuleOptions {
  id: string;
  name?: string;
  rate?: number;
  countryIso2?: string;
  isDefault?: boolean;
  appliesToShipping?: boolean;
}

/**
 * Input for listing tax rules with optional filtering
 */
export interface ListTaxRulesOptions {
  countryIso2?: string;
  isDefault?: boolean;
  page?: number;
  limit?: number;
}

/**
 * Tax rule response DTO for API consumers
 */
export interface TaxRuleResponseDto {
  id: string;
  storeId: string;
  name: string;
  rate: number;
  countryIso2: string;
  isDefault: boolean;
  appliesToShipping: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Paginated tax rules list result
 */
export interface TaxRulesListResult {
  items: TaxRuleResponseDto[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Tax rules management service
 *
 * IMPORTANT: Use `protected` methods (not `private`) to support
 * merchant overrides in @trafi/core distribution model (RETRO-2).
 *
 * Key behaviors:
 * - Tax rules are tenant-scoped via storeId (defense-in-depth)
 * - IDs automatically generated with tax_ prefix via PrismaService extension
 * - One default tax rule per store
 * - Emits events for tax rule changes
 *
 * @see Story 3.6 - Product Pricing and Tax Rules
 */
@Injectable()
export class TaxRulesService {
  protected readonly logger = new Logger(TaxRulesService.name);

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly eventEmitter: EventEmitter2,
  ) {}

  // ==========================================================================
  // Protected Validation Methods
  // ==========================================================================

  /**
   * Validate that a tax rule name is unique within a store.
   * Protected for merchant override.
   *
   * @param storeId - Store ID for tenant scoping
   * @param name - Name to validate
   * @param excludeId - Tax rule ID to exclude (for updates)
   * @throws ConflictException if name already exists
   */
  protected async validateNameUnique(
    storeId: string,
    name: string,
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.prisma.taxRule.findFirst({
      where: {
        storeId,
        name,
        ...(excludeId && { NOT: { id: excludeId } }),
      },
    });

    if (existing) {
      throw new ConflictException(`Tax rule with name "${name}" already exists`);
    }
  }

  /**
   * Validate that country code exists in global Country table.
   * Protected for merchant override.
   *
   * @param countryIso2 - ISO 3166-1 alpha-2 country code
   * @throws BadRequestException if country not found
   */
  protected async validateCountryCode(countryIso2: string): Promise<void> {
    const country = await this.prisma.country.findUnique({
      where: { iso2: countryIso2.toUpperCase() },
    });

    if (!country) {
      throw new BadRequestException(`Invalid country code: ${countryIso2}`);
    }
  }

  /**
   * Handle default tax rule logic when creating/updating.
   * Ensures only one default per store by clearing other defaults.
   * Protected for merchant override.
   *
   * @param storeId - Store ID for tenant scoping
   * @param taxRuleId - Tax rule being set as default
   */
  protected async handleDefaultFlag(storeId: string, taxRuleId: string): Promise<void> {
    // Clear existing default(s) for this store
    await this.prisma.taxRule.updateMany({
      where: {
        storeId,
        isDefault: true,
        NOT: { id: taxRuleId },
      },
      data: { isDefault: false },
    });
  }

  // ==========================================================================
  // CRUD Methods
  // ==========================================================================

  /**
   * Create a new tax rule.
   *
   * ID is automatically generated with tax_ prefix by PrismaService extension.
   *
   * @param storeId - Store ID for tenant isolation
   * @param input - Tax rule creation data
   * @returns Created tax rule
   */
  async create(storeId: string, input: CreateTaxRuleOptions): Promise<TaxRuleResponseDto> {
    // Validate name uniqueness
    await this.validateNameUnique(storeId, input.name);

    // Validate country code
    await this.validateCountryCode(input.countryIso2);

    // Create in transaction to handle default flag atomically
    const taxRule = await this.prisma.$transaction(async (tx) => {
      // If this is the first tax rule or marked as default, handle defaults
      if (input.isDefault) {
        await tx.taxRule.updateMany({
          where: { storeId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.taxRule.create({
        data: {
          storeId,
          name: input.name,
          rate: input.rate,
          countryIso2: input.countryIso2.toUpperCase(),
          isDefault: input.isDefault ?? false,
          appliesToShipping: input.appliesToShipping ?? false,
        },
      });
    });

    const response = this.toTaxRuleResponse(taxRule);

    // Emit event
    this.eventEmitter.emit('taxRule.created', {
      taxRule: response,
      storeId,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Tax rule created: ${taxRule.id} in store ${storeId}`);

    return response;
  }

  /**
   * Update an existing tax rule.
   *
   * @param storeId - Store ID for tenant isolation
   * @param input - Update data
   * @returns Updated tax rule
   */
  async update(storeId: string, input: UpdateTaxRuleOptions): Promise<TaxRuleResponseDto> {
    // Find existing tax rule (with tenant check)
    const existing = await this.prisma.taxRule.findFirst({
      where: { id: input.id, storeId },
    });

    if (!existing) {
      throw new NotFoundException('Tax rule not found');
    }

    // Validate name uniqueness if changing
    if (input.name && input.name !== existing.name) {
      await this.validateNameUnique(storeId, input.name, input.id);
    }

    // Validate country code if changing
    if (input.countryIso2) {
      await this.validateCountryCode(input.countryIso2);
    }

    // Update in transaction to handle default flag atomically
    const taxRule = await this.prisma.$transaction(async (tx) => {
      // If setting as default, clear other defaults
      if (input.isDefault === true && !existing.isDefault) {
        await tx.taxRule.updateMany({
          where: { storeId, isDefault: true, NOT: { id: input.id } },
          data: { isDefault: false },
        });
      }

      // Build update data - use UncheckedUpdateInput to access scalar fields directly
      const updateData: Prisma.TaxRuleUncheckedUpdateInput = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.rate !== undefined) updateData.rate = input.rate;
      if (input.countryIso2 !== undefined)
        updateData.countryIso2 = input.countryIso2.toUpperCase();
      if (input.isDefault !== undefined) updateData.isDefault = input.isDefault;
      if (input.appliesToShipping !== undefined)
        updateData.appliesToShipping = input.appliesToShipping;

      return tx.taxRule.update({
        where: { id: input.id },
        data: updateData,
      });
    });

    const response = this.toTaxRuleResponse(taxRule);

    // Emit event
    this.eventEmitter.emit('taxRule.updated', {
      taxRule: response,
      storeId,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Tax rule updated: ${input.id} in store ${storeId}`);

    return response;
  }

  /**
   * Delete a tax rule.
   * Will fail if tax rule is assigned to any variants.
   *
   * @param storeId - Store ID for tenant isolation
   * @param taxRuleId - Tax rule ID to delete
   */
  async delete(storeId: string, taxRuleId: string): Promise<void> {
    // Find existing tax rule
    const existing = await this.prisma.taxRule.findFirst({
      where: { id: taxRuleId, storeId },
      include: {
        _count: { select: { variants: true } },
      },
    });

    if (!existing) {
      throw new NotFoundException('Tax rule not found');
    }

    // Check if assigned to any variants
    if (existing._count.variants > 0) {
      throw new ConflictException(
        `Cannot delete tax rule: it is assigned to ${existing._count.variants} variant(s)`,
      );
    }

    // Delete tax rule
    await this.prisma.taxRule.delete({ where: { id: taxRuleId } });

    // Emit event
    this.eventEmitter.emit('taxRule.deleted', {
      taxRuleId,
      storeId,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Tax rule deleted: ${taxRuleId} from store ${storeId}`);
  }

  /**
   * Get a tax rule by ID.
   *
   * @param storeId - Store ID for tenant isolation
   * @param taxRuleId - Tax rule ID
   * @returns Tax rule or throws NotFoundException
   */
  async findById(storeId: string, taxRuleId: string): Promise<TaxRuleResponseDto> {
    const taxRule = await this.prisma.taxRule.findFirst({
      where: { id: taxRuleId, storeId },
    });

    if (!taxRule) {
      throw new NotFoundException('Tax rule not found');
    }

    return this.toTaxRuleResponse(taxRule);
  }

  /**
   * List tax rules for a store with optional filtering.
   *
   * @param storeId - Store ID for tenant isolation
   * @param input - List query parameters
   * @returns Paginated tax rules list
   */
  async list(storeId: string, input: ListTaxRulesOptions = {}): Promise<TaxRulesListResult> {
    const page = input.page ?? 1;
    const limit = input.limit ?? 50;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.TaxRuleWhereInput = {
      storeId,
      ...(input.countryIso2 && { countryIso2: input.countryIso2.toUpperCase() }),
      ...(input.isDefault !== undefined && { isDefault: input.isDefault }),
    };

    // Execute queries in parallel
    const [taxRules, total] = await Promise.all([
      this.prisma.taxRule.findMany({
        where,
        orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.taxRule.count({ where }),
    ]);

    return {
      items: taxRules.map((tr) => this.toTaxRuleResponse(tr)),
      total,
      page,
      limit,
      hasMore: skip + taxRules.length < total,
    };
  }

  // ==========================================================================
  // Default Tax Rule Methods
  // ==========================================================================

  /**
   * Set a tax rule as the default for a store.
   *
   * @param storeId - Store ID for tenant isolation
   * @param taxRuleId - Tax rule ID to set as default
   * @returns Updated tax rule
   */
  async setDefaultTaxRule(storeId: string, taxRuleId: string): Promise<TaxRuleResponseDto> {
    // Find the tax rule
    const taxRule = await this.prisma.taxRule.findFirst({
      where: { id: taxRuleId, storeId },
    });

    if (!taxRule) {
      throw new NotFoundException('Tax rule not found');
    }

    // If already default, no-op
    if (taxRule.isDefault) {
      return this.toTaxRuleResponse(taxRule);
    }

    // Update in transaction
    const updated = await this.prisma.$transaction(async (tx) => {
      // Clear existing default
      await tx.taxRule.updateMany({
        where: { storeId, isDefault: true },
        data: { isDefault: false },
      });

      // Set new default
      return tx.taxRule.update({
        where: { id: taxRuleId },
        data: { isDefault: true },
      });
    });

    const response = this.toTaxRuleResponse(updated);

    // Emit event
    this.eventEmitter.emit('taxRule.defaultChanged', {
      taxRule: response,
      storeId,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Default tax rule set: ${taxRuleId} in store ${storeId}`);

    return response;
  }

  /**
   * Get the default tax rule for a store.
   * Optionally filter by country code.
   *
   * @param storeId - Store ID for tenant isolation
   * @param countryCode - Optional country code filter
   * @returns Default tax rule or null if none exists
   */
  async getDefaultTaxRule(
    storeId: string,
    countryCode?: string,
  ): Promise<TaxRuleResponseDto | null> {
    const taxRule = await this.prisma.taxRule.findFirst({
      where: {
        storeId,
        isDefault: true,
        ...(countryCode && { countryIso2: countryCode.toUpperCase() }),
      },
    });

    return taxRule ? this.toTaxRuleResponse(taxRule) : null;
  }

  /**
   * Get all tax rules for dropdown/select usage.
   *
   * @param storeId - Store ID for tenant isolation
   * @returns List of tax rules with basic info
   */
  async listForSelect(
    storeId: string,
  ): Promise<{ id: string; name: string; rate: number; isDefault: boolean }[]> {
    const taxRules = await this.prisma.taxRule.findMany({
      where: { storeId },
      select: {
        id: true,
        name: true,
        rate: true,
        isDefault: true,
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });

    return taxRules.map((tr) => ({
      id: tr.id,
      name: tr.name,
      rate: Number(tr.rate),
      isDefault: tr.isDefault,
    }));
  }

  // ==========================================================================
  // Protected Helpers
  // ==========================================================================

  /**
   * Convert Prisma TaxRule to API response.
   * Protected for @trafi/core customization.
   */
  protected toTaxRuleResponse(taxRule: PrismaTaxRule): TaxRuleResponseDto {
    return {
      id: taxRule.id,
      storeId: taxRule.storeId,
      name: taxRule.name,
      rate: Number(taxRule.rate), // Convert Decimal to number
      countryIso2: taxRule.countryIso2,
      isDefault: taxRule.isDefault,
      appliesToShipping: taxRule.appliesToShipping,
      createdAt: taxRule.createdAt,
      updatedAt: taxRule.updatedAt,
    };
  }
}
