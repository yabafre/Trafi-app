import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { StoreCounterService } from './services/store-counter.service';
import { DomainEventService } from './services/domain-event.service';

/**
 * DatabaseModule - Global module providing Prisma access
 *
 * Marked as @Global() so PrismaService is available everywhere
 * without needing to import DatabaseModule in each feature module.
 *
 * CRITICAL: This module should NEVER be imported by frontend apps.
 * All data access from dashboard/storefront goes through API (tRPC/REST).
 *
 * Services:
 * - PrismaService: Core database access with tenant context helpers
 * - StoreCounterService: Atomic counters for sequential IDs (Story M-1)
 * - DomainEventService: Transactional outbox pattern (Story M-1)
 */
@Global()
@Module({
  providers: [PrismaService, StoreCounterService, DomainEventService],
  exports: [PrismaService, StoreCounterService, DomainEventService],
})
export class DatabaseModule {}
