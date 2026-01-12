import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { AppModule } from '../src/app.module';

describe('AppModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    // Set minimal environment variables for testing
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    process.env.NODE_ENV = 'test';

    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should have ConfigModule loaded globally', () => {
    const configModule = module.get(ConfigModule, { strict: false });
    expect(configModule).toBeDefined();
  });
});
