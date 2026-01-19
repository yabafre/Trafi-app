import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CartValidationService } from '../cart-validation.service';
import { PrismaService } from '@database/prisma.service';

/**
 * CartValidationService Unit Tests
 *
 * Comprehensive tests for cart validation and inventory reservation.
 *
 * @see Story 3.8 - Oversell Prevention
 */
describe('CartValidationService', () => {
  let service: CartValidationService;
  let mockPrisma: {
    productVariant: { findFirst: jest.Mock; findUnique: jest.Mock };
    inventoryReservation: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
      aggregate: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let mockEventEmitter: { emit: jest.Mock };

  beforeEach(async () => {
    mockPrisma = {
      productVariant: { findFirst: jest.fn(), findUnique: jest.fn() },
      inventoryReservation: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        aggregate: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    mockEventEmitter = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartValidationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<CartValidationService>(CartValidationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ===========================================================================
  // getAvailableStock Method Tests
  // ===========================================================================
  describe('getAvailableStock', () => {
    const mockVariant = {
      id: 'var_test1',
      quantity: 100,
      trackInventory: true,
      allowOversell: false,
    };

    it('should return available stock (physical - reserved)', async () => {
      mockPrisma.productVariant.findFirst.mockResolvedValue(mockVariant);
      mockPrisma.inventoryReservation.aggregate.mockResolvedValue({
        _sum: { quantity: 30 },
      });

      const result = await service.getAvailableStock('store_test1', 'var_test1');

      expect(result.physicalQuantity).toBe(100);
      expect(result.reservedQuantity).toBe(30);
      expect(result.availableQuantity).toBe(70);
      expect(result.trackInventory).toBe(true);
    });

    it('should return unlimited when trackInventory is false', async () => {
      mockPrisma.productVariant.findFirst.mockResolvedValue({
        ...mockVariant,
        trackInventory: false,
      });

      const result = await service.getAvailableStock('store_test1', 'var_test1');

      expect(result.availableQuantity).toBe(Number.MAX_SAFE_INTEGER);
      expect(result.trackInventory).toBe(false);
    });

    it('should return 0 reserved when no active reservations', async () => {
      mockPrisma.productVariant.findFirst.mockResolvedValue(mockVariant);
      mockPrisma.inventoryReservation.aggregate.mockResolvedValue({
        _sum: { quantity: null },
      });

      const result = await service.getAvailableStock('store_test1', 'var_test1');

      expect(result.reservedQuantity).toBe(0);
      expect(result.availableQuantity).toBe(100);
    });

    it('should return 0 available when fully reserved', async () => {
      mockPrisma.productVariant.findFirst.mockResolvedValue(mockVariant);
      mockPrisma.inventoryReservation.aggregate.mockResolvedValue({
        _sum: { quantity: 100 },
      });

      const result = await service.getAvailableStock('store_test1', 'var_test1');

      expect(result.availableQuantity).toBe(0);
    });

    it('should throw NotFoundException for non-existent variant', async () => {
      mockPrisma.productVariant.findFirst.mockResolvedValue(null);

      await expect(
        service.getAvailableStock('store_test1', 'non_existent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ===========================================================================
  // checkAvailability Method Tests
  // ===========================================================================
  describe('checkAvailability', () => {
    const mockVariant = {
      id: 'var_test1',
      quantity: 100,
      trackInventory: true,
      allowOversell: false,
    };

    it('should return available=true when sufficient stock', async () => {
      mockPrisma.productVariant.findFirst.mockResolvedValue(mockVariant);
      mockPrisma.inventoryReservation.aggregate.mockResolvedValue({
        _sum: { quantity: 30 },
      });

      const result = await service.checkAvailability('store_test1', {
        variantId: 'var_test1',
        requestedQuantity: 50,
      });

      expect(result.available).toBe(true);
      expect(result.availableQuantity).toBe(70);
    });

    it('should return available=false when insufficient stock', async () => {
      mockPrisma.productVariant.findFirst.mockResolvedValue(mockVariant);
      mockPrisma.inventoryReservation.aggregate.mockResolvedValue({
        _sum: { quantity: 80 },
      });

      const result = await service.checkAvailability('store_test1', {
        variantId: 'var_test1',
        requestedQuantity: 50,
      });

      expect(result.available).toBe(false);
      expect(result.availableQuantity).toBe(20);
    });

    it('should return available=true when trackInventory is false', async () => {
      mockPrisma.productVariant.findFirst.mockResolvedValue({
        ...mockVariant,
        trackInventory: false,
      });

      const result = await service.checkAvailability('store_test1', {
        variantId: 'var_test1',
        requestedQuantity: 1000,
      });

      expect(result.available).toBe(true);
      expect(result.trackInventory).toBe(false);
    });

    it('should return available=true when allowOversell is true', async () => {
      mockPrisma.productVariant.findFirst.mockResolvedValue({
        ...mockVariant,
        allowOversell: true,
      });

      const result = await service.checkAvailability('store_test1', {
        variantId: 'var_test1',
        requestedQuantity: 1000,
      });

      expect(result.available).toBe(true);
      expect(result.allowOversell).toBe(true);
    });

    it('should return available=false for non-existent variant', async () => {
      mockPrisma.productVariant.findFirst.mockResolvedValue(null);

      const result = await service.checkAvailability('store_test1', {
        variantId: 'non_existent',
        requestedQuantity: 1,
      });

      expect(result.available).toBe(false);
      expect(result.availableQuantity).toBe(0);
    });
  });

  // ===========================================================================
  // validateCartItems Method Tests
  // ===========================================================================
  describe('validateCartItems', () => {
    it('should return valid=true when all items available', async () => {
      mockPrisma.productVariant.findFirst.mockResolvedValue({
        id: 'var_test1',
        quantity: 100,
        trackInventory: true,
        allowOversell: false,
      });
      mockPrisma.inventoryReservation.aggregate.mockResolvedValue({
        _sum: { quantity: 0 },
      });

      const result = await service.validateCartItems('store_test1', [
        { variantId: 'var_test1', quantity: 5 },
      ]);

      expect(result.valid).toBe(true);
      expect(result.adjustments[0].adjusted).toBe(false);
      expect(result.outOfStockItems).toHaveLength(0);
    });

    it('should return adjustment for partial availability', async () => {
      mockPrisma.productVariant.findFirst.mockResolvedValue({
        id: 'var_test1',
        quantity: 10,
        trackInventory: true,
        allowOversell: false,
      });
      mockPrisma.inventoryReservation.aggregate.mockResolvedValue({
        _sum: { quantity: 5 },
      });

      const result = await service.validateCartItems('store_test1', [
        { variantId: 'var_test1', quantity: 10 }, // Only 5 available
      ]);

      expect(result.valid).toBe(false);
      expect(result.adjustments[0].adjusted).toBe(true);
      expect(result.adjustments[0].availableQuantity).toBe(5);
      expect(result.outOfStockItems).toHaveLength(0);
    });

    it('should return out of stock for zero availability', async () => {
      mockPrisma.productVariant.findFirst.mockResolvedValue({
        id: 'var_test1',
        quantity: 10,
        trackInventory: true,
        allowOversell: false,
      });
      mockPrisma.inventoryReservation.aggregate.mockResolvedValue({
        _sum: { quantity: 10 },
      });

      const result = await service.validateCartItems('store_test1', [
        { variantId: 'var_test1', quantity: 5 },
      ]);

      expect(result.valid).toBe(false);
      expect(result.adjustments[0].adjusted).toBe(true);
      expect(result.outOfStockItems).toContain('var_test1');
    });

    it('should validate multiple items', async () => {
      mockPrisma.productVariant.findFirst
        .mockResolvedValueOnce({
          id: 'var_1',
          quantity: 100,
          trackInventory: true,
          allowOversell: false,
        })
        .mockResolvedValueOnce({
          id: 'var_1',
          quantity: 100,
          trackInventory: true,
          allowOversell: false,
        })
        .mockResolvedValueOnce({
          id: 'var_2',
          quantity: 5,
          trackInventory: true,
          allowOversell: false,
        })
        .mockResolvedValueOnce({
          id: 'var_2',
          quantity: 5,
          trackInventory: true,
          allowOversell: false,
        });

      mockPrisma.inventoryReservation.aggregate.mockResolvedValue({
        _sum: { quantity: 0 },
      });

      const result = await service.validateCartItems('store_test1', [
        { variantId: 'var_1', quantity: 10 },
        { variantId: 'var_2', quantity: 3 },
      ]);

      expect(result.adjustments).toHaveLength(2);
    });
  });

  // ===========================================================================
  // createReservation Method Tests
  // ===========================================================================
  describe('createReservation', () => {
    const mockVariant = {
      quantity: 100,
      trackInventory: true,
      allowOversell: false,
    };

    const mockReservation = {
      id: 'invres_test1',
      storeId: 'store_test1',
      cartId: 'cart_test1',
      variantId: 'var_test1',
      quantity: 5,
      status: 'ACTIVE',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      createdAt: new Date(),
      releasedAt: null,
    };

    it('should create new reservation', async () => {
      mockPrisma.$transaction.mockImplementation(async (fn) => {
        const mockTx = {
          inventoryReservation: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue(mockReservation),
            aggregate: jest.fn().mockResolvedValue({ _sum: { quantity: 0 } }),
          },
          productVariant: {
            findFirst: jest.fn().mockResolvedValue(mockVariant),
          },
        };
        return fn(mockTx);
      });

      const result = await service.createReservation({
        storeId: 'store_test1',
        cartId: 'cart_test1',
        variantId: 'var_test1',
        quantity: 5,
        expiresInMinutes: 15,
      });

      expect(result.id).toBe('invres_test1');
      expect(result.status).toBe('ACTIVE');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'inventory.reserved',
        expect.objectContaining({
          cartId: 'cart_test1',
          variantId: 'var_test1',
          quantity: 5,
        }),
      );
    });

    it('should update existing active reservation', async () => {
      const existingReservation = { ...mockReservation, quantity: 3 };
      const updatedReservation = { ...mockReservation, quantity: 8 };

      mockPrisma.$transaction.mockImplementation(async (fn) => {
        const mockTx = {
          inventoryReservation: {
            findUnique: jest.fn().mockResolvedValue(existingReservation),
            update: jest.fn().mockResolvedValue(updatedReservation),
          },
        };
        return fn(mockTx);
      });

      const result = await service.createReservation({
        storeId: 'store_test1',
        cartId: 'cart_test1',
        variantId: 'var_test1',
        quantity: 8,
        expiresInMinutes: 15,
      });

      expect(result.quantity).toBe(8);
    });

    it('should throw BadRequestException when insufficient stock', async () => {
      mockPrisma.$transaction.mockImplementation(async (fn) => {
        const mockTx = {
          inventoryReservation: {
            findUnique: jest.fn().mockResolvedValue(null),
            aggregate: jest.fn().mockResolvedValue({ _sum: { quantity: 90 } }),
          },
          productVariant: {
            findFirst: jest.fn().mockResolvedValue(mockVariant),
          },
        };
        return fn(mockTx);
      });

      await expect(
        service.createReservation({
          storeId: 'store_test1',
          cartId: 'cart_test1',
          variantId: 'var_test1',
          quantity: 20, // Only 10 available
          expiresInMinutes: 15,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow reservation when allowOversell is true', async () => {
      const oversellVariant = { ...mockVariant, allowOversell: true };

      mockPrisma.$transaction.mockImplementation(async (fn) => {
        const mockTx = {
          inventoryReservation: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue(mockReservation),
          },
          productVariant: {
            findFirst: jest.fn().mockResolvedValue(oversellVariant),
          },
        };
        return fn(mockTx);
      });

      const result = await service.createReservation({
        storeId: 'store_test1',
        cartId: 'cart_test1',
        variantId: 'var_test1',
        quantity: 1000,
        expiresInMinutes: 15,
      });

      expect(result.id).toBeDefined();
    });

    it('should throw NotFoundException for non-existent variant', async () => {
      mockPrisma.$transaction.mockImplementation(async (fn) => {
        const mockTx = {
          inventoryReservation: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
          productVariant: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
        };
        return fn(mockTx);
      });

      await expect(
        service.createReservation({
          storeId: 'store_test1',
          cartId: 'cart_test1',
          variantId: 'non_existent',
          quantity: 5,
          expiresInMinutes: 15,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ===========================================================================
  // releaseReservation Method Tests
  // ===========================================================================
  describe('releaseReservation', () => {
    const mockReservation = {
      id: 'invres_test1',
      storeId: 'store_test1',
      cartId: 'cart_test1',
      variantId: 'var_test1',
      quantity: 5,
      status: 'ACTIVE',
      expiresAt: new Date(),
      createdAt: new Date(),
      releasedAt: null,
    };

    it('should release reservation as RELEASED', async () => {
      const releasedReservation = {
        ...mockReservation,
        status: 'RELEASED',
        releasedAt: new Date(),
      };

      mockPrisma.inventoryReservation.findFirst.mockResolvedValue(mockReservation);
      mockPrisma.inventoryReservation.update.mockResolvedValue(releasedReservation);

      const result = await service.releaseReservation('store_test1', {
        cartId: 'cart_test1',
        variantId: 'var_test1',
        reason: 'RELEASED',
      });

      expect(result.status).toBe('RELEASED');
      expect(result.releasedAt).not.toBeNull();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'inventory.reservation.released',
        expect.objectContaining({
          reason: 'RELEASED',
        }),
      );
    });

    it('should release reservation as EXPIRED', async () => {
      const expiredReservation = {
        ...mockReservation,
        status: 'EXPIRED',
        releasedAt: new Date(),
      };

      mockPrisma.inventoryReservation.findFirst.mockResolvedValue(mockReservation);
      mockPrisma.inventoryReservation.update.mockResolvedValue(expiredReservation);

      const result = await service.releaseReservation('store_test1', {
        cartId: 'cart_test1',
        variantId: 'var_test1',
        reason: 'EXPIRED',
      });

      expect(result.status).toBe('EXPIRED');
    });

    it('should throw NotFoundException for non-existent reservation', async () => {
      mockPrisma.inventoryReservation.findFirst.mockResolvedValue(null);

      await expect(
        service.releaseReservation('store_test1', {
          cartId: 'cart_test1',
          variantId: 'var_test1',
          reason: 'RELEASED',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ===========================================================================
  // releaseCartReservations Method Tests
  // ===========================================================================
  describe('releaseCartReservations', () => {
    it('should release all cart reservations', async () => {
      const mockReservations = [
        { id: 'invres_1', variantId: 'var_1', quantity: 5 },
        { id: 'invres_2', variantId: 'var_2', quantity: 3 },
      ];

      mockPrisma.inventoryReservation.findMany.mockResolvedValue(mockReservations);
      mockPrisma.inventoryReservation.updateMany.mockResolvedValue({ count: 2 });

      const count = await service.releaseCartReservations(
        'store_test1',
        'cart_test1',
        'RELEASED',
      );

      expect(count).toBe(2);
      expect(mockEventEmitter.emit).toHaveBeenCalledTimes(2);
    });

    it('should return 0 when no reservations exist', async () => {
      mockPrisma.inventoryReservation.findMany.mockResolvedValue([]);

      const count = await service.releaseCartReservations(
        'store_test1',
        'cart_test1',
        'RELEASED',
      );

      expect(count).toBe(0);
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // getCartReservations Method Tests
  // ===========================================================================
  describe('getCartReservations', () => {
    it('should return all active reservations for cart', async () => {
      const mockReservations = [
        {
          id: 'invres_1',
          storeId: 'store_test1',
          cartId: 'cart_test1',
          variantId: 'var_1',
          quantity: 5,
          status: 'ACTIVE',
          expiresAt: new Date(),
          createdAt: new Date(),
          releasedAt: null,
        },
      ];

      mockPrisma.inventoryReservation.findMany.mockResolvedValue(mockReservations);

      const result = await service.getCartReservations('store_test1', 'cart_test1');

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('ACTIVE');
    });

    it('should return empty array when no reservations', async () => {
      mockPrisma.inventoryReservation.findMany.mockResolvedValue([]);

      const result = await service.getCartReservations('store_test1', 'cart_test1');

      expect(result).toHaveLength(0);
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
      await expect(
        (service as any).executeWithRetry(async () => {
          return mockPrisma.$transaction(async () => ({}));
        }),
      ).rejects.toThrow('Different error');
    });
  });

  // ===========================================================================
  // toInventoryReservation Helper Method Tests
  // ===========================================================================
  describe('toInventoryReservation', () => {
    it('should convert Prisma reservation to response type', () => {
      const prismaReservation = {
        id: 'invres_test1',
        storeId: 'store_test1',
        cartId: 'cart_test1',
        variantId: 'var_test1',
        quantity: 5,
        status: 'ACTIVE' as const,
        expiresAt: new Date('2024-01-15T10:00:00Z'),
        createdAt: new Date('2024-01-15T09:00:00Z'),
        releasedAt: null,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (service as any).toInventoryReservation(prismaReservation);

      expect(result.id).toBe('invres_test1');
      expect(result.status).toBe('ACTIVE');
      expect(result.expiresAt).toBe('2024-01-15T10:00:00.000Z');
      expect(result.createdAt).toBe('2024-01-15T09:00:00.000Z');
      expect(result.releasedAt).toBeNull();
    });

    it('should handle releasedAt when set', () => {
      const prismaReservation = {
        id: 'invres_test1',
        storeId: 'store_test1',
        cartId: 'cart_test1',
        variantId: 'var_test1',
        quantity: 5,
        status: 'RELEASED' as const,
        expiresAt: new Date('2024-01-15T10:00:00Z'),
        createdAt: new Date('2024-01-15T09:00:00Z'),
        releasedAt: new Date('2024-01-15T09:30:00Z'),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (service as any).toInventoryReservation(prismaReservation);

      expect(result.releasedAt).toBe('2024-01-15T09:30:00.000Z');
    });
  });
});
