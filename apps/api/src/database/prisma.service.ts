import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { getTenantContext, type TenantContextData } from '@common/context';
import { prefixedIdsExtension } from './prefixed-ids.extension';

/**
 * Models that require tenant scoping
 * Services using these models MUST include storeId in queries
 *
 * @see Story 2.6 - Tenant-Scoped Authorization (AC#2, AC#3)
 */
export const TENANT_SCOPED_MODELS = [
  'Product',
  'Order',
  'Customer',
  'Category',
  'User',
  'ApiKey',
  'Setting',
  'AuditLog',
] as const;

export type TenantScopedModel = (typeof TENANT_SCOPED_MODELS)[number];

/**
 * Extended Prisma Client type with prefixed IDs
 * @see Story 3.R2 - Prefixed IDs Foundation
 */
type ExtendedPrismaClient = ReturnType<typeof createExtendedClient>;

/**
 * Factory function to create Prisma client with extensions
 */
function createExtendedClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL as string,
  });
  const baseClient = new PrismaClient({ adapter });
  return baseClient.$extends(prefixedIdsExtension);
}

/**
 * PrismaService - NestJS wrapper for Prisma Client (Prisma 7)
 *
 * Uses @prisma/adapter-pg for direct PostgreSQL connection.
 * Implements proper lifecycle hooks for NestJS integration.
 * This is the ONLY place Prisma should be instantiated in the API.
 *
 * Features:
 * - Automatic prefixed ID generation for all models (Story 3.R2)
 * - Tenant isolation helpers (Story 2.6)
 *
 * Tenant Isolation Strategy (Defense in Depth):
 * 1. Services explicitly pass storeId to all queries (primary enforcement)
 * 2. TenantInterceptor provides tenant context via AsyncLocalStorage
 * 3. Helper methods validate tenant ownership before returning data
 * 4. tRPC context helpers (requirePermission, ensureTenantOwnership) add extra validation
 *
 * ID Generation:
 * - All create operations automatically get prefixed IDs
 * - Format: {prefix}_{nanoid} (e.g., prod_abc123xyz...)
 * - Prefixes defined in id-prefixes.config.ts
 *
 * Usage:
 *   constructor(private readonly prisma: PrismaService) {}
 *   await this.prisma.product.findMany({ where: { storeId } });
 *
 * @see Story 2.6 - Tenant-Scoped Authorization
 * @see Story 3.R2 - Prefixed IDs Foundation
 */
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly client: ExtendedPrismaClient;

  constructor() {
    this.client = createExtendedClient();
  }

  /**
   * Get the underlying Prisma client
   * Use this for direct database operations
   */
  get $client() {
    return this.client;
  }

  // Delegate all Prisma model accessors to the extended client
  get store() {
    return this.client.store;
  }
  get user() {
    return this.client.user;
  }
  get product() {
    return this.client.product;
  }
  get storeSettings() {
    return this.client.storeSettings;
  }
  get apiKey() {
    return this.client.apiKey;
  }
  get auditLog() {
    return this.client.auditLog;
  }
  get ownershipTransfer() {
    return this.client.ownershipTransfer;
  }

  // Delegate transaction and other methods with proper typing
  // Using bind to preserve 'this' context while forwarding calls
  get $transaction() {
    return this.client.$transaction.bind(this.client);
  }

  get $queryRaw() {
    return this.client.$queryRaw.bind(this.client);
  }

  get $executeRaw() {
    return this.client.$executeRaw.bind(this.client);
  }

  get $queryRawUnsafe() {
    return this.client.$queryRawUnsafe.bind(this.client);
  }

  get $executeRawUnsafe() {
    return this.client.$executeRawUnsafe.bind(this.client);
  }

  /**
   * Get current tenant context from AsyncLocalStorage
   * Returns undefined if not in an authenticated request context
   */
  getTenantContext(): TenantContextData | undefined {
    return getTenantContext();
  }

  /**
   * Get current tenant context or throw if not available
   * Use in code paths that require authentication
   *
   * @throws Error if called outside authenticated context
   */
  requireTenantContext(): TenantContextData {
    const ctx = getTenantContext();
    if (!ctx) {
      throw new Error('Tenant context required but not available');
    }
    return ctx;
  }

  /**
   * Get current storeId from tenant context
   * Returns undefined if not in authenticated context
   */
  getCurrentStoreId(): string | undefined {
    return getTenantContext()?.storeId;
  }

  /**
   * Validate that a resource belongs to the current tenant
   * Returns 404 (not 403) to avoid leaking resource existence
   *
   * @param resource Resource with storeId property
   * @returns The resource if owned by current tenant
   * @throws NotFoundException if resource is null or belongs to different tenant
   */
  validateTenantOwnership<T extends { storeId: string }>(resource: T | null): T {
    if (!resource) {
      throw new Error('Resource not found');
    }

    const ctx = getTenantContext();
    if (ctx && resource.storeId !== ctx.storeId) {
      // Return generic error to avoid leaking that resource exists
      throw new Error('Resource not found');
    }

    return resource;
  }

  async onModuleInit() {
    await this.client.$connect();
    this.logger.log('Prisma connected to database (with prefixed IDs extension)');
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
    this.logger.log('Prisma disconnected from database');
  }
}
