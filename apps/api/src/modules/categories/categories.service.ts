import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@database/prisma.service';
import type { Category } from '@generated/prisma/client';
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
  ReorderCategoryInput,
  AssignProductsToCategoryInput,
  RemoveProductsFromCategoryInput,
  CategoryTreeNode,
} from '@trafi/types';
import { CATEGORY_CONSTANTS } from '@trafi/validators';

/**
 * Category response type for API consumers
 */
export interface CategoryResponseDto {
  id: string;
  storeId: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  imageUrl: string | null;
  depth: number;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  productCount?: number;
}

/**
 * Category list item type for flat lists/dropdowns
 */
export interface CategoryListItemDto {
  id: string;
  name: string;
  slug: string;
  depth: number;
  parentId: string | null;
}

/**
 * Categories management service
 *
 * IMPORTANT: Use `protected` methods (not `private`) to support
 * merchant overrides in @trafi/core distribution model (RETRO-2).
 *
 * Key behaviors:
 * - Categories are tenant-scoped via storeId (defense-in-depth)
 * - IDs automatically generated with cat_ prefix via PrismaService extension
 * - Slugs are auto-generated if not provided
 * - Supports hierarchical structure up to 3 levels
 * - Emits events for category changes
 *
 * @see Story 3.4 - Categories Management
 * @see Story 3.R2 - Prefixed IDs Foundation
 */
