import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiKeysService } from '../api-keys.service';

/**
 * Guard for API Key authentication.
 * Validates API keys from the Authorization header for SDK requests.
 *
 * Usage:
 * - Apply to endpoints that support API key authentication
 * - Uses @RequireScopes() decorator for scope-based access control
 *
 * Authentication:
 * - Expects: Authorization: Bearer trafi_sk_{key}
 * - Validates key against database (SHA256 hash comparison)
 * - Checks expiration and revocation status
 * - Verifies required scopes
 *
 * @see epic-02-admin-auth.md#Story-2.5
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly apiKeysService: ApiKeysService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    // Only handle API key authentication
    if (!authHeader?.startsWith('Bearer trafi_sk_')) {
      // Let other guards (JWT) handle non-API-key auth
      return false;
    }

    const key = authHeader.slice(7); // Remove 'Bearer '

    // Validate the API key
    const apiKey = await this.apiKeysService.validateApiKey(key);

    if (!apiKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Check if key is expired
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      throw new UnauthorizedException('API key has expired');
    }

    // Check if key is revoked
    if (apiKey.revokedAt) {
      throw new UnauthorizedException('API key has been revoked');
    }

    // Check required scopes (if @RequireScopes decorator is used)
    const requiredScopes = this.reflector.get<string[]>('scopes', context.getHandler());
    if (requiredScopes && requiredScopes.length > 0) {
      const hasAllScopes = requiredScopes.every((scope) => apiKey.scopes.includes(scope));
      if (!hasAllScopes) {
        throw new ForbiddenException(
          `API key lacks required scope(s): ${requiredScopes.join(', ')}`,
        );
      }
    }

    // Inject tenant context into request
    request.storeId = apiKey.storeId;
    request.apiKeyId = apiKey.id;
    request.apiKeyScopes = apiKey.scopes;

    return true;
  }
}
