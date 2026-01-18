import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProductsService } from '../products.service';
import { PrismaService } from '@database/prisma.service';

/**
 * ProductsService Unit Tests
 *
 * Tests cover:
 * - Product CRUD operations
 * - Tenant isolation (storeId scoping)
 * - Slug generation and uniqueness
 * - Event emission
 * - Pagination and filtering
 *
 * @see Story 3.1 - Product Model and Basic CRUD
 */
describe('ProductsService', () => {
  let service: ProductsService;
  let prismaService: {
    product: {
      findFirst: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      count: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let eventEmitter: { emit: jest.Mock };

  const mockStoreId = 'store_test123';
  const mockProductId = 'prod_test123456789012';

  const mockProduct = {
    id: mockProductId,
    storeId: mockStoreId,
    name: 'Test Product',
    slug: 'test-product',
    description: 'A test product description',
    priceInCents: 1999,
    status: 'DRAFT' as const,
    productType: 'Physical',
    vendor: 'Test Vendor',
    tags: ['tag1', 'tag2'],
    createdAt: new Date('2026-01-17'),
    updatedAt: new Date('2026-01-17'),
  };

  beforeEach(async () => {
    // Create mock implementations
    const mockPrismaService = {
      product: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const mockEventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prismaService = module.get(PrismaService);
    eventEmitter = module.get(EventEmitter2);
  });

  describe('create', () => {
    it('should create a product with generated ID and slug', async () => {
      prismaService.product.findFirst.mockResolvedValue(null); // No existing slug
      prismaService.product.create.mockResolvedValue(mockProduct);

      const input = {
        name: 'Test Product',
        description: 'A test product description',
        priceInCents: 1999,
        status: 'draft' as const,
        productType: 'Physical',
        vendor: 'Test Vendor',
        tags: ['tag1', 'tag2'],
      };

      const result = await service.create(mockStoreId, input);

      expect(result).toBeDefined();
      expect(result.name).toBe('Test Product');
      expect(result.status).toBe('draft');
      expect(prismaService.product.create).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith('product.created', expect.any(Object));
    });

    it('should generate slug from name if not provided', async () => {
      prismaService.product.findFirst.mockResolvedValue(null);
      prismaService.product.create.mockImplementation(async ({ data }: { data: { slug: string } }) => ({
        ...mockProduct,
        slug: data.slug,
      }));

      const input = {
        name: 'My Amazing Product!',
        priceInCents: 2999,
        status: 'draft' as const,
        tags: [] as string[],
      };

      await service.create(mockStoreId, input);

      expect(prismaService.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slug: 'my-amazing-product',
          }),
        }),
      );
    });

    it('should use provided slug when given', async () => {
      prismaService.product.findFirst.mockResolvedValue(null);
      prismaService.product.create.mockImplementation(async ({ data }: { data: { slug: string } }) => ({
        ...mockProduct,
        slug: data.slug,
      }));

      const input = {
        name: 'Test Product',
        slug: 'custom-slug',
        priceInCents: 1999,
        status: 'draft' as const,
        tags: [] as string[],
      };

      await service.create(mockStoreId, input);

      expect(prismaService.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slug: 'custom-slug',
          }),
        }),
      );
    });

    it('should throw ConflictException if slug already exists', async () => {
      prismaService.product.findFirst.mockResolvedValue(mockProduct); // Existing slug

      const input = {
        name: 'Test Product',
        priceInCents: 1999,
        status: 'draft' as const,
        tags: [] as string[],
      };

      await expect(service.create(mockStoreId, input)).rejects.toThrow(ConflictException);
    });

    it('should create product without passing ID (auto-generated by Prisma extension)', async () => {
      prismaService.product.findFirst.mockResolvedValue(null);
      prismaService.product.create.mockResolvedValue(mockProduct);

      const input = {
        name: 'Test Product',
        priceInCents: 1999,
        status: 'draft' as const,
        tags: [] as string[],
      };

      await service.create(mockStoreId, input);

      // ID is auto-generated by Prisma prefixed-ids extension, not passed in data
      expect(prismaService.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({
            id: expect.anything(),
          }),
        }),
      );
    });
  });

  describe('update', () => {
    it('should update an existing product', async () => {
      const updatedProduct = { ...mockProduct, name: 'Updated Name', status: 'ACTIVE' as const };
      prismaService.product.findFirst.mockResolvedValue(mockProduct);
      prismaService.product.update.mockResolvedValue(updatedProduct);

      const result = await service.update(mockStoreId, mockProductId, {
        name: 'Updated Name',
        status: 'active',
      });

      expect(result.name).toBe('Updated Name');
      expect(result.status).toBe('active');
      expect(eventEmitter.emit).toHaveBeenCalledWith('product.updated', expect.any(Object));
    });

    it('should throw NotFoundException if product does not exist', async () => {
      prismaService.product.findFirst.mockResolvedValue(null);

      await expect(
        service.update(mockStoreId, mockProductId, { name: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should validate slug uniqueness on update', async () => {
      prismaService.product.findFirst
        .mockResolvedValueOnce(mockProduct) // First call: find product to update
        .mockResolvedValueOnce({ ...mockProduct, id: 'other_product' }); // Second call: slug check

      await expect(
        service.update(mockStoreId, mockProductId, { slug: 'existing-slug' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('delete (soft delete)', () => {
    it('should soft delete an existing product by setting deletedAt', async () => {
      const softDeletedProduct = { ...mockProduct, deletedAt: new Date() };
      prismaService.product.findFirst.mockResolvedValue(mockProduct);
      prismaService.product.update.mockResolvedValue(softDeletedProduct);

      await service.delete(mockStoreId, mockProductId);

      // Soft delete uses update with deletedAt instead of delete
      expect(prismaService.product.update).toHaveBeenCalledWith({
        where: { id: mockProductId },
        data: { deletedAt: expect.any(Date) },
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith('product.deleted', expect.any(Object));
    });

    it('should throw NotFoundException if product does not exist', async () => {
      prismaService.product.findFirst.mockResolvedValue(null);

      await expect(service.delete(mockStoreId, mockProductId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findById', () => {
    it('should return a product by ID', async () => {
      prismaService.product.findFirst.mockResolvedValue(mockProduct);

      const result = await service.findById(mockStoreId, mockProductId);

      expect(result.id).toBe(mockProductId);
      expect(result.name).toBe('Test Product');
    });

    it('should throw NotFoundException if product does not exist', async () => {
      prismaService.product.findFirst.mockResolvedValue(null);

      await expect(service.findById(mockStoreId, mockProductId)).rejects.toThrow(NotFoundException);
    });

    it('should enforce tenant isolation', async () => {
      prismaService.product.findFirst.mockResolvedValue(null);

      await expect(service.findById('other_store', mockProductId)).rejects.toThrow(NotFoundException);
      // Now includes deletedAt: null for soft delete filtering
      expect(prismaService.product.findFirst).toHaveBeenCalledWith({
        where: { id: mockProductId, storeId: 'other_store', deletedAt: null },
      });
    });
  });

  describe('list', () => {
    it('should return paginated products', async () => {
      const products = [mockProduct, { ...mockProduct, id: 'prod_2', name: 'Product 2' }];
      prismaService.$transaction.mockResolvedValue([products, 2]);

      const result = await service.list(mockStoreId, { page: 1, limit: 20, sortOrder: 'desc' });

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should filter by status', async () => {
      prismaService.$transaction.mockResolvedValue([[mockProduct], 1]);

      await service.list(mockStoreId, { page: 1, limit: 20, status: 'draft', sortOrder: 'desc' });

      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should filter by search term', async () => {
      prismaService.$transaction.mockResolvedValue([[mockProduct], 1]);

      await service.list(mockStoreId, { page: 1, limit: 20, search: 'test', sortOrder: 'desc' });

      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should filter by tags', async () => {
      prismaService.$transaction.mockResolvedValue([[mockProduct], 1]);

      await service.list(mockStoreId, { page: 1, limit: 20, tags: ['tag1'], sortOrder: 'desc' });

      expect(prismaService.$transaction).toHaveBeenCalled();
    });
  });

  describe('Prisma constraint handling', () => {
    it('should handle Prisma unique constraint error gracefully', async () => {
      // Service validates slug before creation, but if race condition occurs
      // Prisma will throw unique constraint error
      prismaService.product.findFirst.mockResolvedValue(null); // Pass service validation
      prismaService.product.create.mockRejectedValue({
        code: 'P2002',
        meta: { target: ['storeId', 'slug'] },
        message: 'Unique constraint failed',
      });

      const input = {
        name: 'Test Product',
        priceInCents: 1999,
        status: 'draft' as const,
        tags: [] as string[],
      };

      // Prisma error should bubble up (not caught by service)
      await expect(service.create(mockStoreId, input)).rejects.toEqual(
        expect.objectContaining({
          code: 'P2002',
        }),
      );
    });
  });

  describe('status conversion', () => {
    it('should convert API status to Prisma status', async () => {
      prismaService.product.findFirst.mockResolvedValue(null);
      prismaService.product.create.mockImplementation(async ({ data }: { data: { status: string } }) => ({
        ...mockProduct,
        status: data.status,
      }));

      await service.create(mockStoreId, {
        name: 'Test',
        priceInCents: 100,
        status: 'active',
        tags: [] as string[],
      });

      expect(prismaService.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'ACTIVE',
          }),
        }),
      );
    });

    it('should convert Prisma status to API status', async () => {
      prismaService.product.findFirst.mockResolvedValue({
        ...mockProduct,
        status: 'ARCHIVED',
      });

      const result = await service.findById(mockStoreId, mockProductId);

      expect(result.status).toBe('archived');
    });
  });

  describe('findByIdIncludingDeleted', () => {
    it('should return a deleted product', async () => {
      const deletedProduct = { ...mockProduct, deletedAt: new Date('2026-01-18') };
      prismaService.product.findFirst.mockResolvedValue(deletedProduct);

      const result = await service.findByIdIncludingDeleted(mockStoreId, mockProductId);

      expect(result.id).toBe(mockProductId);
      expect(result.deletedAt).toEqual(new Date('2026-01-18'));
    });

    it('should return an active product with deletedAt null', async () => {
      const activeProduct = { ...mockProduct, deletedAt: null };
      prismaService.product.findFirst.mockResolvedValue(activeProduct);

      const result = await service.findByIdIncludingDeleted(mockStoreId, mockProductId);

      expect(result.id).toBe(mockProductId);
      expect(result.deletedAt).toBeNull();
    });

    it('should throw NotFoundException if product does not exist', async () => {
      prismaService.product.findFirst.mockResolvedValue(null);

      await expect(service.findByIdIncludingDeleted(mockStoreId, mockProductId)).rejects.toThrow(NotFoundException);
    });

    it('should not filter by deletedAt (unlike findById)', async () => {
      prismaService.product.findFirst.mockResolvedValue(null);

      await service.findByIdIncludingDeleted(mockStoreId, mockProductId).catch(() => {});

      // Should NOT include deletedAt: null in query
      expect(prismaService.product.findFirst).toHaveBeenCalledWith({
        where: { id: mockProductId, storeId: mockStoreId },
      });
    });
  });

  describe('restore', () => {
    it('should restore a soft-deleted product', async () => {
      const deletedProduct = { ...mockProduct, deletedAt: new Date('2026-01-18') };
      const restoredProduct = { ...mockProduct, deletedAt: null };
      prismaService.product.findFirst.mockResolvedValue(deletedProduct);
      prismaService.product.update.mockResolvedValue(restoredProduct);

      const result = await service.restore(mockStoreId, mockProductId);

      expect(result.id).toBe(mockProductId);
      expect(prismaService.product.update).toHaveBeenCalledWith({
        where: { id: mockProductId },
        data: { deletedAt: null },
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith('product.restored', expect.any(Object));
    });

    it('should throw NotFoundException if product does not exist', async () => {
      prismaService.product.findFirst.mockResolvedValue(null);

      await expect(service.restore(mockStoreId, mockProductId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if product is not deleted', async () => {
      const activeProduct = { ...mockProduct, deletedAt: null };
      prismaService.product.findFirst.mockResolvedValue(activeProduct);

      await expect(service.restore(mockStoreId, mockProductId)).rejects.toThrow(ConflictException);
    });
  });
});
