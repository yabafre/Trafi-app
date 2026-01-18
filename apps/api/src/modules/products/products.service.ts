import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'crypto';
import { PrismaService } from '@database/prisma.service';
import type { Product, ProductStatus as PrismaProductStatus } from '@generated/prisma/client';
import type {
  CreateProductInput,
  UpdateProductInput,
  ListProductsInput,
  ProductStatus,
} from '@trafi/types';

/**
 * Product response type for API consumers
 */
export interface ProductResponseDto {
  id: string;
  storeId: string;
  name: string;
  slug: string;
  description: string | null;
  priceInCents: number;
  status: ProductStatus;
  productType: string | null;
  vendor: string | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Paginated products response
 */
export interface PaginatedProductsDto {
  items: ProductResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Products management service
 *
 * IMPORTANT: Use `protected` methods (not `private`) to support
 * merchant overrides in @trafi/core distribution model (RETRO-2).
 *
 * Key behaviors:
 * - Products are tenant-scoped via storeId (defense-in-depth)
 * - IDs use prod_ prefix (e.g., prod_clx1abc123)
 * - Slugs are auto-generated if not provided
 * - Emits events for product changes
 *
 * @see Story 3.1 - Product Model and Basic CRUD
 */
@Injectable()
export class ProductsService {
  protected readonly logger = new Logger(ProductsService.name);

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Generate a unique product ID with prod_ prefix.
   * Protected for @trafi/core consumers to override.
   */
  protected generateProductId(): string {
    return `prod_${randomUUID().replace(/-/g, '').slice(0, 24)}`;
  }

  /**
   * Generate a URL-safe slug from product name.
   * Protected for @trafi/core consumers to customize slug generation.
   *
   * @param name - Product name to slugify
   * @returns URL-safe slug
   */
  protected generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces/underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Validate that a slug is unique within a store.
   * Protected for merchant override.
   *
   * @param storeId - Store ID for tenant scoping
   * @param slug - Slug to validate
   * @param excludeId - Product ID to exclude (for updates)
   * @throws ConflictException if slug already exists
   */
  protected async validateSlugUnique(
    storeId: string,
    slug: string,
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.prisma.product.findFirst({
      where: {
        storeId,
        slug,
        ...(excludeId && { NOT: { id: excludeId } }),
      },
    });

    if (existing) {
      throw new ConflictException(`Product with slug "${slug}" already exists`);
    }
  }

