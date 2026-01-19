/**
 * Unit tests for ExpireReservationsJob
 *
 * Tests the reservation expiry logic that runs as a background job.
 *
 * @see Story 3.8 - Oversell Prevention (AC#10)
 */
import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ExpireReservationsJob } from '../jobs/expire-reservations.job';
import { PrismaService } from '@database/prisma.service';

describe('ExpireReservationsJob', () => {
  let job: ExpireReservationsJob;
  let mockPrisma: jest.Mocked<Partial<PrismaService>>;
  let mockEventEmitter: jest.Mocked<Partial<EventEmitter2>>;

  beforeEach(async () => {
    mockPrisma = {
      inventoryReservation: {
        findMany: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
      } as never,
    };

    mockEventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpireReservationsJob,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    job = module.get<ExpireReservationsJob>(ExpireReservationsJob);
  });

  it('should be defined', () => {
    expect(job).toBeDefined();
  });

  // ===========================================================================
  // handleExpiredReservations Method Tests
  // ===========================================================================
  describe('handleExpiredReservations', () => {
    it('should process expired reservations and emit events', async () => {
      const expiredReservations = [
        {
          id: 'invres_test1',
          storeId: 'store_test1',
          cartId: 'cart_test1',
          variantId: 'var_test1',
          quantity: 5,
        },
        {
          id: 'invres_test2',
          storeId: 'store_test1',
          cartId: 'cart_test2',
          variantId: 'var_test2',
          quantity: 3,
        },
      ];

      // First call returns expired reservations, second call returns empty
      (mockPrisma.inventoryReservation!.findMany as jest.Mock)
        .mockResolvedValueOnce(expiredReservations)
        .mockResolvedValueOnce([]);

      (mockPrisma.inventoryReservation!.updateMany as jest.Mock).mockResolvedValue({
        count: 2,
      });

      await job.handleExpiredReservations();

      // Verify findMany was called with correct params
      expect(mockPrisma.inventoryReservation!.findMany).toHaveBeenCalledWith({
        where: {
          status: 'ACTIVE',
          expiresAt: { lt: expect.any(Date) },
        },
        take: 100,
        select: {
          id: true,
          storeId: true,
          cartId: true,
          variantId: true,
          quantity: true,
        },
      });

      // Verify updateMany was called
      expect(mockPrisma.inventoryReservation!.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['invres_test1', 'invres_test2'] } },
        data: {
          status: 'EXPIRED',
          releasedAt: expect.any(Date),
        },
      });

      // Verify events were emitted for each reservation
      expect(mockEventEmitter.emit).toHaveBeenCalledTimes(2);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'inventory.reservation.expired',
        expect.objectContaining({
          reservationId: 'invres_test1',
          cartId: 'cart_test1',
          variantId: 'var_test1',
          quantity: 5,
        }),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'inventory.reservation.expired',
        expect.objectContaining({
          reservationId: 'invres_test2',
          cartId: 'cart_test2',
          variantId: 'var_test2',
          quantity: 3,
        }),
      );
    });

    it('should do nothing when no expired reservations', async () => {
      (mockPrisma.inventoryReservation!.findMany as jest.Mock).mockResolvedValue([]);

      await job.handleExpiredReservations();

      expect(mockPrisma.inventoryReservation!.updateMany).not.toHaveBeenCalled();
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      (mockPrisma.inventoryReservation!.findMany as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      // Should not throw
      await expect(job.handleExpiredReservations()).resolves.not.toThrow();
    });

    it('should process multiple batches when needed', async () => {
      // Create 100 items to trigger a second batch check
      const firstBatch = Array.from({ length: 100 }, (_, i) => ({
        id: `invres_${i}`,
        storeId: 'store_test1',
        cartId: `cart_${i}`,
        variantId: `var_${i}`,
        quantity: 1,
      }));

      const secondBatch = [
        {
          id: 'invres_remaining',
          storeId: 'store_test1',
          cartId: 'cart_remaining',
          variantId: 'var_remaining',
          quantity: 2,
        },
      ];

      (mockPrisma.inventoryReservation!.findMany as jest.Mock)
        .mockResolvedValueOnce(firstBatch)
        .mockResolvedValueOnce(secondBatch);

      (mockPrisma.inventoryReservation!.updateMany as jest.Mock).mockResolvedValue({
        count: 1,
      });

      await job.handleExpiredReservations();

      // Should have called findMany 2 times (first batch of 100 triggers second call,
      // second batch of 1 item < 100 means hasMore = false and loop ends)
      expect(mockPrisma.inventoryReservation!.findMany).toHaveBeenCalledTimes(2);

      // Should have emitted 101 events
      expect(mockEventEmitter.emit).toHaveBeenCalledTimes(101);
    });
  });

  // ===========================================================================
  // expireNow Method Tests
  // ===========================================================================
  describe('expireNow', () => {
    it('should return total count of expired reservations', async () => {
      const expiredReservations = [
        {
          id: 'invres_test1',
          storeId: 'store_test1',
          cartId: 'cart_test1',
          variantId: 'var_test1',
          quantity: 5,
        },
      ];

      (mockPrisma.inventoryReservation!.findMany as jest.Mock)
        .mockResolvedValueOnce(expiredReservations)
        .mockResolvedValueOnce([]);

      (mockPrisma.inventoryReservation!.updateMany as jest.Mock).mockResolvedValue({
        count: 1,
      });

      const result = await job.expireNow();

      expect(result).toBe(1);
    });

    it('should return 0 when no reservations to expire', async () => {
      (mockPrisma.inventoryReservation!.findMany as jest.Mock).mockResolvedValue([]);

      const result = await job.expireNow();

      expect(result).toBe(0);
    });
  });

  // ===========================================================================
  // getExpiredCount Method Tests
  // ===========================================================================
  describe('getExpiredCount', () => {
    it('should return count of expired reservations', async () => {
      (mockPrisma.inventoryReservation!.count as jest.Mock).mockResolvedValue(5);

      const result = await job.getExpiredCount();

      expect(result).toBe(5);
      expect(mockPrisma.inventoryReservation!.count).toHaveBeenCalledWith({
        where: {
          status: 'ACTIVE',
          expiresAt: { lt: expect.any(Date) },
        },
      });
    });

    it('should return 0 when no expired reservations', async () => {
      (mockPrisma.inventoryReservation!.count as jest.Mock).mockResolvedValue(0);

      const result = await job.getExpiredCount();

      expect(result).toBe(0);
    });
  });
});
