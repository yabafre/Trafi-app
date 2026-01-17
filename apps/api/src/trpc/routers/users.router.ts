/**
 * Users Router - tRPC procedures for user management
 *
 * Exposes list, invite, update role, and deactivate procedures.
 * Uses existing UserService for business logic.
 *
 * @see Story 2.4 - User Management
 * @see Story 2.6 - Tenant-Scoped Authorization
 */
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, isAuthed } from '../trpc';
import {
  ListUsersSchema,
  InviteUserSchema,
  UpdateUserRoleSchema,
} from '@trafi/validators';
import { z } from '@trafi/zod';

export const usersRouter = router({
  /**
   * List users for the current store
   * Requires authentication
   */
  list: publicProcedure
    .use(isAuthed)
    .input(ListUsersSchema)
    .query(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('users:read');

        if (!ctx.storeId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store context required',
          });
        }

        return await ctx.services.userService.list(ctx.storeId, input);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to list users',
        });
      }
    }),

  /**
   * Invite a new user to the store
   * Requires authentication and users:invite permission
   */
  invite: publicProcedure
    .use(isAuthed)
    .input(InviteUserSchema.omit({ storeId: true }))
    .mutation(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('users:invite');

        if (!ctx.storeId || !ctx.userId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store and user context required',
          });
        }

        return await ctx.services.userService.invite(
          ctx.storeId,
          ctx.userId,
          input
        );
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (error instanceof Error && error.message.includes('already exists')) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: error.message,
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to invite user',
        });
      }
    }),

  /**
   * Update a user's role
   * Requires authentication and users:manage permission
   */
  updateRole: publicProcedure
    .use(isAuthed)
    .input(UpdateUserRoleSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('users:manage');

        if (!ctx.storeId || !ctx.userId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store and user context required',
          });
        }

        return await ctx.services.userService.updateRole(
          ctx.storeId,
          ctx.userId,
          input.userId,
          { role: input.role }
        );
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (error instanceof Error && error.message.includes('Forbidden')) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: error.message,
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update user role',
        });
      }
    }),

  /**
   * Deactivate a user
   * Requires authentication and users:manage permission
   */
  deactivate: publicProcedure
    .use(isAuthed)
    .input(z.object({ userId: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      try {
        ctx.requirePermission('users:manage');

        if (!ctx.storeId || !ctx.userId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Store and user context required',
          });
        }

        return await ctx.services.userService.deactivate(
          ctx.storeId,
          ctx.userId,
          input.userId
        );
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (error instanceof Error && error.message.includes('Forbidden')) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: error.message,
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to deactivate user',
        });
      }
    }),
});

export type UsersRouter = typeof usersRouter;
