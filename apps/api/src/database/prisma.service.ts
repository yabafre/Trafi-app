import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * PrismaService - NestJS wrapper for Prisma Client (Prisma 7)
 *
 * Uses @prisma/adapter-pg for direct PostgreSQL connection.
 * Implements proper lifecycle hooks for NestJS integration.
 * This is the ONLY place Prisma should be instantiated in the API.
 *
 * Usage:
 *   constructor(private readonly prisma: PrismaService) {}
 *   await this.prisma.store.findMany({ where: { storeId } });
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

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Prisma connected to database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Prisma disconnected from database');
  }
}
