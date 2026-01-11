import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter, RequestIdInterceptor } from './common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    // Get port from environment or default to 3001
    const port = process.env.PORT ?? 3001;

    // Global exception filter for standardized error responses
    app.useGlobalFilters(new HttpExceptionFilter());

    // Global interceptor for request ID tracking
    app.useGlobalInterceptors(new RequestIdInterceptor());

    // Enable graceful shutdown
    app.enableShutdownHooks();

    await app.listen(port);

    logger.log(`Trafi API is running on: http://localhost:${port}`);
    logger.log(`Health check available at: http://localhost:${port}/health`);
  } catch (error) {
    logger.error('Failed to start Trafi API', error);
    process.exit(1);
  }
}

void bootstrap();
