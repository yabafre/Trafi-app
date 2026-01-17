import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envValidationSchema } from './config';
import { DatabaseModule } from './database';
import { HealthModule } from './health';
import { ObservabilityModule } from './observability';
import { AuthModule } from '@modules/auth/auth.module';
import { UserModule } from '@modules/user/user.module';
import { ApiKeysModule } from '@modules/api-keys/api-keys.module';
import { TRPCModule } from './trpc/trpc.module';

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
  providers: [],
})
export class AppModule {}
