import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CategoriesService } from '../categories.service';
import { PrismaService } from '@database/prisma.service';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let eventEmitter: { emit: jest.Mock };

  // Define mock functions
  const mockCategoryCreate = jest.fn();
  const mockCategoryFindFirst = jest.fn();
  const mockCategoryFindMany = jest.fn();
  const mockCategoryFindUnique = jest.fn();
  const mockCategoryUpdate = jest.fn();
  const mockCategoryUpdateMany = jest.fn();
  const mockCategoryDelete = jest.fn();
  const mockCategoryAggregate = jest.fn();
  const mockProductFindMany = jest.fn();
  const mockProductCategoryUpsert = jest.fn();
  const mockProductCategoryDeleteMany = jest.fn();
  const mockProductCategoryCount = jest.fn();
  const mockProductCategoryAggregate = jest.fn();
  const mockTransaction = jest.fn();

  const mockStoreId = 'store_test123';

  const mockCategory = {
    id: 'cat_test123',
    storeId: mockStoreId,
    name: 'Electronics',
    slug: 'electronics',
    description: 'Electronic devices and gadgets',
    parentId: null,
    imageUrl: null,
    depth: 0,
    position: 0,
    createdAt: new Date('2026-01-18T10:00:00Z'),
    updatedAt: new Date('2026-01-18T10:00:00Z'),
  };

  const mockChildCategory = {
    ...mockCategory,
    id: 'cat_child123',
    name: 'Smartphones',
    slug: 'smartphones',
    parentId: mockCategory.id,
    depth: 1,
    position: 0,
  };

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    const mockPrismaObj = {
      category: {
        create: mockCategoryCreate,
        findFirst: mockCategoryFindFirst,
        findMany: mockCategoryFindMany,
        findUnique: mockCategoryFindUnique,
        update: mockCategoryUpdate,
        updateMany: mockCategoryUpdateMany,
        delete: mockCategoryDelete,
        aggregate: mockCategoryAggregate,
      },
      product: {
        findMany: mockProductFindMany,
      },
      productCategory: {
        upsert: mockProductCategoryUpsert,
        deleteMany: mockProductCategoryDeleteMany,
        count: mockProductCategoryCount,
        aggregate: mockProductCategoryAggregate,
      },
    };

    // Set up mock $transaction to handle both array and callback forms
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockTransaction.mockImplementation((arg: any) => {
      // If array of promises, resolve them all
      if (Array.isArray(arg)) {
        return Promise.all(arg);
      }
      // If callback function, call it with mock prisma
      return arg(mockPrismaObj);
    });

    const mockPrisma = {
      ...mockPrismaObj,
      $transaction: mockTransaction,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: EventEmitter2,
          useValue: { emit: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    eventEmitter = module.get(EventEmitter2);
  });

  describe('create', () => {
    it('should create a category with auto-generated slug', async () => {
      mockCategoryFindFirst.mockResolvedValue(null); // No existing slug
      mockCategoryCreate.mockResolvedValue(mockCategory);

      const result = await service.create(mockStoreId, {
        name: 'Electronics',
        description: 'Electronic devices and gadgets',
      });

      expect(result.id).toBe(mockCategory.id);
      expect(result.name).toBe('Electronics');
      expect(result.slug).toBe('electronics');
      expect(mockCategoryCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          storeId: mockStoreId,
          name: 'Electronics',
          slug: 'electronics',
          depth: 0,
        }),
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith('category.created', expect.any(Object));
    });

    it('should create a category with custom slug', async () => {
      mockCategoryFindFirst.mockResolvedValue(null);
      mockCategoryCreate.mockResolvedValue({
        ...mockCategory,
        slug: 'custom-slug',
      });

      const result = await service.create(mockStoreId, {
        name: 'Electronics',
        slug: 'custom-slug',
      });

      expect(result.slug).toBe('custom-slug');
    });

    it('should throw ConflictException for duplicate slug', async () => {
      mockCategoryFindFirst.mockResolvedValue(mockCategory);

      await expect(
        service.create(mockStoreId, { name: 'Electronics' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create a child category with correct depth', async () => {
      mockCategoryFindFirst
        .mockResolvedValueOnce(null) // No existing slug
        .mockResolvedValueOnce(mockCategory); // Parent exists
      mockCategoryCreate.mockResolvedValue(mockChildCategory);

      const result = await service.create(mockStoreId, {
        name: 'Smartphones',
        parentId: mockCategory.id,
      });

      expect(result.depth).toBe(1);
      expect(result.parentId).toBe(mockCategory.id);
    });

    it('should throw BadRequestException when exceeding max depth', async () => {
      const deepCategory = { ...mockCategory, depth: 2 }; // Already at max depth
      mockCategoryFindFirst
        .mockResolvedValueOnce(null) // No existing slug
        .mockResolvedValueOnce(deepCategory); // Parent at depth 2

      await expect(
        service.create(mockStoreId, {
          name: 'Too Deep',
          parentId: deepCategory.id,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should update category metadata', async () => {
      mockCategoryFindFirst.mockResolvedValue(mockCategory);
      mockCategoryUpdate.mockResolvedValue({
        ...mockCategory,
        name: 'Updated Electronics',
        description: 'Updated description',
      });

      const result = await service.update(mockStoreId, {
        id: mockCategory.id,
        name: 'Updated Electronics',
        description: 'Updated description',
      });

      expect(result.name).toBe('Updated Electronics');
      expect(eventEmitter.emit).toHaveBeenCalledWith('category.updated', expect.any(Object));
    });

    it('should throw NotFoundException for non-existent category', async () => {
      mockCategoryFindFirst.mockResolvedValue(null);

      await expect(
        service.update(mockStoreId, { id: 'cat_nonexistent', name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should validate slug uniqueness on update', async () => {
      mockCategoryFindFirst
        .mockResolvedValueOnce(mockCategory) // Find the category to update
        .mockResolvedValueOnce({ id: 'cat_other', slug: 'taken-slug' }); // Slug already exists

      await expect(
        service.update(mockStoreId, { id: mockCategory.id, slug: 'taken-slug' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('delete', () => {
    it('should delete a category without children', async () => {
      mockCategoryFindFirst.mockResolvedValue({
        ...mockCategory,
        children: [],
      });

      await service.delete(mockStoreId, mockCategory.id);

      expect(mockCategoryDelete).toHaveBeenCalledWith({
        where: { id: mockCategory.id },
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith('category.deleted', expect.any(Object));
    });

    it('should orphan children when deleting parent', async () => {
      mockCategoryFindFirst.mockResolvedValue({
        ...mockCategory,
        children: [mockChildCategory],
      });

      await service.delete(mockStoreId, mockCategory.id);

      expect(mockCategoryUpdateMany).toHaveBeenCalledWith({
        where: { parentId: mockCategory.id },
        data: { parentId: null, depth: 0 },
      });
    });

    it('should throw NotFoundException for non-existent category', async () => {
      mockCategoryFindFirst.mockResolvedValue(null);

      await expect(service.delete(mockStoreId, 'cat_nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findById', () => {
    it('should return a category by ID', async () => {
      mockCategoryFindFirst.mockResolvedValue({
        ...mockCategory,
        _count: { products: 5 },
      });

      const result = await service.findById(mockStoreId, mockCategory.id);

      expect(result.id).toBe(mockCategory.id);
      expect(result.productCount).toBe(5);
    });

    it('should throw NotFoundException for non-existent category', async () => {
      mockCategoryFindFirst.mockResolvedValue(null);

      await expect(service.findById(mockStoreId, 'cat_nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getTree', () => {
    it('should return nested tree structure', async () => {
      mockCategoryFindMany.mockResolvedValue([
        { ...mockCategory, _count: { products: 10 } },
        { ...mockChildCategory, _count: { products: 5 } },
      ]);

      const result = await service.getTree(mockStoreId);

      expect(result).toHaveLength(1); // One root category
      expect(result[0].id).toBe(mockCategory.id);
      expect(result[0].children).toHaveLength(1);
      expect(result[0].children[0].id).toBe(mockChildCategory.id);
      expect(result[0].productCount).toBe(10);
    });

    it('should return empty array for store with no categories', async () => {
      mockCategoryFindMany.mockResolvedValue([]);

      const result = await service.getTree(mockStoreId);

      expect(result).toEqual([]);
    });
  });

  describe('listFlat', () => {
    it('should return flat list of categories', async () => {
      mockCategoryFindMany.mockResolvedValue([
        { id: mockCategory.id, name: 'Electronics', slug: 'electronics', depth: 0, parentId: null },
        { id: mockChildCategory.id, name: 'Smartphones', slug: 'smartphones', depth: 1, parentId: mockCategory.id },
      ]);

      const result = await service.listFlat(mockStoreId);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Electronics');
      expect(result[1].name).toBe('Smartphones');
    });
  });

  describe('assignProducts', () => {
    it('should assign products to a category', async () => {
      mockCategoryFindFirst.mockResolvedValue(mockCategory);
      mockProductFindMany.mockResolvedValue([
        { id: 'prod_1' },
        { id: 'prod_2' },
      ]);
      mockProductCategoryAggregate.mockResolvedValue({ _max: { position: 0 } });
      mockProductCategoryUpsert.mockResolvedValue({});

      await service.assignProducts(mockStoreId, {
        categoryId: mockCategory.id,
        productIds: ['prod_1', 'prod_2'],
      });

      expect(mockProductCategoryUpsert).toHaveBeenCalledTimes(2);
    });

    it('should throw NotFoundException for non-existent category', async () => {
      mockCategoryFindFirst.mockResolvedValue(null);

      await expect(
        service.assignProducts(mockStoreId, {
          categoryId: 'cat_nonexistent',
          productIds: ['prod_1'],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when products not found', async () => {
      mockCategoryFindFirst.mockResolvedValue(mockCategory);
      mockProductFindMany.mockResolvedValue([]); // No products found

      await expect(
        service.assignProducts(mockStoreId, {
          categoryId: mockCategory.id,
          productIds: ['prod_1', 'prod_2'],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeProducts', () => {
    it('should remove products from a category', async () => {
      mockCategoryFindFirst.mockResolvedValue(mockCategory);

      await service.removeProducts(mockStoreId, {
        categoryId: mockCategory.id,
        productIds: ['prod_1', 'prod_2'],
      });

      expect(mockProductCategoryDeleteMany).toHaveBeenCalledWith({
        where: {
          categoryId: mockCategory.id,
          productId: { in: ['prod_1', 'prod_2'] },
        },
      });
    });
  });

  describe('getProductCount', () => {
    it('should return product count for a category', async () => {
      mockCategoryFindFirst.mockResolvedValue(mockCategory);
      mockProductCategoryCount.mockResolvedValue(15);

      const result = await service.getProductCount(mockStoreId, mockCategory.id);

      expect(result).toBe(15);
    });
  });

  describe('reorder', () => {
    it('should reorder category position within same parent', async () => {
      mockCategoryFindFirst.mockResolvedValue(mockCategory);
      mockCategoryUpdate.mockResolvedValue({
        ...mockCategory,
        position: 5,
      });
      mockCategoryAggregate.mockResolvedValue({ _max: { depth: null } });

      const result = await service.reorder(mockStoreId, {
        categoryId: mockCategory.id,
        parentId: null,
        position: 5,
      });

      expect(result.position).toBe(5);
      expect(eventEmitter.emit).toHaveBeenCalledWith('category.reordered', expect.any(Object));
    });

    it('should move category to new parent and update depth', async () => {
      const newParent = { ...mockCategory, id: 'cat_newparent', depth: 0 };

      mockCategoryFindFirst
        .mockResolvedValueOnce(mockChildCategory) // Find category to move
        .mockResolvedValueOnce(newParent); // Find new parent
      mockCategoryAggregate.mockResolvedValue({ _max: { depth: null } });
      mockCategoryFindUnique.mockResolvedValue(mockChildCategory);
      mockCategoryUpdate.mockResolvedValue({
        ...mockChildCategory,
        parentId: newParent.id,
        depth: 1,
      });
      mockCategoryFindMany.mockResolvedValue([]); // No children

      const result = await service.reorder(mockStoreId, {
        categoryId: mockChildCategory.id,
        parentId: newParent.id,
        position: 0,
      });

      expect(result.parentId).toBe(newParent.id);
      expect(result.depth).toBe(1);
    });
  });
});
