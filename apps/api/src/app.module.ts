import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { envValidationSchema } from './config';
import { DatabaseModule } from './database';
import { HealthModule } from './health';
import { ObservabilityModule } from './observability';
import { AuthModule } from '@modules/auth/auth.module';
import { UserModule } from '@modules/user/user.module';
import { ApiKeysModule } from '@modules/api-keys/api-keys.module';
import { TRPCModule } from './trpc/trpc.module';
import { TenantInterceptor, AuditInterceptor } from '@common/interceptors';

/**
 * Root Application Module
 *
 * Registers global interceptors for tenant context and audit logging.
 * Interceptor order matters: TenantInterceptor must run before AuditInterceptor
 * so that audit logs have access to tenant context.
 *
 * @see Story 2.6 - Tenant-Scoped Authorization
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
    DatabaseModule,
    ObservabilityModule,
    HealthModule,
    AuthModule,
    UserModule,
    ApiKeysModule,
    TRPCModule,
  ],
  controllers: [],
  providers: [
    // Global Interceptors - ORDER MATTERS!
    // TenantInterceptor must run first to set AsyncLocalStorage context
    // AuditInterceptor runs second to access tenant context for logging
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
