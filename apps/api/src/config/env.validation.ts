import Joi from 'joi';

/**
 * Environment validation schema using Joi
 * Validates all required environment variables at startup
 */
export const envValidationSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().port().default(3001),
  API_PREFIX: Joi.string().default('api'),

  // Observability (optional - can be configured later)
  OTEL_SERVICE_NAME: Joi.string().default('trafi-api'),
  OTEL_EXPORTER_ENABLED: Joi.boolean().default(false),
});

/**
 * Configuration interface for type-safe access
 */
export interface EnvironmentVariables {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  API_PREFIX: string;
  OTEL_SERVICE_NAME: string;
  OTEL_EXPORTER_ENABLED: boolean;
}
