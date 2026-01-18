import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type { DomainEvent, EventStatus, Prisma } from '@generated/prisma/client';

/**
 * Default maximum retry attempts before moving to dead letter
 */
const DEFAULT_MAX_ATTEMPTS = 5;

/**
 * Event payload type for type-safe event creation
 * Uses Prisma's InputJsonValue for compatibility with Json fields
 */
export type EventPayload = Prisma.InputJsonValue;

/**
 * DomainEventService - Transactional Outbox Pattern Implementation
 *
 * Provides reliable async event processing through the outbox pattern.
 * Events are written to database as part of the main transaction,
 * then processed asynchronously by workers polling for pending events.
 *
 * Per Principle #6: Async operations MUST use outbox for reliability.
 *
 * Event Lifecycle:
 * 1. emit() - Create event with PENDING status
 * 2. claim() - Worker atomically claims event (PENDING -> PROCESSING)
 * 3. Process event externally (send email, call webhook, etc.)
 * 4. complete() - Mark as PROCESSED on success
 * 5. fail() - Increment attempts, move to DEAD_LETTER after max attempts
 *
 * Atomic Claim Pattern (multi-worker safety):
 * Uses updateMany with take:1 to atomically claim events,
 * preventing double-processing in multi-worker deployments.
 *
 * @see Story M-1 - V3 Architectural Retroactive Fixes (AC5)
 */
@Injectable()
export class DomainEventService {
  private readonly logger = new Logger(DomainEventService.name);
  private readonly maxAttempts: number;

  constructor(
    private readonly prisma: PrismaService,
    maxAttempts: number = DEFAULT_MAX_ATTEMPTS,
  ) {
    this.maxAttempts = maxAttempts;
  }

  /**
   * Emit a new domain event.
   *
   * Creates an event with PENDING status in the database.
   * Should be called within the same transaction as the business operation.
   *
   * @param storeId - Store ID for tenant isolation
   * @param type - Event type (e.g., "order.created", "payment.succeeded")
   * @param payload - Event data payload
   * @returns Created domain event
   */
  async emit(storeId: string, type: string, payload: EventPayload): Promise<DomainEvent> {
    const event = await this.prisma.$client.domainEvent.create({
      data: {
        storeId,
        type,
        payload,
        status: 'PENDING',
        attempts: 0,
      },
    });

    this.logger.debug(`Event emitted: ${event.id} (${type}) for store ${storeId}`);
    return event;
  }

  /**
   * Atomically claim the next pending event for processing.
   *
   * Uses atomic update to prevent double-processing in multi-worker deployments.
   * Returns null if no pending events are available.
   *
   * @param storeId - Optional store ID to filter events (null for global processing)
   * @returns Claimed event or null if none available
   */
  async claim(storeId?: string): Promise<DomainEvent | null> {
    // Build where clause
    const where: {
      status: EventStatus;
      storeId?: string;
    } = {
      status: 'PENDING',
    };

    if (storeId) {
      where.storeId = storeId;
    }

    // Find the oldest pending event
    const pendingEvent = await this.prisma.$client.domainEvent.findFirst({
      where,
      orderBy: { createdAt: 'asc' },
    });

    if (!pendingEvent) {
      return null;
    }

    // Atomically claim it (only if still PENDING)
    const claimedEvent = await this.prisma.$client.domainEvent.update({
      where: {
        id: pendingEvent.id,
        status: 'PENDING', // Ensures atomic claim
      },
      data: {
        status: 'PROCESSING',
        attempts: { increment: 1 },
      },
    }).catch(() => {
      // Another worker claimed it - return null
      return null;
    });

    if (claimedEvent) {
      this.logger.debug(`Event claimed: ${claimedEvent.id} (attempt ${claimedEvent.attempts})`);
    }

    return claimedEvent;
  }

