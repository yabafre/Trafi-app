/**
 * Unit tests for StoreCounterService
 *
 * Tests atomic counter operations for sequential identifiers.
 * Uses mocked Prisma client to test service logic without database.
 *
 * @see Story M-1 - V3 Architectural Retroactive Fixes (AC4)
 * @see Principle #5 - Atomic Counters (StoreCounter)
 */
import { Test, TestingModule } from '@nestjs/testing';
import { StoreCounterService } from '../store-counter.service';
import { PrismaService } from '../../prisma.service';

describe('StoreCounterService', () => {
  let service: StoreCounterService;

  const mockStoreId = 'store_test_123';

  // Mock Prisma client methods
  const mockStoreCounter = {
    upsert: jest.fn(),
    findUnique: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoreCounterService,
        {
          provide: PrismaService,
          useValue: {
            $client: {
              storeCounter: mockStoreCounter,
            },
          },
        },
      ],
    }).compile();

    service = module.get<StoreCounterService>(StoreCounterService);

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('increment()', () => {
    it('should increment counter and return new value', async () => {
      mockStoreCounter.upsert.mockResolvedValue({
        storeId: mockStoreId,
        key: 'order',
        value: BigInt(42),
      });

      const result = await service.increment(mockStoreId, 'order');

      expect(result).toBe(BigInt(42));
      expect(mockStoreCounter.upsert).toHaveBeenCalledWith({
        where: {
          storeId_key: { storeId: mockStoreId, key: 'order' },
        },
        create: {
          storeId: mockStoreId,
          key: 'order',
          value: BigInt(1),
        },
        update: {
          value: { increment: 1 },
        },
      });
    });

    it('should create counter with value 1 if not exists', async () => {
      mockStoreCounter.upsert.mockResolvedValue({
        storeId: mockStoreId,
        key: 'invoice',
        value: BigInt(1),
      });

      const result = await service.increment(mockStoreId, 'invoice');

      expect(result).toBe(BigInt(1));
    });

    it('should handle different counter types', async () => {
      const counterTypes = ['order', 'invoice', 'return', 'purchase_order'] as const;

      for (const key of counterTypes) {
        mockStoreCounter.upsert.mockResolvedValue({
          storeId: mockStoreId,
          key,
          value: BigInt(1),
        });

        await service.increment(mockStoreId, key);

        expect(mockStoreCounter.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              storeId_key: { storeId: mockStoreId, key },
            },
          }),
        );
      }
    });
  });

  describe('getCurrentValue()', () => {
    it('should return current counter value', async () => {
      mockStoreCounter.findUnique.mockResolvedValue({
        storeId: mockStoreId,
        key: 'order',
        value: BigInt(100),
      });

      const result = await service.getCurrentValue(mockStoreId, 'order');

      expect(result).toBe(BigInt(100));
    });

    it('should return 0 if counter does not exist', async () => {
      mockStoreCounter.findUnique.mockResolvedValue(null);

      const result = await service.getCurrentValue(mockStoreId, 'order');

      expect(result).toBe(BigInt(0));
    });
  });

  describe('getNextOrderNumber()', () => {
    it('should return formatted order number with current year', async () => {
      const currentYear = new Date().getFullYear();
      mockStoreCounter.upsert.mockResolvedValue({
        storeId: mockStoreId,
        key: 'order',
        value: BigInt(1),
      });

      const result = await service.getNextOrderNumber(mockStoreId);

      expect(result).toBe(`ORD-${currentYear}-000001`);
    });

    it('should return formatted order number with specified year', async () => {
      mockStoreCounter.upsert.mockResolvedValue({
        storeId: mockStoreId,
        key: 'order',
        value: BigInt(123456),
      });

      const result = await service.getNextOrderNumber(mockStoreId, 2025);

      expect(result).toBe('ORD-2025-123456');
    });

    it('should pad sequence number to 6 digits', async () => {
      mockStoreCounter.upsert.mockResolvedValue({
        storeId: mockStoreId,
        key: 'order',
        value: BigInt(42),
      });

      const result = await service.getNextOrderNumber(mockStoreId, 2026);

      expect(result).toBe('ORD-2026-000042');
    });
  });

  describe('getNextInvoiceNumber()', () => {
    it('should return formatted invoice number', async () => {
      mockStoreCounter.upsert.mockResolvedValue({
        storeId: mockStoreId,
        key: 'invoice',
        value: BigInt(999),
      });

      const result = await service.getNextInvoiceNumber(mockStoreId, 2026);

      expect(result).toBe('INV-2026-000999');
    });
  });

  describe('getNextReturnNumber()', () => {
    it('should return formatted return number', async () => {
      mockStoreCounter.upsert.mockResolvedValue({
        storeId: mockStoreId,
        key: 'return',
        value: BigInt(5),
      });

      const result = await service.getNextReturnNumber(mockStoreId, 2026);

      expect(result).toBe('RET-2026-000005');
    });
  });

  describe('getNextPurchaseOrderNumber()', () => {
    it('should return formatted purchase order number', async () => {
      mockStoreCounter.upsert.mockResolvedValue({
        storeId: mockStoreId,
        key: 'purchase_order',
        value: BigInt(50),
      });

      const result = await service.getNextPurchaseOrderNumber(mockStoreId, 2026);

      expect(result).toBe('PO-2026-000050');
    });
  });

  describe('reset()', () => {
    it('should reset counter to 0 by default', async () => {
      mockStoreCounter.upsert.mockResolvedValue({
        storeId: mockStoreId,
        key: 'order',
        value: BigInt(0),
      });

      await service.reset(mockStoreId, 'order');

      expect(mockStoreCounter.upsert).toHaveBeenCalledWith({
        where: {
          storeId_key: { storeId: mockStoreId, key: 'order' },
        },
        create: {
          storeId: mockStoreId,
          key: 'order',
          value: BigInt(0),
        },
        update: {
          value: BigInt(0),
        },
      });
    });

    it('should reset counter to specified value', async () => {
      mockStoreCounter.upsert.mockResolvedValue({
        storeId: mockStoreId,
        key: 'order',
        value: BigInt(1000),
      });

      await service.reset(mockStoreId, 'order', BigInt(1000));

      expect(mockStoreCounter.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: {
            value: BigInt(1000),
          },
        }),
      );
    });
  });

  describe('Concurrent Increment Safety', () => {
    it('should use atomic upsert to prevent duplicate values', async () => {
      // This test verifies the service uses the correct atomic pattern
      // Actual concurrency testing would require integration tests

      mockStoreCounter.upsert.mockResolvedValue({
        storeId: mockStoreId,
        key: 'order',
        value: BigInt(1),
      });

      await service.increment(mockStoreId, 'order');

      // Verify atomic operation is used
      const upsertCall = mockStoreCounter.upsert.mock.calls[0][0];
      expect(upsertCall.update).toEqual({ value: { increment: 1 } });

      // The atomic increment ensures database-level atomicity
      // This prevents the race condition:
      // Thread 1: read(5) -> write(6)
      // Thread 2: read(5) -> write(6) <- DUPLICATE!
      //
      // With atomic increment:
      // Thread 1: increment() -> 5
      // Thread 2: increment() -> 6 <- CORRECT
    });
  });

  describe('Tenant Isolation', () => {
    it('should scope counters to specific store', async () => {
      const store1 = 'store_1';
      const store2 = 'store_2';

      mockStoreCounter.upsert.mockResolvedValue({
        storeId: store1,
        key: 'order',
        value: BigInt(100),
      });

      await service.increment(store1, 'order');

      expect(mockStoreCounter.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            storeId_key: { storeId: store1, key: 'order' },
          },
        }),
      );

      mockStoreCounter.upsert.mockResolvedValue({
        storeId: store2,
        key: 'order',
        value: BigInt(1), // Different store starts fresh
      });

      await service.increment(store2, 'order');

      expect(mockStoreCounter.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            storeId_key: { storeId: store2, key: 'order' },
          },
        }),
      );
    });
  });
});
