/**
 * Auth Router - tRPC procedures for authentication
 *
 * Exposes login, logout, refresh, and session procedures.
 * Uses existing AuthService for business logic.
 */
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, isAuthed } from '../trpc';
import { LoginSchema, RefreshTokenRequestSchema } from '@trafi/validators';

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
});

export type AuthRouter = typeof authRouter;
