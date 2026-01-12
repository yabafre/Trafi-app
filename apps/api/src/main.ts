import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter, RequestIdInterceptor } from '@common';

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

    // Swagger/OpenAPI Setup
    const config = new DocumentBuilder()
      .setTitle('Trafi API')
      .setDescription(
        'Trafi - Open-source multi-tenant SaaS e-commerce platform API. ' +
          'Built with NestJS, featuring JWT authentication, multi-tenancy, and the Profit Engine.'
      )
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token',
        },
        'JWT-auth'
      )
      .addTag('auth', 'Authentication endpoints (login, logout, refresh)')
      .addTag('health', 'Health check endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, {
      customSiteTitle: 'Trafi API Documentation',
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'list',
        filter: true,
        showRequestDuration: true,
      },
    });

    await app.listen(port);

    logger.log(`Trafi API is running on: http://localhost:${port}`);
    logger.log(`Health check available at: http://localhost:${port}/health`);
    logger.log(`Swagger docs available at: http://localhost:${port}/docs`);
  } catch (error) {
    logger.error('Failed to start Trafi API', error);
    process.exit(1);
  }
}

void bootstrap();
