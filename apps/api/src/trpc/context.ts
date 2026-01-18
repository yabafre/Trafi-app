/**
 * tRPC Context
 *
 * Creates the context that is available in all tRPC procedures.
 * Integrates with NestJS dependency injection and tenant context.
 *
 * Provides:
 * - User and tenant information from JWT
 * - Helper functions for permission checking
 * - Helper functions for tenant ownership validation
 *
 * @see https://trpc.io/docs/server/context
 * @see Story 2.6 - Tenant-Scoped Authorization (AC#3, AC#5)
 */
import type { Request, Response } from 'express';
import type { AuthenticatedUser, JwtPayload, Permission, Role } from '@trafi/types';
import { ROLE_PERMISSIONS } from '@trafi/types';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import type { AuthService } from '@modules/auth/auth.service';
import type { UserService } from '@modules/user';
import type { SettingsService } from '@modules/settings';
import type { ApiKeysService } from '@modules/api-keys';
import type { OwnershipService } from '@modules/ownership';
import type { ProductsService } from '@modules/products';
import type { VariantsService } from '@modules/variants';
import type { MediaService } from '@modules/media';
import type { CategoriesService } from '@modules/categories';
import type { CollectionsService } from '@modules/collections';
import type { TaxRulesService, PricingService } from '@modules/pricing';

/**
 * Services injected from NestJS DI container
 */
export interface TRPCServices {
  authService: AuthService;
  userService: UserService;
  settingsService: SettingsService;
  apiKeysService: ApiKeysService;
  ownershipService: OwnershipService;
  productsService: ProductsService;
  variantsService: VariantsService;
  mediaService: MediaService;
  categoriesService: CategoriesService;
  collectionsService: CollectionsService;
  taxRulesService: TaxRulesService;
  pricingService: PricingService;
  jwtService: JwtService;
}

/**
 * Context options passed to createContext
 */
export interface CreateContextOptions {
  req: Request;
  res: Response;
  services: TRPCServices;
}

/**
 * Context available in all tRPC procedures
 *
 * Includes tenant context from AsyncLocalStorage and helper functions
 * for permission checking and tenant ownership validation.
 */
export interface Context {
  req: Request;
  res: Response;
  user: AuthenticatedUser | null;
  services: TRPCServices;
  // Tenant context from AsyncLocalStorage
  storeId: string | undefined;
  userId: string | undefined;
  role: string | undefined;
  requestId: string | undefined;
  /**
   * Check if the current user has a specific permission
   * @throws ForbiddenException if not authenticated or lacks permission
   */
  requirePermission: (permission: Permission) => void;
  /**
   * Validate that a resource belongs to the current tenant
   * @returns The resource if it belongs to current tenant
   * @throws NotFoundException if resource is null or belongs to different tenant
   */
  ensureTenantOwnership: <T extends { storeId: string }>(resource: T | null) => T;
}

/**
 * Extract Bearer token from Authorization header
 */
function extractTokenFromHeader(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return undefined;
  }
  return authHeader.slice(7);
}

/**
 * Create tRPC context from Express request
 *
 * Extracts user from JWT if present in Authorization header.
 * Services are injected from NestJS.
 * Includes tenant context and helper functions.
 */
export async function createContext({
  req,
  res,
  services,
}: CreateContextOptions): Promise<Context> {
  // Try to extract and validate JWT from Authorization header
  let user: AuthenticatedUser | null = null;
  let tenantCtx: { storeId?: string; userId?: string; role?: string; requestId?: string } | null =
    null;

  const token = extractTokenFromHeader(req);
  if (token) {
    try {
      // Verify and decode the JWT
      const payload = services.jwtService.verify<JwtPayload>(token);

      // Validate the payload and get the user
      user = await services.authService.validateJwtPayload(payload);

      if (user) {
        // Create tenant context from JWT payload
        tenantCtx = {
          storeId: payload.tenantId,
          userId: payload.sub,
          role: payload.role,
          requestId: req.headers['x-request-id'] as string | undefined,
        };
      }
    } catch {
      // Token invalid or expired - user remains null
      user = null;
    }
  }

  return {
    req,
    res,
    user,
    services,

    // Tenant context from JWT validation
    storeId: tenantCtx?.storeId,
    userId: tenantCtx?.userId,
    role: tenantCtx?.role,
    requestId: tenantCtx?.requestId,

    /**
     * Check if the current user has a specific permission
     *
     * Uses role-based permission lookup from @trafi/types
     *
     * @param permission - The permission to check
     * @throws ForbiddenException if not authenticated or lacks permission
     */
    requirePermission: (permission: Permission): void => {
      if (!user || !tenantCtx) {
        throw new ForbiddenException('Authentication required');
      }

      const rolePermissions = ROLE_PERMISSIONS[tenantCtx.role as Role] || [];
      if (!rolePermissions.includes(permission)) {
        throw new ForbiddenException('Insufficient permissions');
      }
    },

    /**
     * Validate that a resource belongs to the current tenant
     *
     * IMPORTANT: Returns 404 (not 403) to avoid leaking resource existence.
     * This follows security best practices where we don't reveal if a
     * resource exists when the user doesn't have access.
     *
     * @param resource - The resource to validate (must have storeId property)
     * @returns The resource if it belongs to current tenant
     * @throws NotFoundException if resource is null or belongs to different tenant
     */
    ensureTenantOwnership: <T extends { storeId: string }>(resource: T | null): T => {
      // Resource not found
      if (!resource) {
        throw new NotFoundException('Resource not found');
      }

      // Resource belongs to different tenant - return 404 to avoid leaking info
      if (resource.storeId !== tenantCtx?.storeId) {
        throw new NotFoundException('Resource not found');
      }

      return resource;
    },
  };
}

export type { Context as TRPCContext };
