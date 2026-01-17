/**
 * tRPC Context
 *
 * Creates the context that is available in all tRPC procedures.
 * Integrates with NestJS dependency injection.
 *
 * @see https://trpc.io/docs/server/context
 */
import type { Request, Response } from 'express';
import type { AuthenticatedUser } from '@trafi/types';
import type { AuthService } from '../modules/auth/auth.service';
import type { UserService } from '../modules/user/user.service';

/**
 * Services injected from NestJS DI container
 */
export interface TRPCServices {
  authService: AuthService;
  userService: UserService;
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
 */
export interface Context {
  req: Request;
  res: Response;
  user: AuthenticatedUser | null;
  services: TRPCServices;
}

/**
 * Create tRPC context from Express request
 *
 * Extracts user from JWT if present in Authorization header.
 * Services are injected from NestJS.
 */
export async function createContext({
  req,
  res,
  services,
}: CreateContextOptions): Promise<Context> {
  // Extract user from request if authenticated (set by JWT middleware)
  const user = (req as Request & { user?: AuthenticatedUser }).user ?? null;

  return {
    req,
    res,
    user,
    services,
  };
}

export type { Context as TRPCContext };
