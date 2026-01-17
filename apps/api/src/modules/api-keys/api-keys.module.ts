import { Module } from '@nestjs/common';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeysService } from './api-keys.service';
import { DatabaseModule } from '@database';
import { AuthModule } from '../auth/auth.module';

/**
 * API Key management module for SDK authentication
 *
 * Provides:
 * - API key creation with scoped permissions
 * - API key listing (masked)
 * - API key revocation
 * - API key validation for SDK authentication
 *
 * Dependencies:
 * - DatabaseModule: For Prisma access
 * - AuthModule: For PermissionsGuard and other auth utilities
 *
 * Exports:
 * - ApiKeysService: For use in other modules (e.g., @trafi/core extensions, ApiKeyGuard)
 *
 * @see epic-02-admin-auth.md#Story-2.5
 */
@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [ApiKeysController],
  providers: [ApiKeysService],
  exports: [ApiKeysService],
})
export class ApiKeysModule {}
