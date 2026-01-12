import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envValidationSchema } from './config';
import { DatabaseModule } from './database';
import { HealthModule } from './health';
import { ObservabilityModule } from './observability';

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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
