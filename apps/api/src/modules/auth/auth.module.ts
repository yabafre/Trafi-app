import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { RolesGuard } from './guards/roles.guard';
import { DatabaseModule } from '@database';

/**
 * Authentication module for admin dashboard access
 *
 * Provides:
 * - JWT token generation and validation
 * - Local (email/password) authentication
 * - Passport strategies for authentication flow
 * - RBAC guards (PermissionsGuard, RolesGuard)
 * - RBAC decorators (@RequirePermissions, @Roles, @CurrentUser)
 *
 * Exports AuthService and RBAC guards for use in other modules
 *
 * @see architecture.md#Authentication-&-Security
 * @see epic-02-admin-auth.md#Story-2.3
 */
@Module({
  imports: [
    DatabaseModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: 900, // 15 minutes in seconds
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    LocalStrategy,
    LocalAuthGuard,
    PermissionsGuard,
    RolesGuard,
  ],
  exports: [AuthService, JwtModule, PermissionsGuard, RolesGuard],
})
export class AuthModule {}