@Injectable()
export class CategoriesService {
  protected readonly logger = new Logger(CategoriesService.name);

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly eventEmitter: EventEmitter2,
  ) {}

  // ==========================================================================
  // Protected Utility Methods
  // ==========================================================================

  /**
   * Generate a URL-safe slug from category name.
   * Protected for @trafi/core consumers to customize slug generation.
   *
   * @param name - Category name to slugify
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
   * @param excludeId - Category ID to exclude (for updates)
   * @throws ConflictException if slug already exists
   */
  protected async validateSlugUnique(
    storeId: string,
    slug: string,
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.prisma.category.findFirst({
      where: {
        storeId,
        slug,
        ...(excludeId && { NOT: { id: excludeId } }),
      },
    });

    if (existing) {
      throw new ConflictException(`Category with slug "${slug}" already exists`);
    }
  }

  /**
   * Validate and calculate depth for a category based on parent.
   * Enforces maximum 3 levels (depth 0, 1, 2).
   * Protected for merchant override.
   *
   * @param parentId - Parent category ID (null for root)
   * @param storeId - Store ID for tenant scoping
   * @returns Calculated depth for the new category
   * @throws NotFoundException if parent doesn't exist
   * @throws BadRequestException if max depth would be exceeded
   */
  protected async validateDepth(
    parentId: string | null,
    storeId: string,
  ): Promise<number> {
    if (!parentId) return 0; // Root level

    const parent = await this.prisma.category.findFirst({
      where: { id: parentId, storeId },
    });

    if (!parent) {
      throw new NotFoundException('Parent category not found');
    }

    if (parent.depth >= CATEGORY_CONSTANTS.MAX_DEPTH) {
      throw new BadRequestException('Maximum category depth is 3 levels');
    }

    return parent.depth + 1;
  }

  /**
   * Build a nested tree structure from a flat list of categories.
   * Protected for merchant override.
   *
   * @param categories - Flat array of categories
   * @returns Nested tree structure
   */
  protected buildTree(categories: (Category & { _count?: { products: number } })[]): CategoryTreeNode[] {
    const map = new Map<string, CategoryTreeNode>();
    const roots: CategoryTreeNode[] = [];

    // First pass: create nodes
    categories.forEach((cat) => {
      map.set(cat.id, {
        id: cat.id,
        storeId: cat.storeId,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        parentId: cat.parentId,
        imageUrl: cat.imageUrl,
        depth: cat.depth,
        position: cat.position,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt,
        productCount: cat._count?.products ?? 0,
        children: [],
      });
    });

    // Second pass: build hierarchy
    categories.forEach((cat) => {
      const node = map.get(cat.id)!;
      if (cat.parentId) {
        const parent = map.get(cat.parentId);
        if (parent) parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    // Sort by position at each level
    const sortByPosition = (nodes: CategoryTreeNode[]) => {
      nodes.sort((a, b) => a.position - b.position);
      nodes.forEach((n) => sortByPosition(n.children));
    };
    sortByPosition(roots);

    return roots;
  }

  // ==========================================================================
  // CRUD Methods
  // ==========================================================================

  /**
   * Create a new category.
   *
   * ID is automatically generated with cat_ prefix by PrismaService extension.
   * @see Story 3.R2 - Prefixed IDs Foundation
   *
   * @param storeId - Store ID for tenant isolation
   * @param input - Category creation data
   * @returns Created category
   */
  async create(storeId: string, input: CreateCategoryInput): Promise<CategoryResponseDto> {
    // Generate or validate slug
    const slug = input.slug || this.generateSlug(input.name);
    await this.validateSlugUnique(storeId, slug);

    // Validate depth
    const depth = await this.validateDepth(input.parentId ?? null, storeId);

    // Create category - ID is auto-generated by prefixed IDs extension
    const category = await this.prisma.category.create({
      data: {
        storeId,
        name: input.name,
        slug,
        description: input.description ?? null,
        parentId: input.parentId ?? null,
        imageUrl: input.imageUrl ?? null,
        position: input.position ?? 0,
        depth,
      },
    });

    const response = this.toCategoryResponse(category);

    // Emit event for analytics and side effects
    this.eventEmitter.emit('category.created', {
      category: response,
      storeId,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Category created: ${category.id} in store ${storeId}`);

    return response;
  }

  /**
   * Update an existing category.
   *
   * @param storeId - Store ID for tenant isolation
   * @param categoryId - Category ID to update
   * @param input - Update data
   * @returns Updated category
   */
  async update(
    storeId: string,
    input: UpdateCategoryInput,
  ): Promise<CategoryResponseDto> {
    // Find existing category (with tenant check)
    const existing = await this.prisma.category.findFirst({
      where: { id: input.id, storeId },
    });

    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    // Validate slug uniqueness if being changed
    if (input.slug && input.slug !== existing.slug) {
      await this.validateSlugUnique(storeId, input.slug, input.id);
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.slug !== undefined) updateData.slug = input.slug;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.imageUrl !== undefined) updateData.imageUrl = input.imageUrl;

    // Update category
    const category = await this.prisma.category.update({
      where: { id: input.id },
      data: updateData,
    });

    const response = this.toCategoryResponse(category);

    // Emit event
    this.eventEmitter.emit('category.updated', {
      category: response,
      storeId,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Category updated: ${input.id} in store ${storeId}`);

    return response;
  }

  /**
   * Reorder a category (move to new parent/position).
   *
   * @param storeId - Store ID for tenant isolation
   * @param input - Reorder data
   * @returns Updated category
   */
  async reorder(storeId: string, input: ReorderCategoryInput): Promise<CategoryResponseDto> {
    // Find existing category
    const existing = await this.prisma.category.findFirst({
      where: { id: input.categoryId, storeId },
    });

    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    // Validate new depth if parent is changing
    let newDepth = existing.depth;
    if (input.parentId !== existing.parentId) {
      newDepth = await this.validateDepth(input.parentId, storeId);

      // Also need to validate that moving this category won't exceed depth for its children
      const childrenMaxDepth = await this.getMaxChildDepth(storeId, input.categoryId);
      if (newDepth + childrenMaxDepth > CATEGORY_CONSTANTS.MAX_DEPTH) {
        throw new BadRequestException(
          'Cannot move category: would exceed maximum depth of 3 levels for child categories',
        );
      }
    }

    // Perform reorder in transaction
    const category = await this.prisma.$transaction(async (tx) => {
      // Update the category itself
      const updated = await tx.category.update({
        where: { id: input.categoryId },
        data: {
          parentId: input.parentId,
          position: input.position,
          depth: newDepth,
        },
      });

      // If parent changed, update depth of all descendants
      if (input.parentId !== existing.parentId) {
        await this.updateDescendantDepths(tx, storeId, input.categoryId, newDepth);
      }

      return updated;
    });

    const response = this.toCategoryResponse(category);

    // Emit event
    this.eventEmitter.emit('category.reordered', {
      category: response,
      previousParentId: existing.parentId,
      storeId,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Category reordered: ${input.categoryId} in store ${storeId}`);

    return response;
  }

  /**
   * Delete a category.
   * Products assigned to this category will have their assignment removed,
   * but the products themselves will NOT be deleted.
   *
   * @param storeId - Store ID for tenant isolation
   * @param categoryId - Category ID to delete
   */
  async delete(storeId: string, categoryId: string): Promise<void> {
    // Find existing category
    const existing = await this.prisma.category.findFirst({
      where: { id: categoryId, storeId },
      include: { children: true },
    });

    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    // If has children, set their parent to null (make them root categories)
    if (existing.children.length > 0) {
      await this.prisma.category.updateMany({
        where: { parentId: categoryId },
        data: {
          parentId: null,
          depth: 0, // They become root categories
        },
      });
    }

    // Delete category (ProductCategory entries cascade automatically)
    await this.prisma.category.delete({ where: { id: categoryId } });

    // Emit event
    this.eventEmitter.emit('category.deleted', {
      categoryId,
      storeId,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Category deleted: ${categoryId} from store ${storeId}`);
  }

  /**
   * Get a category by ID.
   *
   * @param storeId - Store ID for tenant isolation
   * @param categoryId - Category ID
   * @returns Category or throws NotFoundException
   */
  async findById(storeId: string, categoryId: string): Promise<CategoryResponseDto> {
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, storeId },
      include: {
        _count: { select: { products: true } },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return this.toCategoryResponse(category, category._count?.products);
  }

  /**
   * Get the full category tree for a store.
   *
   * @param storeId - Store ID for tenant isolation
   * @returns Nested tree structure of categories
   */
  async getTree(storeId: string): Promise<CategoryTreeNode[]> {
    const categories = await this.prisma.category.findMany({
      where: { storeId },
      include: {
        _count: { select: { products: true } },
      },
      orderBy: [{ depth: 'asc' }, { position: 'asc' }],
    });

    return this.buildTree(categories);
  }

  /**
   * Get a flat list of categories (for dropdowns/selects).
   *
   * @param storeId - Store ID for tenant isolation
   * @returns Flat list of categories with basic info
   */
  async listFlat(storeId: string): Promise<{ id: string; name: string; slug: string; depth: number; parentId: string | null }[]> {
    const categories = await this.prisma.category.findMany({
      where: { storeId },
      select: {
        id: true,
        name: true,
        slug: true,
        depth: true,
        parentId: true,
      },
      orderBy: [{ depth: 'asc' }, { position: 'asc' }, { name: 'asc' }],
    });

    return categories;
  }

  // ==========================================================================
  // Product Assignment Methods
  // ==========================================================================

  /**
   * Assign products to a category.
   *
   * @param storeId - Store ID for tenant isolation
   * @param input - Assignment data
   */
  async assignProducts(storeId: string, input: AssignProductsToCategoryInput): Promise<void> {
    // Verify category belongs to store
    const category = await this.prisma.category.findFirst({
      where: { id: input.categoryId, storeId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Verify all products belong to store
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: input.productIds },
        storeId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (products.length !== input.productIds.length) {
      throw new BadRequestException('One or more products not found');
    }

    // Get max position for ordering
    const maxPosition = await this.prisma.productCategory.aggregate({
      where: { categoryId: input.categoryId },
      _max: { position: true },
    });
    let nextPosition = (maxPosition._max?.position ?? -1) + 1;

    // Create assignments (skip existing)
    await this.prisma.$transaction(
      input.productIds.map((productId) =>
        this.prisma.productCategory.upsert({
          where: {
            productId_categoryId: { productId, categoryId: input.categoryId },
          },
          update: {}, // No update needed, keep existing position
          create: {
            productId,
            categoryId: input.categoryId,
            position: nextPosition++,
          },
        }),
      ),
    );

    this.logger.log(
      `Assigned ${input.productIds.length} products to category ${input.categoryId} in store ${storeId}`,
    );
  }

  /**
   * Remove products from a category.
   *
   * @param storeId - Store ID for tenant isolation
   * @param input - Removal data
   */
  async removeProducts(storeId: string, input: RemoveProductsFromCategoryInput): Promise<void> {
    // Verify category belongs to store
    const category = await this.prisma.category.findFirst({
      where: { id: input.categoryId, storeId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Delete assignments
    await this.prisma.productCategory.deleteMany({
      where: {
        categoryId: input.categoryId,
        productId: { in: input.productIds },
      },
    });

    this.logger.log(
      `Removed ${input.productIds.length} products from category ${input.categoryId} in store ${storeId}`,
    );
  }

  /**
   * Get product count for a category.
   *
   * @param storeId - Store ID for tenant isolation
   * @param categoryId - Category ID
   * @returns Number of products in the category
   */
  async getProductCount(storeId: string, categoryId: string): Promise<number> {
    // Verify category belongs to store
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, storeId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return this.prisma.productCategory.count({
      where: { categoryId },
    });
  }

  /**
   * Get categories assigned to a specific product.
   *
   * @param storeId - Store ID for tenant isolation
   * @param productId - Product ID
   * @returns List of categories assigned to the product
   */
  async getCategoriesForProduct(storeId: string, productId: string): Promise<CategoryListItemDto[]> {
    const assignments = await this.prisma.productCategory.findMany({
      where: {
        productId,
        category: { storeId },
      },
      include: {
        category: true,
      },
      orderBy: { position: 'asc' },
    });

    return assignments.map((a) => ({
      id: a.category.id,
      name: a.category.name,
      slug: a.category.slug,
      depth: a.category.depth,
      parentId: a.category.parentId,
    }));
  }

  // ==========================================================================
  // Private Helpers
  // ==========================================================================

  /**
   * Get the maximum depth of children for a category.
   */
  private async getMaxChildDepth(storeId: string, categoryId: string): Promise<number> {
    const result = await this.prisma.category.aggregate({
      where: {
        storeId,
        OR: [
          { parentId: categoryId },
          { parent: { parentId: categoryId } },
        ],
      },
      _max: { depth: true },
    });

    if (!result._max.depth) return 0;

    // Return relative depth from this category
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { depth: true },
    });

    return result._max.depth - (category?.depth ?? 0);
  }

  /**
   * Update depths of all descendant categories after a move.
   */
  private async updateDescendantDepths(
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
    storeId: string,
    parentId: string,
    parentDepth: number,
  ): Promise<void> {
    // Get immediate children
    const children = await tx.category.findMany({
      where: { storeId, parentId },
      select: { id: true },
    });

    if (children.length === 0) return;

    // Update their depth
    await tx.category.updateMany({
      where: { id: { in: children.map((c) => c.id) } },
      data: { depth: parentDepth + 1 },
    });

    // Recursively update grandchildren
    for (const child of children) {
      await this.updateDescendantDepths(tx, storeId, child.id, parentDepth + 1);
    }
  }

  /**
   * Convert Prisma Category to API response.
   * Protected for @trafi/core customization.
   */
  protected toCategoryResponse(
    category: Category,
    productCount?: number,
  ): CategoryResponseDto {
    return {
      id: category.id,
      storeId: category.storeId,
      name: category.name,
      slug: category.slug,
      description: category.description,
      parentId: category.parentId,
      imageUrl: category.imageUrl,
      depth: category.depth,
      position: category.position,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      productCount,
    };
  }
}
