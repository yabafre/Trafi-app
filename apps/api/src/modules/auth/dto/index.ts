/**
 * Auth DTOs for Swagger documentation
 *
 * These DTOs mirror the Zod schemas in @trafi/validators but add
 * Swagger decorators for OpenAPI documentation.
 *
 * Validation is still handled by Zod schemas in the controller.
 */

export * from './login.dto';
export * from './refresh-token.dto';
export * from './auth-response.dto';
