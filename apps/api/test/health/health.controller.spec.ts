import { Test, TestingModule } from '@nestjs/testing';
import { TerminusModule, HealthCheckService } from '@nestjs/terminus';
import { HealthController } from '../../src/health/health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let healthService: HealthCheckService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TerminusModule],
      controllers: [HealthController],
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

    it('should include memory health indicators', async () => {
      const result = await controller.check();

      expect(result.info).toHaveProperty('memory_heap');
      expect(result.info).toHaveProperty('memory_rss');
    });
  });
});
