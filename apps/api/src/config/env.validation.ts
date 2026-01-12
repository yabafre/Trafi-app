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

  // Authentication (JWT)
  JWT_SECRET: Joi.string().min(32).required().description('JWT signing secret (min 32 chars)'),
  JWT_REFRESH_SECRET: Joi.string()
    .min(32)
    .required()
    .description('JWT refresh token secret (min 32 chars)'),
  JWT_EXPIRATION: Joi.string()
    .default('15m')
    .description('Access token expiration (e.g., 15m, 1h)'),
  JWT_REFRESH_EXPIRATION: Joi.string()
    .default('7d')
    .description('Refresh token expiration (e.g., 7d, 30d)'),

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
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_EXPIRATION: string;
  JWT_REFRESH_EXPIRATION: string;
  OTEL_SERVICE_NAME: string;
  OTEL_EXPORTER_ENABLED: boolean;
}
