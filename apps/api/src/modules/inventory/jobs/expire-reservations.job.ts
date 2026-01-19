/**
 * Reservation Expiry Job
 *
 * Periodically cleans up expired inventory reservations.
 * Runs every minute to mark ACTIVE reservations with expiresAt < now()
 * as EXPIRED and emits events for each expired reservation.
 *
 * @see Story 3.8 - Oversell Prevention (AC#10)
 */
import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@database/prisma.service';
import type { ReservationStatus } from '@generated/prisma/client';

/**
 * Event payload for reservation expiry
 */
export interface ReservationExpiredEvent {
  reservationId: string;
  storeId: string;
  cartId: string;
  variantId: string;
  quantity: number;
  expiredAt: Date;
}

/**
 * Configuration for the expiry job
 */
interface ExpireReservationsConfig {
  /** Batch size for processing expired reservations */
  batchSize: number;
  /** Interval in milliseconds between job runs */
  intervalMs: number;
}

@Injectable()
export class ExpireReservationsJob {
  protected readonly logger = new Logger(ExpireReservationsJob.name);

  /**
   * Configuration for the job
   * Can be overridden in subclasses for different environments
   */
  protected readonly config: ExpireReservationsConfig = {
    batchSize: 100,
    intervalMs: 60000, // 1 minute
  };

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Main job handler - runs every minute
   *
   * Finds all ACTIVE reservations with expiresAt < now(),
   * marks them as EXPIRED, and emits events.
   */
  @Interval(60000) // 1 minute
  async handleExpiredReservations(): Promise<void> {
    const startTime = Date.now();
    let totalExpired = 0;

    try {
      // Process in batches to avoid memory issues with large datasets
      let hasMore = true;

      while (hasMore) {
        const expiredCount = await this.processExpiredBatch();
        totalExpired += expiredCount;

        // If we processed less than batch size, we're done
        hasMore = expiredCount === this.config.batchSize;
      }

      if (totalExpired > 0) {
        const duration = Date.now() - startTime;
        this.logger.log(`Expired ${totalExpired} reservations in ${duration}ms`);
      }
    } catch (error) {
      this.logger.error('Error processing expired reservations', error);
    }
  }

  /**
   * Process a single batch of expired reservations
   *
   * @returns Number of reservations expired in this batch
   */
  protected async processExpiredBatch(): Promise<number> {
    const now = new Date();

    // Find expired reservations
    const expiredReservations = await this.prisma.inventoryReservation.findMany({
      where: {
        status: 'ACTIVE' as ReservationStatus,
        expiresAt: { lt: now },
      },
      take: this.config.batchSize,
      select: {
        id: true,
        storeId: true,
        cartId: true,
        variantId: true,
        quantity: true,
      },
    });

    if (expiredReservations.length === 0) {
      return 0;
    }

    // Update all expired reservations in a single transaction
    const reservationIds = expiredReservations.map((r) => r.id);

    await this.prisma.inventoryReservation.updateMany({
      where: { id: { in: reservationIds } },
      data: {
        status: 'EXPIRED' as ReservationStatus,
        releasedAt: now,
      },
    });

    // Emit events for each expired reservation
    for (const reservation of expiredReservations) {
      const event: ReservationExpiredEvent = {
        reservationId: reservation.id,
        storeId: reservation.storeId,
        cartId: reservation.cartId,
        variantId: reservation.variantId,
        quantity: reservation.quantity,
        expiredAt: now,
      };

      this.eventEmitter.emit('inventory.reservation.expired', event);
    }

    return expiredReservations.length;
  }

  /**
   * Manually trigger expiry processing (useful for testing or immediate cleanup)
   *
   * @returns Number of reservations expired
   */
  async expireNow(): Promise<number> {
    let totalExpired = 0;
    let hasMore = true;

    while (hasMore) {
      const expiredCount = await this.processExpiredBatch();
      totalExpired += expiredCount;
      hasMore = expiredCount === this.config.batchSize;
    }

    return totalExpired;
  }

  /**
   * Get count of currently expired (but not yet processed) reservations
   *
   * @returns Count of expired reservations pending cleanup
   */
  async getExpiredCount(): Promise<number> {
    const result = await this.prisma.inventoryReservation.count({
      where: {
        status: 'ACTIVE' as ReservationStatus,
        expiresAt: { lt: new Date() },
      },
    });

    return result;
  }
}
