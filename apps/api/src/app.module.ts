import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envValidationSchema } from './config';
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
    ObservabilityModule,
    HealthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
