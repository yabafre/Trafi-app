import { Module } from '@nestjs/common';
import { OpenTelemetryModule } from 'nestjs-otel';

/**
 * Observability module for OpenTelemetry integration
 *
 * Note: Basic setup with host metrics enabled.
 * Advanced API metrics and tracing exporters will be configured
 * when infrastructure is ready (e.g., Prometheus, Jaeger).
 */
@Module({
  imports: [
    OpenTelemetryModule.forRoot({
      metrics: {
        hostMetrics: true,
      },
    }),
  ],
})
export class ObservabilityModule {}
