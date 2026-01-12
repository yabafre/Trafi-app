import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * DatabaseModule - Global module providing Prisma access
 *
 * Marked as @Global() so PrismaService is available everywhere
 * without needing to import DatabaseModule in each feature module.
 *
 * CRITICAL: This module should NEVER be imported by frontend apps.
 * All data access from dashboard/storefront goes through API (tRPC/REST).
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
