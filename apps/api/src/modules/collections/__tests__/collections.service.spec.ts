import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CollectionsService } from '../collections.service';
import { PrismaService } from '@database/prisma.service';

describe('CollectionsService', () => {
  let service: CollectionsService;
  let eventEmitter: { emit: jest.Mock };

  // Define mock functions
  const mockCollectionCreate = jest.fn();
  const mockCollectionFindFirst = jest.fn();
  const mockCollectionFindMany = jest.fn();
  const mockCollectionUpdate = jest.fn();
  const mockCollectionDelete = jest.fn();
  const mockCollectionCount = jest.fn();
  const mockProductFindMany = jest.fn();
  const mockCollectionProductUpsert = jest.fn();
  const mockCollectionProductUpdate = jest.fn();
  const mockCollectionProductDeleteMany = jest.fn();
  const mockCollectionProductFindMany = jest.fn();
  const mockCollectionProductCount = jest.fn();
  const mockCollectionProductAggregate = jest.fn();
  const mockTransaction = jest.fn();

  const mockStoreId = 'store_test123';

  const mockCollection = {
    id: 'col_test123',
    storeId: mockStoreId,
    name: 'Summer Sale',
    slug: 'summer-sale',
    description: 'Hot summer deals',
    imageUrl: 'https://example.com/summer.jpg',
    isVisible: true,
    isFeatured: false,
    createdAt: new Date('2026-01-18T10:00:00Z'),
    updatedAt: new Date('2026-01-18T10:00:00Z'),
  };

  const mockFeaturedCollection = {
    ...mockCollection,
    id: 'col_featured123',
    name: 'Featured Products',
    slug: 'featured-products',
    isFeatured: true,
  };

  const mockProduct = {
    id: 'prod_test123',
    storeId: mockStoreId,
    name: 'Test Product',
    slug: 'test-product',
    priceInCents: 1999,
    status: 'ACTIVE',
    deletedAt: null,
  };

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    const mockPrismaObj = {
      collection: {
        create: mockCollectionCreate,
        findFirst: mockCollectionFindFirst,
        findMany: mockCollectionFindMany,
        update: mockCollectionUpdate,
        delete: mockCollectionDelete,
        count: mockCollectionCount,
      },
      product: {
        findMany: mockProductFindMany,
      },
      collectionProduct: {
        upsert: mockCollectionProductUpsert,
        update: mockCollectionProductUpdate,
        deleteMany: mockCollectionProductDeleteMany,
        findMany: mockCollectionProductFindMany,
        count: mockCollectionProductCount,
        aggregate: mockCollectionProductAggregate,
      },
    };

    // Set up mock $transaction to handle both array and callback forms
    mockTransaction.mockImplementation((arg: unknown) => {
      if (Array.isArray(arg)) {
        return Promise.all(arg);
      }
      return (arg as (prisma: typeof mockPrismaObj) => Promise<unknown>)(mockPrismaObj);
    });

    const mockPrisma = {
      ...mockPrismaObj,
      $transaction: mockTransaction,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CollectionsService,
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: EventEmitter2,
          useValue: { emit: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<CollectionsService>(CollectionsService);
    eventEmitter = module.get(EventEmitter2);
  });

  describe('create', () => {
    it('should create a collection with auto-generated slug', async () => {
      mockCollectionFindFirst.mockResolvedValue(null);
      mockCollectionCreate.mockResolvedValue(mockCollection);

      const result = await service.create(mockStoreId, {
        name: 'Summer Sale',
        description: 'Hot summer deals',
      });

      expect(result.id).toBe(mockCollection.id);
      expect(result.name).toBe('Summer Sale');
      expect(result.slug).toBe('summer-sale');
      expect(mockCollectionCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          storeId: mockStoreId,
          name: 'Summer Sale',
          slug: 'summer-sale',
        }),
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith('collection.created', expect.any(Object));
    });

    it('should create a collection with custom slug', async () => {
      mockCollectionFindFirst.mockResolvedValue(null);
      mockCollectionCreate.mockResolvedValue({
        ...mockCollection,
        slug: 'custom-slug',
      });

      const result = await service.create(mockStoreId, {
        name: 'Summer Sale',
        slug: 'custom-slug',
      });

      expect(result.slug).toBe('custom-slug');
    });

    it('should throw ConflictException for duplicate slug', async () => {
      mockCollectionFindFirst.mockResolvedValue(mockCollection);

      await expect(
        service.create(mockStoreId, { name: 'Summer Sale' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create a visible collection by default', async () => {
      mockCollectionFindFirst.mockResolvedValue(null);
      mockCollectionCreate.mockResolvedValue(mockCollection);

      const result = await service.create(mockStoreId, {
        name: 'Summer Sale',
      });

      expect(result.isVisible).toBe(true);
      expect(mockCollectionCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          isVisible: true,
        }),
      });
    });

    it('should create a non-featured collection by default', async () => {
      mockCollectionFindFirst.mockResolvedValue(null);
      mockCollectionCreate.mockResolvedValue(mockCollection);

      const result = await service.create(mockStoreId, {
        name: 'Summer Sale',
      });

      expect(result.isFeatured).toBe(false);
      expect(mockCollectionCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          isFeatured: false,
        }),
      });
    });

    it('should create a featured collection when specified', async () => {
      mockCollectionFindFirst.mockResolvedValue(null);
      mockCollectionCreate.mockResolvedValue(mockFeaturedCollection);

      const result = await service.create(mockStoreId, {
        name: 'Featured Products',
        isFeatured: true,
      });

      expect(result.isFeatured).toBe(true);
    });

    it('should create a hidden collection when specified', async () => {
      mockCollectionFindFirst.mockResolvedValue(null);
      mockCollectionCreate.mockResolvedValue({
        ...mockCollection,
        isVisible: false,
      });

      const result = await service.create(mockStoreId, {
        name: 'Summer Sale',
        isVisible: false,
      });

      expect(result.isVisible).toBe(false);
    });
  });

  describe('update', () => {
    it('should update collection metadata', async () => {
      mockCollectionFindFirst.mockResolvedValue(mockCollection);
      mockCollectionUpdate.mockResolvedValue({
        ...mockCollection,
        name: 'Updated Collection',
        description: 'Updated description',
      });

      const result = await service.update(mockStoreId, {
        id: mockCollection.id,
        name: 'Updated Collection',
        description: 'Updated description',
      });

      expect(result.name).toBe('Updated Collection');
      expect(result.description).toBe('Updated description');
      expect(eventEmitter.emit).toHaveBeenCalledWith('collection.updated', expect.any(Object));
    });

    it('should throw NotFoundException for non-existent collection', async () => {
      mockCollectionFindFirst.mockResolvedValue(null);

      await expect(
        service.update(mockStoreId, { id: 'non-existent', name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should validate slug uniqueness when changing slug', async () => {
      mockCollectionFindFirst
        .mockResolvedValueOnce(mockCollection) // Collection exists
        .mockResolvedValueOnce(mockFeaturedCollection); // Another collection has slug

      await expect(
        service.update(mockStoreId, {
          id: mockCollection.id,
          slug: 'featured-products',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should toggle visibility', async () => {
      mockCollectionFindFirst.mockResolvedValue(mockCollection);
      mockCollectionUpdate.mockResolvedValue({
        ...mockCollection,
        isVisible: false,
      });

      const result = await service.update(mockStoreId, {
        id: mockCollection.id,
        isVisible: false,
      });

      expect(result.isVisible).toBe(false);
    });

    it('should toggle featured status', async () => {
      mockCollectionFindFirst.mockResolvedValue(mockCollection);
      mockCollectionUpdate.mockResolvedValue({
        ...mockCollection,
        isFeatured: true,
      });

      const result = await service.update(mockStoreId, {
        id: mockCollection.id,
        isFeatured: true,
      });

      expect(result.isFeatured).toBe(true);
    });
  });

  describe('delete', () => {
    it('should delete a collection', async () => {
      mockCollectionFindFirst.mockResolvedValue(mockCollection);
      mockCollectionDelete.mockResolvedValue(mockCollection);

      await service.delete(mockStoreId, mockCollection.id);

      expect(mockCollectionDelete).toHaveBeenCalledWith({ where: { id: mockCollection.id } });
      expect(eventEmitter.emit).toHaveBeenCalledWith('collection.deleted', expect.any(Object));
    });

    it('should throw NotFoundException for non-existent collection', async () => {
      mockCollectionFindFirst.mockResolvedValue(null);

      await expect(
        service.delete(mockStoreId, 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findById', () => {
    it('should return collection by ID', async () => {
      mockCollectionFindFirst.mockResolvedValue({
        ...mockCollection,
        _count: { products: 5 },
      });

      const result = await service.findById(mockStoreId, mockCollection.id);

      expect(result.id).toBe(mockCollection.id);
      expect(result.productCount).toBe(5);
    });

    it('should throw NotFoundException for non-existent collection', async () => {
      mockCollectionFindFirst.mockResolvedValue(null);

      await expect(
        service.findById(mockStoreId, 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('list', () => {
    it('should return paginated collection list', async () => {
      mockCollectionFindMany.mockResolvedValue([
        { ...mockCollection, _count: { products: 5 } },
        { ...mockFeaturedCollection, _count: { products: 10 } },
      ]);
      mockCollectionCount.mockResolvedValue(2);

      const result = await service.list(mockStoreId, { page: 1, limit: 10 });

      expect(result.collections.length).toBe(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('should filter by visibility', async () => {
      mockCollectionFindMany.mockResolvedValue([
        { ...mockCollection, _count: { products: 5 } },
      ]);
      mockCollectionCount.mockResolvedValue(1);

      await service.list(mockStoreId, { isVisible: true });

      expect(mockCollectionFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isVisible: true,
          }),
        }),
      );
    });

    it('should filter by featured status', async () => {
      mockCollectionFindMany.mockResolvedValue([
        { ...mockFeaturedCollection, _count: { products: 10 } },
      ]);
      mockCollectionCount.mockResolvedValue(1);

      await service.list(mockStoreId, { isFeatured: true });

      expect(mockCollectionFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isFeatured: true,
          }),
        }),
      );
    });

    it('should search by name or description', async () => {
      mockCollectionFindMany.mockResolvedValue([
        { ...mockCollection, _count: { products: 5 } },
      ]);
      mockCollectionCount.mockResolvedValue(1);

      await service.list(mockStoreId, { search: 'summer' });

      expect(mockCollectionFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: 'summer', mode: 'insensitive' } },
              { description: { contains: 'summer', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });
  });

  describe('addProducts', () => {
    it('should add products to collection', async () => {
      mockCollectionFindFirst.mockResolvedValue(mockCollection);
      mockProductFindMany.mockResolvedValue([mockProduct]);
      mockCollectionProductAggregate.mockResolvedValue({ _max: { position: null } });
      mockCollectionProductUpsert.mockResolvedValue({});

      await service.addProducts(mockStoreId, {
        collectionId: mockCollection.id,
        productIds: [mockProduct.id],
      });

      expect(mockTransaction).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith('collection.updated', expect.objectContaining({
        action: 'products_added',
      }));
    });

    it('should throw NotFoundException for non-existent collection', async () => {
      mockCollectionFindFirst.mockResolvedValue(null);

      await expect(
        service.addProducts(mockStoreId, {
          collectionId: 'non-existent',
          productIds: [mockProduct.id],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for non-existent products', async () => {
      mockCollectionFindFirst.mockResolvedValue(mockCollection);
      mockProductFindMany.mockResolvedValue([]); // No products found

      await expect(
        service.addProducts(mockStoreId, {
          collectionId: mockCollection.id,
          productIds: ['non-existent'],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeProducts', () => {
    it('should remove products from collection', async () => {
      mockCollectionFindFirst.mockResolvedValue(mockCollection);
      mockCollectionProductDeleteMany.mockResolvedValue({ count: 1 });

      await service.removeProducts(mockStoreId, {
        collectionId: mockCollection.id,
        productIds: [mockProduct.id],
      });

      expect(mockCollectionProductDeleteMany).toHaveBeenCalledWith({
        where: {
          collectionId: mockCollection.id,
          productId: { in: [mockProduct.id] },
        },
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith('collection.updated', expect.objectContaining({
        action: 'products_removed',
      }));
    });

    it('should throw NotFoundException for non-existent collection', async () => {
      mockCollectionFindFirst.mockResolvedValue(null);

      await expect(
        service.removeProducts(mockStoreId, {
          collectionId: 'non-existent',
          productIds: [mockProduct.id],
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('reorderProducts', () => {
    it('should reorder products in collection', async () => {
      mockCollectionFindFirst.mockResolvedValue(mockCollection);
      mockCollectionProductUpdate.mockResolvedValue({});

      await service.reorderProducts(mockStoreId, {
        collectionId: mockCollection.id,
        productIds: ['prod_1', 'prod_2', 'prod_3'],
      });

      expect(mockTransaction).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith('collection.updated', expect.objectContaining({
        action: 'products_reordered',
      }));
    });

    it('should throw NotFoundException for non-existent collection', async () => {
      mockCollectionFindFirst.mockResolvedValue(null);

      await expect(
        service.reorderProducts(mockStoreId, {
          collectionId: 'non-existent',
          productIds: ['prod_1'],
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getProductCount', () => {
    it('should return product count for collection', async () => {
      mockCollectionFindFirst.mockResolvedValue(mockCollection);
      mockCollectionProductCount.mockResolvedValue(5);

      const result = await service.getProductCount(mockStoreId, mockCollection.id);

      expect(result).toBe(5);
    });

    it('should throw NotFoundException for non-existent collection', async () => {
      mockCollectionFindFirst.mockResolvedValue(null);

      await expect(
        service.getProductCount(mockStoreId, 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getCollectionsForProduct', () => {
    it('should return collections for a product', async () => {
      mockCollectionProductFindMany.mockResolvedValue([
        { collection: mockCollection, position: 0, productId: mockProduct.id },
        { collection: mockFeaturedCollection, position: 1, productId: mockProduct.id },
      ]);

      const result = await service.getCollectionsForProduct(mockStoreId, mockProduct.id);

      expect(result.length).toBe(2);
      expect(result[0].id).toBe(mockCollection.id);
      expect(result[1].id).toBe(mockFeaturedCollection.id);
    });
  });

  describe('slug generation', () => {
    it('should generate slug with lowercase', async () => {
      mockCollectionFindFirst.mockResolvedValue(null);
      mockCollectionCreate.mockImplementation(({ data }) => Promise.resolve({
        ...mockCollection,
        slug: data.slug,
      }));

      const result = await service.create(mockStoreId, {
        name: 'UPPERCASE COLLECTION',
      });

      expect(result.slug).toBe('uppercase-collection');
    });

    it('should generate slug replacing special characters', async () => {
      mockCollectionFindFirst.mockResolvedValue(null);
      mockCollectionCreate.mockImplementation(({ data }) => Promise.resolve({
        ...mockCollection,
        slug: data.slug,
      }));

      const result = await service.create(mockStoreId, {
        name: 'Special! @Collection# $Name',
      });

      expect(result.slug).toBe('special-collection-name');
    });

    it('should trim leading/trailing hyphens from slug', async () => {
      mockCollectionFindFirst.mockResolvedValue(null);
      mockCollectionCreate.mockImplementation(({ data }) => Promise.resolve({
        ...mockCollection,
        slug: data.slug,
      }));

      const result = await service.create(mockStoreId, {
        name: '  -Trimmed Name-  ',
      });

      expect(result.slug).toBe('trimmed-name');
    });
  });

  describe('tenant isolation', () => {
    it('should only find collections in the same store', async () => {
      mockCollectionFindFirst.mockResolvedValue(null);

      await expect(
        service.findById(mockStoreId, 'col_other_store'),
      ).rejects.toThrow(NotFoundException);

      expect(mockCollectionFindFirst).toHaveBeenCalledWith({
        where: { id: 'col_other_store', storeId: mockStoreId },
        include: expect.any(Object),
      });
    });
  });
});