  /**
   * Create a new product.
   *
   * @param storeId - Store ID for tenant isolation
   * @param input - Product creation data
   * @returns Created product
   */
  async create(storeId: string, input: CreateProductInput): Promise<ProductResponseDto> {
    // Generate or validate slug
    const slug = input.slug || this.generateSlug(input.name);
    await this.validateSlugUnique(storeId, slug);

    // Generate product ID with prefix
    const id = this.generateProductId();

    // Create product
    const product = await this.prisma.product.create({
      data: {
        id,
        storeId,
        name: input.name,
        slug,
        description: input.description ?? null,
        priceInCents: input.priceInCents,
        status: this.toPrismaStatus(input.status ?? 'draft'),
        productType: input.productType ?? null,
        vendor: input.vendor ?? null,
        tags: input.tags ?? [],
      },
    });

    const response = this.toProductResponse(product);

    // Emit event for analytics and side effects
    this.eventEmitter.emit('product.created', {
      product: response,
      storeId,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Product created: ${id} in store ${storeId}`);

    return response;
  }

  /**
   * Update an existing product.
   *
   * @param storeId - Store ID for tenant isolation
   * @param productId - Product ID to update
   * @param input - Update data
   * @returns Updated product
   */
  async update(
    storeId: string,
    productId: string,
    input: UpdateProductInput,
  ): Promise<ProductResponseDto> {
    // Find existing product (with tenant check)
    const existing = await this.prisma.product.findFirst({
      where: { id: productId, storeId },
    });

    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    // Validate slug uniqueness if being changed
    if (input.slug && input.slug !== existing.slug) {
      await this.validateSlugUnique(storeId, input.slug, productId);
    }

    // Build update data
    const updateData = this.buildUpdateData(input, existing);

    // Update product
    const product = await this.prisma.product.update({
      where: { id: productId },
      data: updateData,
    });

    const response = this.toProductResponse(product);

    // Emit event
    this.eventEmitter.emit('product.updated', {
      product: response,
      previousStatus: existing.status,
      storeId,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Product updated: ${productId} in store ${storeId}`);

    return response;
  }

  /**
   * Delete a product.
   *
   * @param storeId - Store ID for tenant isolation
   * @param productId - Product ID to delete
   */
  async delete(storeId: string, productId: string): Promise<void> {
    // Find existing product (with tenant check)
    const existing = await this.prisma.product.findFirst({
      where: { id: productId, storeId },
    });

    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    // Delete product
    await this.prisma.product.delete({
      where: { id: productId },
    });

    // Emit event
    this.eventEmitter.emit('product.deleted', {
      productId,
      storeId,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Product deleted: ${productId} from store ${storeId}`);
  }

  /**
   * Get a product by ID.
   *
   * @param storeId - Store ID for tenant isolation
   * @param productId - Product ID
   * @returns Product or throws NotFoundException
   */
  async findById(storeId: string, productId: string): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, storeId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.toProductResponse(product);
  }

  /**
   * List products with pagination and filtering.
   *
   * @param storeId - Store ID for tenant isolation
   * @param input - Pagination and filter options
   * @returns Paginated products list
   */
  async list(storeId: string, input: ListProductsInput): Promise<PaginatedProductsDto> {
    const { page = 1, limit = 20, sortBy, sortOrder = 'desc', status, search, productType, vendor, tags } = input;
    const skip = (page - 1) * limit;

    // Build where clause
    const where = this.buildWhereClause(storeId, { status, search, productType, vendor, tags });

    // Build orderBy
    const orderBy = this.buildOrderBy(sortBy, sortOrder);

    // Execute query with count
    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: items.map((item) => this.toProductResponse(item)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Build Prisma where clause for list query.
   * Protected for merchant override.
   */
  protected buildWhereClause(
    storeId: string,
    filters: {
      status?: ProductStatus;
      search?: string;
      productType?: string;
      vendor?: string;
      tags?: string[];
    },
  ) {
    const where: Record<string, unknown> = { storeId };

    if (filters.status) {
      where.status = this.toPrismaStatus(filters.status);
    }

    if (filters.productType) {
      where.productType = filters.productType;
    }

    if (filters.vendor) {
      where.vendor = filters.vendor;
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { vendor: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  /**
   * Build Prisma orderBy clause.
   * Protected for merchant override.
   */
  protected buildOrderBy(
    sortBy?: string,
    sortOrder: 'asc' | 'desc' = 'desc',
  ): Record<string, 'asc' | 'desc'> {
    const validSortFields = ['name', 'createdAt', 'updatedAt', 'priceInCents', 'status'];
    const field = sortBy && validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    return { [field]: sortOrder };
  }

  /**
   * Build update data from input, only including changed fields.
   * Protected for merchant override.
   */
  protected buildUpdateData(
    input: UpdateProductInput,
    _existing: Product,
  ): Record<string, unknown> {
    const data: Record<string, unknown> = {};

    if (input.name !== undefined) data.name = input.name;
    if (input.slug !== undefined) data.slug = input.slug;
    if (input.description !== undefined) data.description = input.description;
    if (input.priceInCents !== undefined) data.priceInCents = input.priceInCents;
    if (input.status !== undefined) data.status = this.toPrismaStatus(input.status);
    if (input.productType !== undefined) data.productType = input.productType;
    if (input.vendor !== undefined) data.vendor = input.vendor;
    if (input.tags !== undefined) data.tags = input.tags;

    return data;
  }

  /**
   * Convert Prisma Product to API response.
   * Protected for @trafi/core customization.
   */
  protected toProductResponse(product: Product): ProductResponseDto {
    return {
      id: product.id,
      storeId: product.storeId,
      name: product.name,
      slug: product.slug,
      description: product.description,
      priceInCents: product.priceInCents,
      status: this.toApiStatus(product.status),
      productType: product.productType,
      vendor: product.vendor,
      tags: product.tags,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  /**
   * Convert API status to Prisma enum.
   */
  protected toPrismaStatus(status: ProductStatus): PrismaProductStatus {
    const map: Record<ProductStatus, PrismaProductStatus> = {
      draft: 'DRAFT',
      active: 'ACTIVE',
      archived: 'ARCHIVED',
    };
    return map[status];
  }

  /**
   * Convert Prisma enum to API status.
   */
  protected toApiStatus(status: PrismaProductStatus): ProductStatus {
    const map: Record<PrismaProductStatus, ProductStatus> = {
      DRAFT: 'draft',
      ACTIVE: 'active',
      ARCHIVED: 'archived',
    };
    return map[status];
  }
}
