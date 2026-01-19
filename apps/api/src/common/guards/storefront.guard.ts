/**
 * Storefront Context Guard
 *
 * Resolves store context for storefront API endpoints via headers.
 * This is the "scaffold" implementation - full PK/cartToken support
 * will be added in Epic 4 (Cart) and Epic 12 (SDK).
 *
 * Resolution order:
 * 1. X-Trafi-Store-Id (dev/debug - can be disabled in production)
 * 2. X-Trafi-Publishable-Key (stub - full impl in Epic 12)
 * 3. Host header (stub - full impl in Epic 14)
 * 4. 400 Bad Request if none provided
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
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@database/prisma.service';

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

    // Try to resolve store context from headers
    const storefrontContext = await this.resolveStorefrontContext(request);

    if (!storefrontContext) {
      throw new BadRequestException(
        'Store context required. Provide X-Trafi-Store-Id or X-Trafi-Publishable-Key header.',
      );
    }

    // Inject storefront context into request
    request.storefront = storefrontContext;

    return true;
  }

  /**
   * Resolve store context from request headers
   *
   * Priority:
   * 1. X-Trafi-Store-Id (dev/debug)
   * 2. X-Trafi-Publishable-Key (future - Epic 12)
   * 3. Host (future - Epic 14)
   */
  protected async resolveStorefrontContext(
    request: Request & { headers: Record<string, string> },
  ): Promise<StorefrontContext | null> {
    const headers = request.headers;

    // 1. X-Trafi-Store-Id header (dev/debug mode)
    const storeIdHeader = headers[STOREFRONT_HEADERS.STORE_ID];
    if (storeIdHeader) {
      // In production, this could be disabled or restricted
      const isProduction = this.configService.get('NODE_ENV') === 'production';
      if (isProduction) {
        this.logger.warn(
          'X-Trafi-Store-Id header used in production - consider using Publishable Key',
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

      return {
        storeId: storeIdHeader,
        resolvedVia: 'store-id-header',
        cartToken: headers[STOREFRONT_HEADERS.CART_TOKEN],
      };
    }

    // 2. X-Trafi-Publishable-Key header (stub - Epic 12)
    const publishableKey = headers[STOREFRONT_HEADERS.PUBLISHABLE_KEY];
    if (publishableKey) {
      // TODO: Epic 12 - Implement publishable key resolution
      // For now, return 501 Not Implemented
      // Future: Look up PublishableKey table, resolve to storeId
      throw new BadRequestException(
        'Publishable key resolution not yet implemented. Use X-Trafi-Store-Id for now.',
      );
    }

    // 3. Host header resolution (stub - Epic 14)
    // TODO: Epic 14 - Implement domain/subdomain resolution
    // const host = headers['host'];
    // Future: Look up custom domain or subdomain -> storeId

    return null;
  }
}
