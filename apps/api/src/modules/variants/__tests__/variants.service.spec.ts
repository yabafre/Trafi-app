import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { VariantsService } from '../variants.service';
import { PrismaService } from '@database/prisma.service';

// Mock PrismaService
const mockPrismaService = {
  product: {
    findFirst: jest.fn(),
  },
  productVariant: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  $transaction: jest.fn(),
};

// Mock EventEmitter2
const mockEventEmitter = {
  emit: jest.fn(),
};

describe('VariantsService', () => {
  let service: VariantsService;

  const mockStoreId = 'store_test123';
  const mockProductId = 'prod_test123';
  const mockVariantId = 'var_test123';

  const mockProduct = {
    id: mockProductId,
    storeId: mockStoreId,
    name: 'Test Product',
    slug: 'test-product',
    variants: [],
    deletedAt: null,
  };

  const mockVariant = {
    id: mockVariantId,
    productId: mockProductId,
    sku: 'TES-SM-BL-A1B2',
    options: [
      { name: 'Size', value: 'Small' },
      { name: 'Color', value: 'Blue' },
    ],
    priceInCents: 2999,
    compareAtPriceInCents: null,
    costPriceInCents: null,
    quantity: 10,
    trackInventory: true,
    weight: null,
    weightUnit: 'G',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VariantsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<VariantsService>(VariantsService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createInput = {
      productId: mockProductId,
      options: [
        { name: 'Size', value: 'Small' },
        { name: 'Color', value: 'Blue' },
      ],
      priceInCents: 2999,
      quantity: 10,
      trackInventory: true,
      weightUnit: 'g' as const,
    };

    it('should create a variant successfully', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue({
        ...mockProduct,
        variants: [],
      });
      mockPrismaService.productVariant.create.mockResolvedValue(mockVariant);

      const result = await service.create(mockStoreId, createInput);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockVariantId);
      expect(result.options).toEqual(createInput.options);
      expect(result.priceInCents).toBe(2999);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'variant.created',
        expect.any(Object),
      );
    });

    it('should throw NotFoundException if product not found', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue(null);

      await expect(service.create(mockStoreId, createInput)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if product belongs to different store', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue(null); // findFirst with storeId filter returns null

      await expect(
        service.create('different_store', createInput),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if options already exist', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue({
        ...mockProduct,
        variants: [mockVariant], // Already has a variant with same options
      });

      await expect(service.create(mockStoreId, createInput)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should auto-generate SKU if not provided', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue({
        ...mockProduct,
        variants: [],
      });
      mockPrismaService.productVariant.create.mockResolvedValue(mockVariant);

      await service.create(mockStoreId, createInput);

      expect(mockPrismaService.productVariant.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sku: expect.stringMatching(/^TES-SM-BL-[A-Z0-9]+$/),
        }),
      });
    });

    it('should use provided SKU if given', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue({
        ...mockProduct,
        variants: [],
      });
      mockPrismaService.productVariant.create.mockResolvedValue({
        ...mockVariant,
        sku: 'CUSTOM-SKU',
      });

      await service.create(mockStoreId, {
        ...createInput,
        sku: 'CUSTOM-SKU',
      });

      expect(mockPrismaService.productVariant.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sku: 'CUSTOM-SKU',
        }),
      });
    });
  });

  describe('bulkCreate', () => {
    const bulkInput = {
      productId: mockProductId,
      optionTypes: [
        { name: 'Size', values: ['S', 'M'] },
        { name: 'Color', values: ['Red', 'Blue'] },
      ],
      defaultPriceInCents: 2999,
    };

    it('should create all combinations', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue({
        ...mockProduct,
        variants: [],
      });

      const createdVariants = [
        { ...mockVariant, id: 'var_1', options: [{ name: 'Size', value: 'S' }, { name: 'Color', value: 'Red' }] },
        { ...mockVariant, id: 'var_2', options: [{ name: 'Size', value: 'S' }, { name: 'Color', value: 'Blue' }] },
        { ...mockVariant, id: 'var_3', options: [{ name: 'Size', value: 'M' }, { name: 'Color', value: 'Red' }] },
        { ...mockVariant, id: 'var_4', options: [{ name: 'Size', value: 'M' }, { name: 'Color', value: 'Blue' }] },
      ];

      mockPrismaService.$transaction.mockResolvedValue(createdVariants);

      const result = await service.bulkCreate(mockStoreId, bulkInput);

      expect(result).toHaveLength(4);
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'variants.bulk_created',
        expect.objectContaining({ count: 4 }),
      );
    });

    it('should throw NotFoundException if product not found', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue(null);

      await expect(service.bulkCreate(mockStoreId, bulkInput)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateInput = {
      id: mockVariantId,
      priceInCents: 3999,
      quantity: 20,
    };

    it('should update variant successfully', async () => {
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        ...mockVariant,
        product: mockProduct,
      });
      mockPrismaService.productVariant.update.mockResolvedValue({
        ...mockVariant,
        priceInCents: 3999,
        quantity: 20,
      });

      const result = await service.update(mockStoreId, updateInput);

      expect(result.priceInCents).toBe(3999);
      expect(result.quantity).toBe(20);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'variant.updated',
        expect.any(Object),
      );
    });

    it('should throw NotFoundException if variant not found', async () => {
      mockPrismaService.productVariant.findUnique.mockResolvedValue(null);

      await expect(service.update(mockStoreId, updateInput)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if variant belongs to different store', async () => {
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        ...mockVariant,
        product: { ...mockProduct, storeId: 'different_store' },
      });

      await expect(service.update(mockStoreId, updateInput)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should validate options uniqueness when updating options', async () => {
      const existingVariant2 = {
        id: 'var_other',
        options: [{ name: 'Size', value: 'Large' }],
      };

      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        ...mockVariant,
        product: {
          ...mockProduct,
          variants: [mockVariant, existingVariant2],
        },
      });

      // Update to options that conflict with existingVariant2
      await expect(
        service.update(mockStoreId, {
          id: mockVariantId,
          options: [{ name: 'Size', value: 'Large' }],
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('delete', () => {
    it('should delete variant successfully', async () => {
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        ...mockVariant,
        product: mockProduct,
      });
      mockPrismaService.productVariant.count.mockResolvedValue(2); // More than 1 variant
      mockPrismaService.productVariant.delete.mockResolvedValue(mockVariant);

      await service.delete(mockStoreId, mockVariantId);

      expect(mockPrismaService.productVariant.delete).toHaveBeenCalledWith({
        where: { id: mockVariantId },
      });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'variant.deleted',
        expect.any(Object),
      );
    });

    it('should throw NotFoundException if variant not found', async () => {
      mockPrismaService.productVariant.findUnique.mockResolvedValue(null);

      await expect(service.delete(mockStoreId, mockVariantId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if trying to delete last variant', async () => {
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        ...mockVariant,
        product: mockProduct,
      });
      mockPrismaService.productVariant.count.mockResolvedValue(1); // Only 1 variant

      await expect(service.delete(mockStoreId, mockVariantId)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.productVariant.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if variant belongs to different store', async () => {
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        ...mockVariant,
        product: { ...mockProduct, storeId: 'different_store' },
      });

      await expect(service.delete(mockStoreId, mockVariantId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('listByProduct', () => {
    it('should return all variants for a product', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue(mockProduct);
      mockPrismaService.productVariant.findMany.mockResolvedValue([
        mockVariant,
        { ...mockVariant, id: 'var_2' },
      ]);

      const result = await service.listByProduct(mockStoreId, mockProductId);

      expect(result).toHaveLength(2);
      expect(mockPrismaService.productVariant.findMany).toHaveBeenCalledWith({
        where: { productId: mockProductId },
        orderBy: { createdAt: 'asc' },
      });
    });

    it('should throw NotFoundException if product not found', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue(null);

      await expect(
        service.listByProduct(mockStoreId, mockProductId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findById', () => {
    it('should return variant by ID', async () => {
      mockPrismaService.productVariant.findUnique.mockResolvedValue({
        ...mockVariant,
        product: mockProduct,
      });

      const result = await service.findById(mockStoreId, mockVariantId);

      expect(result.id).toBe(mockVariantId);
    });

    it('should throw NotFoundException if variant not found', async () => {
      mockPrismaService.productVariant.findUnique.mockResolvedValue(null);

      await expect(
        service.findById(mockStoreId, mockVariantId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('generateCombinations', () => {
    it('should generate all combinations correctly', () => {
      const optionTypes = [
        { name: 'Size', values: ['S', 'M'] },
        { name: 'Color', values: ['Red', 'Blue'] },
      ];

      // Access protected method for testing
      const combinations = (service as any).generateCombinations(optionTypes);

      expect(combinations).toHaveLength(4);
      expect(combinations).toContainEqual([
        { name: 'Size', value: 'S' },
        { name: 'Color', value: 'Red' },
      ]);
      expect(combinations).toContainEqual([
        { name: 'Size', value: 'S' },
        { name: 'Color', value: 'Blue' },
      ]);
      expect(combinations).toContainEqual([
        { name: 'Size', value: 'M' },
        { name: 'Color', value: 'Red' },
      ]);
      expect(combinations).toContainEqual([
        { name: 'Size', value: 'M' },
        { name: 'Color', value: 'Blue' },
      ]);
    });

    it('should return empty array for empty input', () => {
      const combinations = (service as any).generateCombinations([]);
      expect(combinations).toEqual([]);
    });

    it('should handle single option type', () => {
      const optionTypes = [{ name: 'Size', values: ['S', 'M', 'L'] }];
      const combinations = (service as any).generateCombinations(optionTypes);

      expect(combinations).toHaveLength(3);
      expect(combinations).toContainEqual([{ name: 'Size', value: 'S' }]);
      expect(combinations).toContainEqual([{ name: 'Size', value: 'M' }]);
      expect(combinations).toContainEqual([{ name: 'Size', value: 'L' }]);
    });
  });

  describe('tenant isolation', () => {
    it('should only find products within the same store', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue(null);

      await expect(
        service.create('wrong_store_id', {
          productId: mockProductId,
          options: [{ name: 'Size', value: 'M' }],
          priceInCents: 1000,
          quantity: 0,
          trackInventory: true,
          weightUnit: 'g' as const,
        }),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrismaService.product.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockProductId,
          storeId: 'wrong_store_id',
          deletedAt: null,
        },
        include: { variants: true },
      });
    });
  });
});
