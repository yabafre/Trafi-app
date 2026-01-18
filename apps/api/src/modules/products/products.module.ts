import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DatabaseModule } from '@database/index';
import { ProductsService } from './products.service';

/**
 * Products Module
 *
 * Provides product catalog management functionality.
 * Products use tRPC router (not REST controller) for API access.
 *
 * Permissions required:
 * - products:read: View products
 * - products:create: Create products
 * - products:update: Update products
 * - products:delete: Delete products
 *
 * Dependencies:
 * - EventEmitterModule: For emitting product.created/updated/deleted events
 * - DatabaseModule: For Prisma database access
 *
 * @see Story 3.1 - Product Model and Basic CRUD
 */
@Module({
  imports: [DatabaseModule, EventEmitterModule],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
