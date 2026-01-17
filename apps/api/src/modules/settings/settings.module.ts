import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DatabaseModule } from '@database/index';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';

/**
 * Settings Module
 *
 * Provides store settings management endpoints.
 * Permissions required:
 * - settings:read: View store settings
 * - settings:update: Modify store settings
 *
 * Dependencies:
 * - EventEmitterModule: For emitting settings_updated events
 * - DatabaseModule: For Prisma database access
 *
 * @see Story 2.7 - Store Settings Configuration
 */
@Module({
  imports: [DatabaseModule, EventEmitterModule],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
