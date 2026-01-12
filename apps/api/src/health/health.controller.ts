import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthCheckService, HealthCheck, MemoryHealthIndicator } from '@nestjs/terminus';
import { PrismaHealthIndicator } from './prisma.health';

/**
 * Health check response DTO for Swagger
 */
class HealthCheckResponseDto {
  status!: string;
  info!: Record<string, { status: string }>;
  error!: Record<string, { status: string }>;
  details!: Record<string, { status: string }>;
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly memory: MemoryHealthIndicator,
    private readonly prisma: PrismaHealthIndicator
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({
    summary: 'Health check endpoint',
    description:
      'Returns the health status of the API including database connectivity, ' +
      'memory heap usage (500MB threshold), and RSS memory (1GB threshold).',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    type: HealthCheckResponseDto,
    schema: {
      example: {
        status: 'ok',
        info: {
          database: { status: 'up' },
          memory_heap: { status: 'up' },
          memory_rss: { status: 'up' },
        },
        error: {},
        details: {
          database: { status: 'up' },
          memory_heap: { status: 'up' },
          memory_rss: { status: 'up' },
        },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Service is unhealthy',
    schema: {
      example: {
        status: 'error',
        info: {},
        error: {
          database: { status: 'down', message: 'Connection refused' },
        },
        details: {
          database: { status: 'down', message: 'Connection refused' },
        },
      },
    },
  })
  check() {
    return this.health.check([
      // Database connectivity check - critical for API operation
      () => this.prisma.isHealthy('database'),
      // Memory heap check - 500MB threshold
      () => this.memory.checkHeap('memory_heap', 500 * 1024 * 1024),
      // Memory RSS check - 1GB threshold
      () => this.memory.checkRSS('memory_rss', 1024 * 1024 * 1024),
    ]);
  }
}
