/**
 * Unit tests for DomainEventService
 *
 * Tests the transactional outbox pattern for reliable async operations.
 * Uses mocked Prisma client to test service logic without database.
 *
 * @see Story M-1 - V3 Architectural Retroactive Fixes (AC5)
 * @see Principle #6 - Outbox Pattern (DomainEvent)
 */
import { Test, TestingModule } from '@nestjs/testing';
import { DomainEventService } from '../domain-event.service';
import { PrismaService } from '../../prisma.service';

describe('DomainEventService', () => {
  let service: DomainEventService;

  const mockStoreId = 'store_test_123';

  // Mock Prisma client methods
  const mockDomainEvent = {
    create: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    deleteMany: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: DomainEventService,
          useFactory: (prisma: PrismaService) => new DomainEventService(prisma, 5),
          inject: [PrismaService],
        },
        {
          provide: PrismaService,
          useValue: {
            $client: {
              domainEvent: mockDomainEvent,
            },
          },
        },
      ],
    }).compile();

    service = module.get<DomainEventService>(DomainEventService);

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('emit()', () => {
    it('should create a PENDING event', async () => {
      const expectedEvent = {
        id: 'evt_123',
        storeId: mockStoreId,
        type: 'order.created',
        payload: { orderId: 'order_456' },
        status: 'PENDING',
        attempts: 0,
        createdAt: new Date(),
        processedAt: null,
        errorMessage: null,
      };

      mockDomainEvent.create.mockResolvedValue(expectedEvent);

      const result = await service.emit(mockStoreId, 'order.created', { orderId: 'order_456' });

      expect(result).toEqual(expectedEvent);
      expect(mockDomainEvent.create).toHaveBeenCalledWith({
        data: {
          storeId: mockStoreId,
          type: 'order.created',
          payload: { orderId: 'order_456' },
          status: 'PENDING',
          attempts: 0,
        },
      });
    });

    it('should emit different event types', async () => {
      const eventTypes = ['order.created', 'payment.succeeded', 'customer.registered'];

      for (const type of eventTypes) {
        mockDomainEvent.create.mockResolvedValue({
          id: 'evt_123',
          storeId: mockStoreId,
          type,
          payload: {},
          status: 'PENDING',
          attempts: 0,
        });

        await service.emit(mockStoreId, type, {});

        expect(mockDomainEvent.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ type }),
          }),
        );
      }
    });
  });

  describe('claim()', () => {
    it('should claim the oldest pending event', async () => {
      const pendingEvent = {
        id: 'evt_123',
        storeId: mockStoreId,
        type: 'order.created',
        payload: {},
        status: 'PENDING',
        attempts: 0,
        createdAt: new Date(),
      };

      const claimedEvent = {
        ...pendingEvent,
        status: 'PROCESSING',
        attempts: 1,
      };

      mockDomainEvent.findFirst.mockResolvedValue(pendingEvent);
      mockDomainEvent.update.mockResolvedValue(claimedEvent);

      const result = await service.claim();

      expect(result).toEqual(claimedEvent);
      expect(mockDomainEvent.update).toHaveBeenCalledWith({
        where: {
          id: 'evt_123',
          status: 'PENDING',
        },
        data: {
          status: 'PROCESSING',
          attempts: { increment: 1 },
        },
      });
    });

    it('should return null when no pending events', async () => {
      mockDomainEvent.findFirst.mockResolvedValue(null);

      const result = await service.claim();

      expect(result).toBeNull();
    });

    it('should return null when another worker claims first', async () => {
      const pendingEvent = {
        id: 'evt_123',
        status: 'PENDING',
      };

      mockDomainEvent.findFirst.mockResolvedValue(pendingEvent);
      // Simulate another worker claiming the event first
      mockDomainEvent.update.mockRejectedValue(new Error('Record not found'));

      const result = await service.claim();

      expect(result).toBeNull();
    });

    it('should filter by storeId when provided', async () => {
      mockDomainEvent.findFirst.mockResolvedValue(null);

      await service.claim(mockStoreId);

      expect(mockDomainEvent.findFirst).toHaveBeenCalledWith({
        where: {
          status: 'PENDING',
          storeId: mockStoreId,
        },
        orderBy: { createdAt: 'asc' },
      });
    });
  });

  describe('complete()', () => {
    it('should mark event as PROCESSED', async () => {
      const completedEvent = {
        id: 'evt_123',
        status: 'PROCESSED',
        processedAt: new Date(),
        errorMessage: null,
      };

      mockDomainEvent.update.mockResolvedValue(completedEvent);

      const result = await service.complete('evt_123');

      expect(result.status).toBe('PROCESSED');
      expect(result.processedAt).toBeDefined();
      expect(mockDomainEvent.update).toHaveBeenCalledWith({
        where: { id: 'evt_123' },
        data: {
          status: 'PROCESSED',
          processedAt: expect.any(Date),
          errorMessage: null,
        },
      });
    });
  });

  describe('fail()', () => {
    it('should mark event as FAILED when under max attempts', async () => {
      const currentEvent = {
        id: 'evt_123',
        attempts: 2,
        status: 'PROCESSING',
      };

      const failedEvent = {
        ...currentEvent,
        status: 'FAILED',
        errorMessage: 'Connection timeout',
      };

      mockDomainEvent.findUnique.mockResolvedValue(currentEvent);
      mockDomainEvent.update.mockResolvedValue(failedEvent);

      const result = await service.fail('evt_123', 'Connection timeout');

      expect(result.status).toBe('FAILED');
      expect(result.errorMessage).toBe('Connection timeout');
    });

    it('should move to DEAD_LETTER after max attempts', async () => {
      const currentEvent = {
        id: 'evt_123',
        attempts: 5, // At max attempts
        status: 'PROCESSING',
      };

      const deadLetterEvent = {
        ...currentEvent,
        status: 'DEAD_LETTER',
        errorMessage: 'Max retries exceeded',
      };

      mockDomainEvent.findUnique.mockResolvedValue(currentEvent);
      mockDomainEvent.update.mockResolvedValue(deadLetterEvent);

      const result = await service.fail('evt_123', 'Max retries exceeded');

      expect(result.status).toBe('DEAD_LETTER');
    });

    it('should throw error for non-existent event', async () => {
      mockDomainEvent.findUnique.mockResolvedValue(null);

      await expect(service.fail('evt_nonexistent', 'Error')).rejects.toThrow(
        'Event not found: evt_nonexistent',
      );
    });
  });

  describe('retry()', () => {
    it('should return event to PENDING status', async () => {
      const retriedEvent = {
        id: 'evt_123',
        status: 'PENDING',
        errorMessage: null,
      };

      mockDomainEvent.update.mockResolvedValue(retriedEvent);

      const result = await service.retry('evt_123');

      expect(result.status).toBe('PENDING');
      expect(result.errorMessage).toBeNull();
    });

    it('should clear previous error message on retry', async () => {
      const retriedEvent = {
        id: 'evt_123',
        status: 'PENDING',
        errorMessage: null,
      };

      mockDomainEvent.update.mockResolvedValue(retriedEvent);

      await service.retry('evt_123');

      expect(mockDomainEvent.update).toHaveBeenCalledWith({
        where: { id: 'evt_123' },
        data: {
          status: 'PENDING',
          errorMessage: null,
        },
      });
    });

    it('should allow retrying FAILED events', async () => {
      const failedEvent = {
        id: 'evt_failed',
        status: 'FAILED',
        errorMessage: 'Previous error',
        attempts: 3,
      };

      const retriedEvent = {
        ...failedEvent,
        status: 'PENDING',
        errorMessage: null,
      };

      mockDomainEvent.update.mockResolvedValue(retriedEvent);

      const result = await service.retry('evt_failed');

      expect(result.status).toBe('PENDING');
    });

    it('should allow retrying DEAD_LETTER events', async () => {
      const deadLetterEvent = {
        id: 'evt_dead',
        status: 'DEAD_LETTER',
        errorMessage: 'Max retries exceeded',
        attempts: 5,
      };

      const retriedEvent = {
        ...deadLetterEvent,
        status: 'PENDING',
        errorMessage: null,
      };

      mockDomainEvent.update.mockResolvedValue(retriedEvent);

      const result = await service.retry('evt_dead');

      expect(result.status).toBe('PENDING');
      // Note: attempts counter is NOT reset, allowing tracking of total attempts
    });
  });

  describe('getPendingCount()', () => {
    it('should return count of pending events', async () => {
      mockDomainEvent.count.mockResolvedValue(42);

      const result = await service.getPendingCount();

      expect(result).toBe(42);
      expect(mockDomainEvent.count).toHaveBeenCalledWith({
        where: { status: 'PENDING' },
      });
    });

    it('should filter by storeId when provided', async () => {
      mockDomainEvent.count.mockResolvedValue(10);

      await service.getPendingCount(mockStoreId);

      expect(mockDomainEvent.count).toHaveBeenCalledWith({
        where: { status: 'PENDING', storeId: mockStoreId },
      });
    });
  });

  describe('getDeadLetterEvents()', () => {
    it('should return dead letter events', async () => {
      const deadLetterEvents = [
        { id: 'evt_1', status: 'DEAD_LETTER' },
        { id: 'evt_2', status: 'DEAD_LETTER' },
      ];

      mockDomainEvent.findMany.mockResolvedValue(deadLetterEvents);

      const result = await service.getDeadLetterEvents();

      expect(result).toEqual(deadLetterEvents);
      expect(mockDomainEvent.findMany).toHaveBeenCalledWith({
        where: { status: 'DEAD_LETTER' },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    });
  });

  describe('purgeOldEvents()', () => {
    it('should delete old processed events', async () => {
      mockDomainEvent.deleteMany.mockResolvedValue({ count: 50 });

      const olderThan = new Date('2025-01-01');
      const result = await service.purgeOldEvents(olderThan);

      expect(result).toBe(50);
      expect(mockDomainEvent.deleteMany).toHaveBeenCalledWith({
        where: {
          status: 'PROCESSED',
          processedAt: { lt: olderThan },
        },
      });
    });
  });

  describe('Outbox Pattern Reliability', () => {
    it('should document the transactional outbox pattern', () => {
      // This test documents the expected behavior of the outbox pattern:

      // 1. Events are written to database as part of main transaction
      // emit() creates PENDING events - if transaction rolls back, event is lost (correct behavior)

      // 2. Workers poll for PENDING events
      // claim() atomically moves to PROCESSING to prevent double-processing

      // 3. After processing, events are marked complete or failed
      // complete() sets PROCESSED, fail() sets FAILED or DEAD_LETTER

      // 4. Dead letter queue for investigation
      // After max attempts, events go to DEAD_LETTER for manual review

      // This pattern ensures:
      // - No lost events on crash (persisted in DB)
      // - No duplicate processing (atomic claim)
      // - Retry with backoff (attempts counter)
      // - Investigation for failures (dead letter)

      expect(true).toBe(true);
    });
  });

  describe('Event Lifecycle', () => {
    it('should demonstrate full event lifecycle', async () => {
      // Step 1: Emit event
      const emittedEvent = {
        id: 'evt_lifecycle',
        status: 'PENDING',
        attempts: 0,
      };
      mockDomainEvent.create.mockResolvedValue(emittedEvent);

      const event = await service.emit(mockStoreId, 'test.event', { data: 'test' });
      expect(event.status).toBe('PENDING');

      // Step 2: Claim event
      mockDomainEvent.findFirst.mockResolvedValue(emittedEvent);
      mockDomainEvent.update.mockResolvedValue({
        ...emittedEvent,
        status: 'PROCESSING',
        attempts: 1,
      });

      const claimed = await service.claim();
      expect(claimed?.status).toBe('PROCESSING');

      // Step 3: Complete event
      mockDomainEvent.update.mockResolvedValue({
        ...emittedEvent,
        status: 'PROCESSED',
        processedAt: new Date(),
      });

      const completed = await service.complete('evt_lifecycle');
      expect(completed.status).toBe('PROCESSED');
    });
  });
});
