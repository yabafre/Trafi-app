import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@database/prisma.service';
import type {
  ProductVariant,
  WeightUnit as PrismaWeightUnit,
} from '@generated/prisma/client';
import type {
  VariantOption,
  CreateVariantInput,
  UpdateVariantInput,
  BulkCreateVariantsInput,
  WeightUnit,
  VariantResponse,
} from '@trafi/types';

/**
 * Variant response type for API consumers.
 * Re-exported from @trafi/types for backward compatibility.
 * @see Story 3.2 - Product Variants Management
 */
export type VariantResponseDto = VariantResponse;

/**
 * Product Variants management service
 *
 * IMPORTANT: Use `protected` methods (not `private`) to support
 * merchant overrides in @trafi/core distribution model (RETRO-2).
 *
 * Key behaviors:
 * - Variants are tenant-scoped via Product relation (no direct storeId)
 * - IDs automatically generated with var_ prefix via PrismaService extension
 * - SKUs are auto-generated if not provided
 * - Options must be unique within a product
 * - At least one variant must exist per product
 *
 * @see Story 3.2 - Product Variants Management
 */
@Injectable()
export class VariantsService {
  protected readonly logger = new Logger(VariantsService.name);

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Generate a SKU from product name and options.
   * Protected for @trafi/core consumers to customize SKU generation.
   *
   * Format: {PREFIX}-{OPTION_VALUES}-{RANDOM}
   * Example: TEE-SM-BL-A1B2
   */
  protected generateSku(
    productName: string,
    options: VariantOption[],
  ): string {
    const prefix = productName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '') || 'SKU';
    const optionPart = options
      .map((o) => o.value.substring(0, 2).toUpperCase())
      .join('-');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${optionPart}-${random}`;
  }

  /**
   * Validate that options are unique within a product.
   * Options are compared by sorting and JSON serialization.
   * Protected for merchant override.
   *
   * @throws ConflictException if duplicate options found
   */
  protected validateOptionsUnique(
    existingVariants: { options: unknown }[],
    newOptions: VariantOption[],
    excludeVariantId?: string,
  ): void {
    const sortOptions = (opts: VariantOption[]) =>
      [...opts].sort((a, b) => a.name.localeCompare(b.name));

    const newKey = JSON.stringify(sortOptions(newOptions));

    for (const variant of existingVariants) {
      // Skip the variant being updated
      if (excludeVariantId && (variant as { id?: string }).id === excludeVariantId) {
        continue;
      }

      const existingOpts = variant.options as VariantOption[];
      const existingKey = JSON.stringify(sortOptions(existingOpts));

      if (existingKey === newKey) {
        throw new ConflictException(
          'A variant with these options already exists',
        );
      }
    }
  }

  /**
   * Generate all combinations of option types.
   * Used for bulk variant creation.
   * Protected for merchant override.
   *
   * Example: [{name: "Size", values: ["S", "M"]}, {name: "Color", values: ["Red", "Blue"]}]
   * Returns: [[{name: "Size", value: "S"}, {name: "Color", value: "Red"}], ...]
   */
  protected generateCombinations(
    optionTypes: { name: string; values: string[] }[],
  ): VariantOption[][] {
    if (optionTypes.length === 0) return [];

    let combinations: VariantOption[][] = [[]];

    for (const optionType of optionTypes) {
      const newCombinations: VariantOption[][] = [];
      for (const combo of combinations) {
        for (const value of optionType.values) {
          newCombinations.push([...combo, { name: optionType.name, value }]);
        }
      }
      combinations = newCombinations;
    }

    return combinations;
  }

  /**
   * Create a single variant for a product.
   *
   * ID is automatically generated with var_ prefix by PrismaService extension.
   * SKU is auto-generated if not provided.
   *
   * @param storeId - Store ID for tenant isolation (verified via product)
   * @param input - Variant creation data
   * @returns Created variant
   */
  async create(
    storeId: string,
    input: CreateVariantInput,
  ): Promise<VariantResponseDto> {
    // Verify product belongs to store and is not soft-deleted
    const product = await this.prisma.product.findFirst({
      where: {
        id: input.productId,
        storeId,
        deletedAt: null,
      },
      include: { variants: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Validate options are unique within this product
    this.validateOptionsUnique(product.variants, input.options);

    // Create variant - ID is auto-generated by prefixed IDs extension
    const variant = await this.prisma.productVariant.create({
      data: {
        productId: input.productId,
        sku: input.sku || this.generateSku(product.name, input.options),
        options: input.options,
        priceInCents: input.priceInCents,
        compareAtPriceInCents: input.compareAtPriceInCents,
        costPriceInCents: input.costPriceInCents,
        quantity: input.quantity ?? 0,
        trackInventory: input.trackInventory ?? true,
        weight: input.weight,
        weightUnit: this.toPrismaWeightUnit(input.weightUnit ?? 'g'),
      },
    });

    const response = this.toVariantResponse(variant);

    // Emit event for analytics and side effects
    this.eventEmitter.emit('variant.created', {
      variant: response,
      product: { id: product.id, name: product.name },
      storeId,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(
      `Variant created: ${variant.id} for product ${product.id} in store ${storeId}`,
    );

    return response;
  }

  /**
   * Bulk create variants from option type combinations.
   *
   * Generates all possible combinations and creates variants in a transaction.
   * Each variant gets an auto-generated SKU.
   *
   * @param storeId - Store ID for tenant isolation
   * @param input - Bulk creation data with option types
   * @returns Array of created variants
   */
  async bulkCreate(
    storeId: string,
    input: BulkCreateVariantsInput,
  ): Promise<VariantResponseDto[]> {
    // Verify product belongs to store and is not soft-deleted
    const product = await this.prisma.product.findFirst({
      where: {
        id: input.productId,
        storeId,
        deletedAt: null,
      },
      include: { variants: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Generate all option combinations
    const combinations = this.generateCombinations(input.optionTypes);

    if (combinations.length === 0) {
      throw new BadRequestException('No option combinations generated');
    }

    // Check for existing duplicates before creating
    for (const combo of combinations) {
      this.validateOptionsUnique(product.variants, combo);
    }

    // Create all variants in a transaction
    const variants = await this.prisma.$transaction(
      combinations.map((options) =>
        this.prisma.productVariant.create({
          data: {
            productId: input.productId,
            sku: this.generateSku(product.name, options),
            options,
            priceInCents: input.defaultPriceInCents,
            quantity: 0,
            trackInventory: true,
            weightUnit: 'G',
          },
        }),
      ),
    );

    const responses = variants.map((v) => this.toVariantResponse(v));

    // Emit event
    this.eventEmitter.emit('variants.bulk_created', {
      variants: responses,
      product: { id: product.id, name: product.name },
      storeId,
      count: variants.length,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(
      `Bulk created ${variants.length} variants for product ${product.id} in store ${storeId}`,
    );

    return responses;
  }

  /**
   * Update an existing variant.
   *
   * @param storeId - Store ID for tenant isolation
   * @param input - Update data with variant ID
   * @returns Updated variant
   */
  async update(
    storeId: string,
    input: UpdateVariantInput,
  ): Promise<VariantResponseDto> {
    // Find variant and verify tenant via product
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: input.id },
      include: {
        product: {
          include: { variants: true },
        },
      },
    });

    if (!variant || variant.product.storeId !== storeId) {
      throw new NotFoundException('Variant not found');
    }

    // If options are being updated, validate uniqueness
    if (input.options) {
      this.validateOptionsUnique(
        variant.product.variants,
        input.options,
        input.id,
      );
    }

    // Build update data (only include provided fields)
    const updateData = this.buildUpdateData(input);

    // Update variant
    const updated = await this.prisma.productVariant.update({
      where: { id: input.id },
      data: updateData,
    });

    const response = this.toVariantResponse(updated);

    // Emit event
    this.eventEmitter.emit('variant.updated', {
      variant: response,
      previousValues: {
        priceInCents: variant.priceInCents,
        quantity: variant.quantity,
      },
      storeId,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Variant updated: ${input.id} in store ${storeId}`);

    return response;
  }

  /**
   * Delete a variant.
   *
   * Cannot delete the last variant of a product (AC5).
   *
   * @param storeId - Store ID for tenant isolation
   * @param variantId - Variant ID to delete
   */
  async delete(storeId: string, variantId: string): Promise<void> {
    // Find variant and verify tenant via product
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });

    if (!variant || variant.product.storeId !== storeId) {
      throw new NotFoundException('Variant not found');
    }

    // Check at-least-one constraint
    const count = await this.prisma.productVariant.count({
      where: { productId: variant.productId },
    });

    if (count <= 1) {
      throw new BadRequestException(
        'Cannot delete the last variant of a product',
      );
    }

    // Delete variant
    await this.prisma.productVariant.delete({ where: { id: variantId } });

    // Emit event
    this.eventEmitter.emit('variant.deleted', {
      variantId,
      productId: variant.productId,
      storeId,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Variant deleted: ${variantId} from store ${storeId}`);
  }

  /**
   * List all variants for a product.
   *
   * @param storeId - Store ID for tenant isolation
   * @param productId - Product ID to list variants for
   * @returns Array of variants
   */
  async listByProduct(
    storeId: string,
    productId: string,
  ): Promise<VariantResponseDto[]> {
    // Verify product belongs to store (including soft-deleted check)
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        storeId,
        deletedAt: null,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const variants = await this.prisma.productVariant.findMany({
      where: { productId },
      orderBy: { createdAt: 'asc' },
    });

    return variants.map((v) => this.toVariantResponse(v));
  }

  /**
   * Get a single variant by ID.
   *
   * @param storeId - Store ID for tenant isolation
   * @param variantId - Variant ID
   * @returns Variant or throws NotFoundException
   */
  async findById(storeId: string, variantId: string): Promise<VariantResponseDto> {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });

    if (!variant || variant.product.storeId !== storeId) {
      throw new NotFoundException('Variant not found');
    }

    return this.toVariantResponse(variant);
  }

  /**
   * Build update data from input, only including provided fields.
   * Protected for merchant override.
   */
  protected buildUpdateData(
    input: UpdateVariantInput,
  ): Record<string, unknown> {
    const data: Record<string, unknown> = {};

    if (input.sku !== undefined) data.sku = input.sku;
    if (input.options !== undefined) data.options = input.options;
    if (input.priceInCents !== undefined) data.priceInCents = input.priceInCents;
    if (input.compareAtPriceInCents !== undefined)
      data.compareAtPriceInCents = input.compareAtPriceInCents;
    if (input.costPriceInCents !== undefined)
      data.costPriceInCents = input.costPriceInCents;
    if (input.quantity !== undefined) data.quantity = input.quantity;
    if (input.trackInventory !== undefined)
      data.trackInventory = input.trackInventory;
    if (input.weight !== undefined) data.weight = input.weight;
    if (input.weightUnit !== undefined)
      data.weightUnit = this.toPrismaWeightUnit(input.weightUnit);

    return data;
  }

  /**
   * Convert Prisma ProductVariant to API response.
   * Protected for @trafi/core customization.
   */
  protected toVariantResponse(variant: ProductVariant): VariantResponseDto {
    return {
      id: variant.id,
      productId: variant.productId,
      sku: variant.sku,
      options: variant.options as VariantOption[],
      priceInCents: variant.priceInCents,
      compareAtPriceInCents: variant.compareAtPriceInCents,
      costPriceInCents: variant.costPriceInCents,
      quantity: variant.quantity,
      trackInventory: variant.trackInventory,
      weight: variant.weight,
      weightUnit: this.toApiWeightUnit(variant.weightUnit),
      createdAt: variant.createdAt,
      updatedAt: variant.updatedAt,
    };
  }

  /**
   * Convert API weight unit to Prisma enum.
   */
  protected toPrismaWeightUnit(unit: WeightUnit): PrismaWeightUnit {
    const map: Record<WeightUnit, PrismaWeightUnit> = {
      g: 'G',
      kg: 'KG',
      oz: 'OZ',
      lb: 'LB',
    };
    return map[unit];
  }

  /**
   * Convert Prisma enum to API weight unit.
   */
  protected toApiWeightUnit(unit: PrismaWeightUnit): WeightUnit {
    const map: Record<PrismaWeightUnit, WeightUnit> = {
      G: 'g',
      KG: 'kg',
      OZ: 'oz',
      LB: 'lb',
    };
    return map[unit];
  }
}