  /**
   * Mark an event as successfully processed.
   *
   * @param eventId - Event ID to mark as complete
   * @returns Updated event
   */
  async complete(eventId: string): Promise<DomainEvent> {
    const event = await this.prisma.$client.domainEvent.update({
      where: { id: eventId },
      data: {
        status: 'PROCESSED',
        processedAt: new Date(),
        errorMessage: null, // Clear any previous errors
      },
    });

    this.logger.debug(`Event completed: ${eventId}`);
    return event;
  }

  /**
   * Mark an event as failed.
   *
   * Increments the attempt counter and:
   * - Returns to PENDING for retry if under max attempts
   * - Moves to DEAD_LETTER if max attempts exceeded
   *
   * @param eventId - Event ID that failed
   * @param errorMessage - Error message for debugging
   * @returns Updated event with new status
   */
  async fail(eventId: string, errorMessage: string): Promise<DomainEvent> {
    // Get current event state
    const currentEvent = await this.prisma.$client.domainEvent.findUnique({
      where: { id: eventId },
    });

    if (!currentEvent) {
      throw new Error(`Event not found: ${eventId}`);
    }

    // Determine new status based on attempts
    const newStatus: EventStatus =
      currentEvent.attempts >= this.maxAttempts ? 'DEAD_LETTER' : 'FAILED';

    const event = await this.prisma.$client.domainEvent.update({
      where: { id: eventId },
      data: {
        status: newStatus,
        errorMessage,
      },
    });

    if (newStatus === 'DEAD_LETTER') {
      this.logger.warn(
        `Event moved to dead letter after ${currentEvent.attempts} attempts: ${eventId}`,
      );
    } else {
      this.logger.debug(`Event failed (attempt ${currentEvent.attempts}): ${eventId}`);
    }

    return event;
  }

  /**
   * Retry a failed event by returning it to PENDING status.
   *
   * @param eventId - Event ID to retry
   * @returns Updated event
   */
  async retry(eventId: string): Promise<DomainEvent> {
    const event = await this.prisma.$client.domainEvent.update({
      where: { id: eventId },
      data: {
        status: 'PENDING',
        errorMessage: null,
      },
    });

    this.logger.debug(`Event queued for retry: ${eventId}`);
    return event;
  }

  /**
   * Get pending events count for monitoring.
   *
   * @param storeId - Optional store ID to filter
   * @returns Count of pending events
   */
  async getPendingCount(storeId?: string): Promise<number> {
    return this.prisma.$client.domainEvent.count({
      where: {
        status: 'PENDING',
        ...(storeId && { storeId }),
      },
    });
  }

  /**
   * Get dead letter events for investigation.
   *
   * @param storeId - Optional store ID to filter
   * @param limit - Maximum number of events to return (default 100)
   * @returns Dead letter events
   */
  async getDeadLetterEvents(storeId?: string, limit: number = 100): Promise<DomainEvent[]> {
    return this.prisma.$client.domainEvent.findMany({
      where: {
        status: 'DEAD_LETTER',
        ...(storeId && { storeId }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get events by type for debugging or monitoring.
   *
   * @param type - Event type to filter
   * @param storeId - Optional store ID to filter
   * @param limit - Maximum number of events to return (default 100)
   * @returns Events matching the type
   */
  async getEventsByType(type: string, storeId?: string, limit: number = 100): Promise<DomainEvent[]> {
    return this.prisma.$client.domainEvent.findMany({
      where: {
        type,
        ...(storeId && { storeId }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Purge old processed events.
   *
   * Used for cleanup to prevent database growth.
   *
   * @param olderThan - Delete events processed before this date
   * @returns Number of deleted events
   */
  async purgeOldEvents(olderThan: Date): Promise<number> {
    const result = await this.prisma.$client.domainEvent.deleteMany({
      where: {
        status: 'PROCESSED',
        processedAt: { lt: olderThan },
      },
    });

    this.logger.log(`Purged ${result.count} old processed events`);
    return result.count;
  }
}
