import { SetMetadata } from '@nestjs/common';
import type { ApiKeyScope } from '@trafi/validators';

/**
 * Decorator to specify required API key scopes for an endpoint.
 * Used in combination with ApiKeyGuard.
 *
 * @example
 * ```typescript
 * @Get('products')
 * @UseGuards(ApiKeyGuard)
 * @RequireScopes('products:read')
 * findAll() { ... }
 *
 * @Post('products')
 * @UseGuards(ApiKeyGuard)
 * @RequireScopes('products:read', 'products:write')
 * create() { ... }
 * ```
 */
export const RequireScopes = (...scopes: ApiKeyScope[]) =>
  SetMetadata('scopes', scopes);
