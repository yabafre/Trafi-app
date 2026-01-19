/**
 * Storefront Context Guard
 *
 * Resolves store context for storefront API endpoints via headers.
 * This is the "scaffold" implementation - full PK/cartToken support
 * will be added in Epic 4 (Cart) and Epic 12 (SDK).
 *
 * Resolution order:
 * 1. X-Trafi-Publishable-Key (production-ready - Epic 12)
 * 2. Host header (future - Epic 14)
 * 3. X-Trafi-Store-Id (dev/debug/staging - blocked in production unless ALLOW_STORE_ID_HEADER=true)
 * 4. 400 Bad Request if none provided
 *
 * Security:
 * - X-Trafi-Store-Id is BLOCKED in production (prevents enumeration/scraping)
 * - Exception: ALLOW_STORE_ID_HEADER=true allows it for internal envs (staging, preview, E2E)
 * - Must use Publishable Key or Host in production (unless exception above)
 * - All resolutions are logged for audit
 *
 * Environment Variables:
 * - NODE_ENV: "production" blocks store-id-header by default
 * - ALLOW_STORE_ID_HEADER: "true" allows store-id-header even in production (for staging/E2E)
 *
 * @see Story 3.8 - Oversell Prevention
 * @see Epic 12 - SDK & API Experience
 * @see Epic 14 - Cloud & Multi-tenancy
 */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@database/prisma.service';
import { randomUUID } from 'crypto';

/**
 * Storefront request context added to request object
 */
export interface StorefrontContext {
  storeId: string;
  resolvedVia: 'store-id-header' | 'publishable-key' | 'host';
  cartToken?: string;
}

/**
 * Header names for storefront context resolution
 */
export const STOREFRONT_HEADERS = {
  STORE_ID: 'x-trafi-store-id',
  PUBLISHABLE_KEY: 'x-trafi-publishable-key',
  CART_TOKEN: 'x-trafi-cart-token',
} as const;

@Injectable()
export class StorefrontGuard implements CanActivate {
  private readonly logger = new Logger(StorefrontGuard.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const requestId = randomUUID().slice(0, 8);

    // Try to resolve store context from headers
    const storefrontContext = await this.resolveStorefrontContext(
      request,
      requestId,
    );

    if (!storefrontContext) {
      const isProduction =
        this.configService.get('NODE_ENV') === 'production';
      throw new BadRequestException(
        isProduction
          ? 'Store context required. Provide X-Trafi-Publishable-Key header.'
          : 'Store context required. Provide X-Trafi-Store-Id or X-Trafi-Publishable-Key header.',
      );
    }

    // Inject storefront context into request
    request.storefront = storefrontContext;
    request.requestId = requestId;

    return true;
  }

  /**
   * Resolve store context from request headers
   *
   * Priority (SECURITY ORDER):
   * 1. X-Trafi-Publishable-Key (production-safe)
   * 2. Host header (production-safe - Epic 14)
   * 3. X-Trafi-Store-Id (dev/debug ONLY - BLOCKED in production)
   */
  protected async resolveStorefrontContext(
    request: Request & { headers: Record<string, string>; url?: string },
    requestId: string,
  ): Promise<StorefrontContext | null> {
    const headers = request.headers;
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    const path = request.url || 'unknown';

    // 1. X-Trafi-Publishable-Key header (production-ready - Epic 12)
    const publishableKey = headers[STOREFRONT_HEADERS.PUBLISHABLE_KEY];
    if (publishableKey) {
      // Validate publishable key format
      if (!publishableKey.startsWith('pk_')) {
        throw new BadRequestException('Invalid publishable key format');
      }

      // Look up PublishableKey in database
      const pkRecord = await this.prisma.publishableKey.findFirst({
        where: {
          key: publishableKey,
          revokedAt: null, // Must not be revoked
        },
        select: { id: true, storeId: true },
      });

      if (!pkRecord) {
        throw new ForbiddenException('Invalid or revoked publishable key');
      }

      // Audit log (no sensitive data)
      this.logger.log({
        event: 'storefront_auth',
        requestId,
        storeId: pkRecord.storeId,
        resolvedVia: 'publishable-key',
        path,
      });

      return {
        storeId: pkRecord.storeId,
        resolvedVia: 'publishable-key',
        cartToken: headers[STOREFRONT_HEADERS.CART_TOKEN],
      };
    }

    // 2. Host header resolution (stub - Epic 14)
    // TODO: Epic 14 - Implement domain/subdomain resolution
    // const host = headers['host'];
    // Future: Look up custom domain or subdomain -> storeId

    // 3. X-Trafi-Store-Id header (dev/debug/staging ONLY)
    const storeIdHeader = headers[STOREFRONT_HEADERS.STORE_ID];
    if (storeIdHeader) {
      // Check if store-id-header is explicitly allowed (for staging/E2E/preview envs)
      const allowStoreIdHeader =
        this.configService.get('ALLOW_STORE_ID_HEADER') === 'true';

      // SECURITY: Block X-Trafi-Store-Id in production
      // Exception: ALLOW_STORE_ID_HEADER=true allows it for internal envs
      if (isProduction && !allowStoreIdHeader) {
        this.logger.warn({
          event: 'storefront_auth_blocked',
          requestId,
          reason: 'store-id-header-in-production',
          path,
        });
        throw new ForbiddenException(
          'X-Trafi-Store-Id is not allowed in production. Use X-Trafi-Publishable-Key instead.',
        );
      }

      // Verify store exists
      const store = await this.prisma.store.findUnique({
        where: { id: storeIdHeader },
        select: { id: true },
      });

      if (!store) {
        throw new BadRequestException(`Store not found: ${storeIdHeader}`);
      }

      // Audit log (includes warning for non-standard auth)
      this.logger.log({
        event: 'storefront_auth',
        requestId,
        storeId: storeIdHeader,
        resolvedVia: 'store-id-header',
        path,
        warning: isProduction ? 'allowed-via-env-override' : 'dev-mode',
      });

      return {
        storeId: storeIdHeader,
        resolvedVia: 'store-id-header',
        cartToken: headers[STOREFRONT_HEADERS.CART_TOKEN],
      };
    }

    return null;
  }
}
