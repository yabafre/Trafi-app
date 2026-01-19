import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { InventoryService } from '../inventory.service';
import { PrismaService } from '@database/prisma.service';

/**
 * InventoryService Unit Tests
 *
 * Comprehensive tests for inventory tracking, adjustments, and calculations.
 *
 * @see Story 3.7 - Inventory Tracking
 */
describe('InventoryService', () => {
  let service: InventoryService;
  let mockPrisma: {
    productVariant: { findUnique: jest.Mock; update: jest.Mock };
    inventoryHistory: { create: jest.Mock; findMany: jest.Mock; count: jest.Mock };
    $transaction: jest.Mock;
  };
  let mockEventEmitter: { emit: jest.Mock };

  beforeEach(async () => {
    mockPrisma = {
      productVariant: { findUnique: jest.fn(), update: jest.fn() },
      inventoryHistory: { create: jest.fn(), findMany: jest.fn(), count: jest.fn() },
      $transaction: jest.fn(),
    };

    mockEventEmitter = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ===========================================================================
  // toVariantInventory Helper Method Tests
  // ===========================================================================
  describe('toVariantInventory - stock status calculations', () => {
    const callToVariantInventory = (
      service: InventoryService,
      variant: {
        id: string;
        quantity: number;
        trackInventory: boolean;
        lowStockThreshold: number;
        allowOversell: boolean;
      },
    ) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (service as any).toVariantInventory(variant);
    };

    it('should calculate isLowStock=false and isOutOfStock=false for normal stock', () => {
      const result = callToVariantInventory(service, {
        id: 'var_1',
        quantity: 100,
        trackInventory: true,
        lowStockThreshold: 5,
        allowOversell: false,
      });

      expect(result.variantId).toBe('var_1');
      expect(result.quantity).toBe(100);
      expect(result.isLowStock).toBe(false);
      expect(result.isOutOfStock).toBe(false);
    });

    it('should calculate isLowStock=true when at threshold', () => {
      const result = callToVariantInventory(service, {
        id: 'var_2',
        quantity: 5,
        trackInventory: true,
        lowStockThreshold: 5,
        allowOversell: false,
      });

      expect(result.isLowStock).toBe(true);
      expect(result.isOutOfStock).toBe(false);
    });

    it('should calculate isLowStock=true when below threshold', () => {
      const result = callToVariantInventory(service, {
        id: 'var_3',
        quantity: 3,
        trackInventory: true,
        lowStockThreshold: 5,
        allowOversell: false,
      });

      expect(result.isLowStock).toBe(true);
      expect(result.isOutOfStock).toBe(false);
    });

    it('should calculate isOutOfStock=true when quantity is 0', () => {
      const result = callToVariantInventory(service, {
        id: 'var_4',
        quantity: 0,
        trackInventory: true,
        lowStockThreshold: 5,
        allowOversell: false,
      });

      expect(result.isLowStock).toBe(false);
      expect(result.isOutOfStock).toBe(true);
    });

    it('should never show low/out of stock when trackInventory is false', () => {
      const result = callToVariantInventory(service, {
        id: 'var_5',
        quantity: 0,
        trackInventory: false,
        lowStockThreshold: 5,
        allowOversell: false,
      });

      expect(result.isLowStock).toBe(false);
      expect(result.isOutOfStock).toBe(false);
    });

    it('should show isOutOfStock=true for negative inventory (even with oversell)', () => {
      const result = callToVariantInventory(service, {
        id: 'var_6',
        quantity: -5,
        trackInventory: true,
        lowStockThreshold: 5,
        allowOversell: true,
      });

      // Fixed: Negative inventory IS out of stock
      expect(result.isLowStock).toBe(false);
      expect(result.isOutOfStock).toBe(true);
    });

    it('should return all fields correctly', () => {
      const result = callToVariantInventory(service, {
        id: 'var_7',
        quantity: 50,
        trackInventory: true,
        lowStockThreshold: 10,
        allowOversell: true,
      });

      expect(result).toEqual({
        variantId: 'var_7',
        quantity: 50,
        trackInventory: true,
        lowStockThreshold: 10,
        allowOversell: true,
        isLowStock: false,
        isOutOfStock: false,
      });
    });
  });

  // ===========================================================================
  // Stock Status Edge Cases
  // ===========================================================================
  describe('stock status edge cases', () => {
    const callToVariantInventory = (
      service: InventoryService,
      variant: {
        id: string;
        quantity: number;
        trackInventory: boolean;
        lowStockThreshold: number;
        allowOversell: boolean;
      },
    ) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (service as any).toVariantInventory(variant);
    };

    it('should handle threshold of 0', () => {
      const result = callToVariantInventory(service, {
        id: 'var_1',
        quantity: 1,
        trackInventory: true,
        lowStockThreshold: 0,
        allowOversell: false,
      });

      expect(result.isLowStock).toBe(false);
    });

    it('should handle threshold equal to quantity', () => {
      const result = callToVariantInventory(service, {
        id: 'var_2',
        quantity: 10,
        trackInventory: true,
        lowStockThreshold: 10,
        allowOversell: false,
      });

      expect(result.isLowStock).toBe(true);
    });

    it('should handle very high threshold', () => {
      const result = callToVariantInventory(service, {
        id: 'var_3',
        quantity: 100,
        trackInventory: true,
        lowStockThreshold: 1000,
        allowOversell: false,
      });

      expect(result.isLowStock).toBe(true);
    });

    it('should handle very large quantity', () => {
      const result = callToVariantInventory(service, {
        id: 'var_4',
        quantity: 999999,
        trackInventory: true,
        lowStockThreshold: 5,
        allowOversell: false,
      });

      expect(result.isLowStock).toBe(false);
      expect(result.isOutOfStock).toBe(false);
    });
  });

  // ===========================================================================
  // adjustInventory Method Tests
  // ===========================================================================
  describe('adjustInventory', () => {
    const mockVariant = {
      id: 'var_test1',
      quantity: 100,
      trackInventory: true,
      allowOversell: false,
      lowStockThreshold: 10,
      product: { storeId: 'store_test1' },
    };

    it('should successfully adjust inventory', async () => {
      const updatedVariant = { ...mockVariant, quantity: 90 };

      mockPrisma.$transaction.mockImplementation(async (fn) => {
        const mockTx = {
          productVariant: {
            findUnique: jest.fn().mockResolvedValue(mockVariant),
            update: jest.fn().mockResolvedValue(updatedVariant),
          },
          inventoryHistory: {
            create: jest.fn().mockResolvedValue({}),
          },
        };
        return fn(mockTx);
      });

      const result = await service.adjustInventory(
        'store_test1',
        {
          variantId: 'var_test1',
          quantityChange: -10,
          reason: 'MANUAL_ADJUSTMENT',
        },
        'user_1',
      );

      expect(result.variantId).toBe('var_test1');
      expect(result.quantity).toBe(90);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'inventory.adjusted',
        expect.objectContaining({
          variantId: 'var_test1',
          quantityBefore: 100,
          quantityAfter: 90,
          quantityChange: -10,
        }),
      );
    });

    it('should throw NotFoundException for non-existent variant', async () => {
      mockPrisma.$transaction.mockImplementation(async (fn) => {
        const mockTx = {
          productVariant: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
        };
        return fn(mockTx);
      });

      await expect(
        service.adjustInventory('store_test1', {
          variantId: 'non_existent',
          quantityChange: -10,
          reason: 'MANUAL_ADJUSTMENT',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for wrong store', async () => {
      mockPrisma.$transaction.mockImplementation(async (fn) => {
        const mockTx = {
          productVariant: {
            findUnique: jest.fn().mockResolvedValue(mockVariant),
          },
        };
        return fn(mockTx);
      });

      await expect(
        service.adjustInventory('wrong_store', {
          variantId: 'var_test1',
          quantityChange: -10,
          reason: 'MANUAL_ADJUSTMENT',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for insufficient inventory', async () => {
      mockPrisma.$transaction.mockImplementation(async (fn) => {
        const mockTx = {
          productVariant: {
            findUnique: jest.fn().mockResolvedValue(mockVariant),
          },
        };
        return fn(mockTx);
      });

      await expect(
        service.adjustInventory('store_test1', {
          variantId: 'var_test1',
          quantityChange: -200, // More than available
          reason: 'MANUAL_ADJUSTMENT',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow negative inventory when allowOversell is true', async () => {
      const oversellVariant = { ...mockVariant, allowOversell: true, quantity: 5 };
      const updatedVariant = { ...oversellVariant, quantity: -5 };

      mockPrisma.$transaction.mockImplementation(async (fn) => {
        const mockTx = {
          productVariant: {
            findUnique: jest.fn().mockResolvedValue(oversellVariant),
            update: jest.fn().mockResolvedValue(updatedVariant),
          },
          inventoryHistory: {
            create: jest.fn().mockResolvedValue({}),
          },
        };
        return fn(mockTx);
      });

      const result = await service.adjustInventory('store_test1', {
        variantId: 'var_test1',
        quantityChange: -10,
        reason: 'ORDER_PLACED',
      });

      expect(result.quantity).toBe(-5);
    });

    it('should emit low stock event when quantity drops below threshold', async () => {
      const updatedVariant = { ...mockVariant, quantity: 8 };

      mockPrisma.$transaction.mockImplementation(async (fn) => {
        const mockTx = {
          productVariant: {
            findUnique: jest.fn().mockResolvedValue(mockVariant),
            update: jest.fn().mockResolvedValue(updatedVariant),
          },
          inventoryHistory: {
            create: jest.fn().mockResolvedValue({}),
          },
        };
        return fn(mockTx);
      });

      await service.adjustInventory('store_test1', {
        variantId: 'var_test1',
        quantityChange: -92, // Drops to 8, below threshold of 10
        reason: 'MANUAL_ADJUSTMENT',
      });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'inventory.low_stock',
        expect.objectContaining({
          variantId: 'var_test1',
          quantity: 8,
          threshold: 10,
        }),
      );
    });

    it('should skip adjustment when trackInventory is false', async () => {
      const untracked = { ...mockVariant, trackInventory: false };

      mockPrisma.$transaction.mockImplementation(async (fn) => {
        const mockTx = {
          productVariant: {
            findUnique: jest.fn().mockResolvedValue(untracked),
            update: jest.fn(),
          },
          inventoryHistory: {
            create: jest.fn(),
          },
        };
        return fn(mockTx);
      });

      const result = await service.adjustInventory('store_test1', {
        variantId: 'var_test1',
        quantityChange: -10,
        reason: 'MANUAL_ADJUSTMENT',
      });

      // Should return current state without modification
      expect(result.quantity).toBe(100);
    });
  });

  // ===========================================================================
  // setInventory Method Tests
  // ===========================================================================
  describe('setInventory', () => {
    const mockVariant = {
      id: 'var_test1',
      quantity: 50,
      trackInventory: true,
      allowOversell: false,
      lowStockThreshold: 10,
      product: { storeId: 'store_test1' },
    };

    it('should set inventory to new value', async () => {
      const updatedVariant = { ...mockVariant, quantity: 100 };

      mockPrisma.$transaction.mockImplementation(async (fn) => {
        const mockTx = {
          productVariant: {
            findUnique: jest.fn().mockResolvedValue(mockVariant),
            update: jest.fn().mockResolvedValue(updatedVariant),
          },
          inventoryHistory: {
            create: jest.fn().mockResolvedValue({}),
          },
        };
        return fn(mockTx);
      });

      const result = await service.setInventory(
        'store_test1',
        {
          variantId: 'var_test1',
          quantity: 100,
          reason: 'MANUAL_ADJUSTMENT',
        },
        'user_1',
      );

      expect(result.quantity).toBe(100);
    });

    it('should return current state when quantity unchanged', async () => {
      mockPrisma.$transaction.mockImplementation(async (fn) => {
        const mockTx = {
          productVariant: {
            findUnique: jest.fn().mockResolvedValue(mockVariant),
          },
        };
        return fn(mockTx);
      });

      const result = await service.setInventory('store_test1', {
        variantId: 'var_test1',
        quantity: 50, // Same as current
        reason: 'MANUAL_ADJUSTMENT',
      });

      expect(result.quantity).toBe(50);
    });
  });

  // ===========================================================================
  // updateSettings Method Tests
  // ===========================================================================
  describe('updateSettings', () => {
    const mockVariant = {
      id: 'var_test1',
      quantity: 50,
      trackInventory: true,
      allowOversell: false,
      lowStockThreshold: 10,
      product: { storeId: 'store_test1' },
    };

    it('should update inventory settings', async () => {
      const updatedVariant = {
        ...mockVariant,
        trackInventory: false,
        lowStockThreshold: 20,
        allowOversell: true,
      };

      mockPrisma.productVariant.findUnique.mockResolvedValue(mockVariant);
      mockPrisma.productVariant.update.mockResolvedValue(updatedVariant);

      const result = await service.updateSettings('store_test1', {
        variantId: 'var_test1',
        trackInventory: false,
        lowStockThreshold: 20,
        allowOversell: true,
      });

      expect(result.trackInventory).toBe(false);
      expect(result.lowStockThreshold).toBe(20);
      expect(result.allowOversell).toBe(true);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'inventory.settings_updated',
        expect.objectContaining({
          variantId: 'var_test1',
          trackInventory: false,
          lowStockThreshold: 20,
          allowOversell: true,
        }),
      );
    });

    it('should throw NotFoundException for wrong store', async () => {
      mockPrisma.productVariant.findUnique.mockResolvedValue(mockVariant);

      await expect(
        service.updateSettings('wrong_store', {
          variantId: 'var_test1',
          lowStockThreshold: 20,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ===========================================================================
  // getVariantInventory Method Tests
  // ===========================================================================
  describe('getVariantInventory', () => {
    it('should return variant inventory info', async () => {
      const mockVariant = {
        id: 'var_test1',
        quantity: 50,
        trackInventory: true,
        lowStockThreshold: 10,
        allowOversell: false,
        product: { storeId: 'store_test1' },
      };

      mockPrisma.productVariant.findUnique.mockResolvedValue(mockVariant);

      const result = await service.getVariantInventory('store_test1', 'var_test1');

      expect(result.variantId).toBe('var_test1');
      expect(result.quantity).toBe(50);
      expect(result.isLowStock).toBe(false);
      expect(result.isOutOfStock).toBe(false);
    });

    it('should throw NotFoundException for non-existent variant', async () => {
      mockPrisma.productVariant.findUnique.mockResolvedValue(null);

      await expect(service.getVariantInventory('store_test1', 'non_existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ===========================================================================
  // getHistory Method Tests
  // ===========================================================================
  describe('getHistory', () => {
    const mockVariant = {
      product: { storeId: 'store_test1' },
    };

    const mockHistoryItems = [
      {
        id: 'invh_1',
        variantId: 'var_test1',
        quantityBefore: 100,
        quantityAfter: 90,
        quantityChange: -10,
        reason: 'MANUAL_ADJUSTMENT',
        note: 'Test note',
        createdById: 'user_1',
        createdBy: { name: 'Test User' },
        createdAt: new Date('2024-01-15T10:00:00Z'),
      },
    ];

    it('should return paginated history', async () => {
      mockPrisma.productVariant.findUnique.mockResolvedValue(mockVariant);
      mockPrisma.inventoryHistory.findMany.mockResolvedValue(mockHistoryItems);
      mockPrisma.inventoryHistory.count.mockResolvedValue(1);

      const result = await service.getHistory('store_test1', {
        variantId: 'var_test1',
        page: 1,
        limit: 20,
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].createdByName).toBe('Test User');
      expect(result.total).toBe(1);
      expect(result.hasMore).toBe(false);
    });

    it('should calculate hasMore correctly', async () => {
      mockPrisma.productVariant.findUnique.mockResolvedValue(mockVariant);
      mockPrisma.inventoryHistory.findMany.mockResolvedValue(mockHistoryItems);
      mockPrisma.inventoryHistory.count.mockResolvedValue(25); // More than page size

      const result = await service.getHistory('store_test1', {
        variantId: 'var_test1',
        page: 1,
        limit: 20,
      });

      expect(result.hasMore).toBe(true);
    });

    it('should throw NotFoundException for wrong store', async () => {
      mockPrisma.productVariant.findUnique.mockResolvedValue(mockVariant);

      await expect(
        service.getHistory('wrong_store', {
          variantId: 'var_test1',
          page: 1,
          limit: 20,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ===========================================================================
  // executeWithRetry Method Tests
  // ===========================================================================
  describe('executeWithRetry', () => {
    it('should retry on P2034 transaction conflict error', async () => {
      let attempts = 0;
      const p2034Error = { code: 'P2034' };

      mockPrisma.$transaction.mockImplementation(async () => {
        attempts++;
        if (attempts < 3) {
          throw p2034Error;
        }
        return { success: true };
      });

      // Access protected method
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (service as any).executeWithRetry(async () => {
        return mockPrisma.$transaction(async () => ({}));
      });

      expect(attempts).toBe(3);
    });

    it('should throw non-P2034 errors immediately', async () => {
      const otherError = new Error('Different error');

      mockPrisma.$transaction.mockRejectedValue(otherError);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect((service as any).executeWithRetry(async () => {
        return mockPrisma.$transaction(async () => ({}));
      })).rejects.toThrow('Different error');
    });
  });
});
