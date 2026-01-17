import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { getTenantContext, type TenantContextData } from '@common/context';

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

export type TenantScopedModel = typeof TENANT_SCOPED_MODELS[number];

/**
 * PrismaService - NestJS wrapper for Prisma Client (Prisma 7)
 *
 * Uses @prisma/adapter-pg for direct PostgreSQL connection.
 * Implements proper lifecycle hooks for NestJS integration.
 * This is the ONLY place Prisma should be instantiated in the API.
 *
 * Tenant Isolation Strategy (Defense in Depth):
 * 1. Services explicitly pass storeId to all queries (primary enforcement)
 * 2. TenantInterceptor provides tenant context via AsyncLocalStorage
 * 3. Helper methods validate tenant ownership before returning data
 * 4. tRPC context helpers (requirePermission, ensureTenantOwnership) add extra validation
 *
 * Usage:
 *   constructor(private readonly prisma: PrismaService) {}
 *   await this.prisma.product.findMany({ where: { storeId } });
 *
 * @see Story 2.6 - Tenant-Scoped Authorization
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL as string,
    });
    super({ adapter });
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
    await this.$connect();
    this.logger.log('Prisma connected to database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Prisma disconnected from database');
  }
}
