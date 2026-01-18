/**
 * Auth Router - tRPC procedures for authentication
 *
 * Exposes login, logout, refresh, session, and multi-store procedures.
 * Uses existing AuthService for business logic.
 *
 * @see Story 2-R1 - Multi-Store RBAC (StoreMembership Model)
 */
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, isAuthed } from '../trpc';
import { LoginSchema, RefreshTokenRequestSchema } from '@trafi/validators';
import { z } from '@trafi/zod';

export const authRouter = router({
  /**
   * Login with email and password
   * Returns JWT tokens and user info
   */
  login: publicProcedure
    .input(LoginSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await ctx.services.authService.login(
          input.email,
          input.password
        );

        return {
          success: true as const,
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresIn: result.expiresIn,
        };
      } catch (error) {
        // Convert NestJS exceptions to tRPC errors
        if (error instanceof Error && error.message === 'Invalid credentials') {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid credentials',
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An error occurred during login',
        });
      }
    }),

  /**
   * Refresh access token using refresh token
   */
  refresh: publicProcedure
    .input(RefreshTokenRequestSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await ctx.services.authService.refreshAccessToken(
          input.refreshToken
        );

        return {
          success: true as const,
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresIn: result.expiresIn,
        };
      } catch {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired refresh token',
        });
      }
    }),

  /**
   * Logout - invalidate refresh token
   * Requires authentication
   */
  logout: publicProcedure.use(isAuthed).mutation(async ({ ctx }) => {
    await ctx.services.authService.logout(ctx.user.id);
    return { success: true as const };
  }),

  /**
   * Get current session/user info
   * Requires authentication
   */
  session: publicProcedure.use(isAuthed).query(async ({ ctx }) => {
    return {
      user: ctx.user,
      isAuthenticated: true as const,
    };
  }),

  /**
   * Get all stores the current user has access to
   * Requires authentication
   *
   * @see Story 2-R1 - Multi-Store RBAC
   */
  myStores: publicProcedure.use(isAuthed).query(async ({ ctx }) => {
    try {
      const stores = await ctx.services.authService.getUserStores(ctx.user!.id);
      return {
        stores: stores.map((m) => ({
          id: m.store.id,
          name: m.store.name,
          slug: m.store.slug,
          role: m.role,
          isCurrent: m.storeId === ctx.storeId,
        })),
      };
    } catch {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch stores',
      });
    }
  }),

  /**
   * Switch to a different store
   * Returns new tokens for the selected store
   * Requires authentication
   *
   * @see Story 2-R1 - Multi-Store RBAC
   */
  switchStore: publicProcedure
    .use(isAuthed)
    .input(z.object({ storeId: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await ctx.services.authService.switchStore(
          ctx.user!.id,
          input.storeId
        );

        return {
          success: true as const,
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresIn: result.expiresIn,
        };
      } catch (error) {
        if (error instanceof Error && error.message.includes('No active membership')) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have access to this store',
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to switch store',
        });
      }
    }),
});

export type AuthRouter = typeof authRouter;
