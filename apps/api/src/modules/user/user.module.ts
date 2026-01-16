import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { DatabaseModule } from '@database';
import { AuthModule } from '../auth/auth.module';

/**
 * User management module for store team administration
 *
 * Provides:
 * - User listing with pagination
 * - User invitation with role assignment
 * - Role updates with hierarchy validation
 * - User deactivation with last Owner protection
 *
 * Dependencies:
 * - DatabaseModule: For Prisma access
 * - AuthModule: For PermissionsGuard and other auth utilities
 *
 * Exports:
 * - UserService: For use in other modules (e.g., @trafi/core extensions)
 *
 * @see epic-02-admin-auth.md#Story-2.4
 */
@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
