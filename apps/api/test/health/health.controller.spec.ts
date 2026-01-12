import { Test, TestingModule } from '@nestjs/testing';
import { TerminusModule, HealthCheckService } from '@nestjs/terminus';
import { HealthController } from '../../src/health/health.controller';
import { PrismaHealthIndicator } from '../../src/health/prisma.health';

// Mock PrismaHealthIndicator to avoid database dependency in unit tests
const mockPrismaHealthIndicator = {
  isHealthy: jest.fn().mockResolvedValue({ database: { status: 'up' } }),
};

describe('HealthController', () => {
  let controller: HealthController;
  let healthService: HealthCheckService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TerminusModule],
      controllers: [HealthController],
      providers: [
        {
          provide: PrismaHealthIndicator,
          useValue: mockPrismaHealthIndicator,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthService = module.get<HealthCheckService>(HealthCheckService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(healthService).toBeDefined();
  });

  describe('check', () => {
    it('should return health check result', async () => {
      const result = await controller.check();

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('info');
      expect(result).toHaveProperty('details');
    });

    it('should include memory and database health indicators', async () => {
      const result = await controller.check();

      expect(result.info).toHaveProperty('database');
      expect(result.info).toHaveProperty('memory_heap');
      expect(result.info).toHaveProperty('memory_rss');
    });
  });
});
