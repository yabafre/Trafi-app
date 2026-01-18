/**
 * Storage Module
 *
 * Provides S3/R2 compatible storage for the application.
 * Import this module in any module that needs file storage.
 *
 * @see Story 3.3 - Product Media Upload
 */

import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StorageService } from './storage.service';
import { storageConfig } from './storage.config';

@Global()
@Module({
  imports: [ConfigModule.forFeature(storageConfig)],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
