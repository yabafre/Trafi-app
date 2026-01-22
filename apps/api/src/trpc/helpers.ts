/**
 * tRPC Router Helpers
 *
 * Utilities to reduce code duplication across routers.
 * Provides consistent error handling, permission checks, and store context validation.
 *
 * @module trpc/helpers
 */
import { TRPCError } from '@trpc/server';
import type { Context } from './context';
import type { Permission } from '@/common/types/permissions';

/**
 * Options for the withStoreContext helper
 */
interface StoreContextOptions {
  /** Required permission to execute this operation */
  permission: Permission;
  /** Custom error message for failures (optional) */
  errorMessage?: string;
}

/**
 * Context with guaranteed storeId (after validation)
 */
interface StoreContext extends Context {
  storeId: string;
}

/**
 * Wraps a router handler with store context validation and error handling.
 *
 * This helper eliminates the repetitive pattern of:
 * 1. Checking permissions
 * 2. Validating storeId exists
 * 3. Wrapping in try/catch with TRPCError mapping
 *
 * @example
 * ```typescript
 * // Before (repeated 100+ times):
 * async ({ input, ctx }) => {
 *   try {
 *     ctx.requirePermission('settings:read');
 *     if (!ctx.storeId) {
 *       throw new TRPCError({ code: 'BAD_REQUEST', message: 'Store context required' });
 *     }
 *     return await ctx.services.someService.method(ctx.storeId, input);
 *   } catch (error) {
 *     if (error instanceof TRPCError) throw error;
 *     throw new TRPCError({
 *       code: 'INTERNAL_SERVER_ERROR',
 *       message: error instanceof Error ? error.message : 'Failed to ...',
 *     });
 *   }
 * }
 *
 * // After:
 * withStoreContext(
 *   { permission: 'settings:read', errorMessage: 'Failed to do something' },
 *   async (ctx, input) => ctx.services.someService.method(ctx.storeId, input)
 * )
 * ```
 */
export function withStoreContext<TInput, TOutput>(
  options: StoreContextOptions,
  handler: (ctx: StoreContext, input: TInput) => Promise<TOutput>
): (params: { input: TInput; ctx: Context }) => Promise<TOutput> {
  return async ({ input, ctx }) => {
    try {
      // Check permission
      ctx.requirePermission(options.permission);

      // Validate store context
      if (!ctx.storeId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Store context required',
        });
      }

      // Execute handler with validated context
      return await handler(ctx as StoreContext, input);
    } catch (error) {
      // Re-throw TRPCErrors as-is
      if (error instanceof TRPCError) throw error;

      // Map NotFoundException to NOT_FOUND
      if (error instanceof Error && error.name === 'NotFoundException') {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: error.message,
        });
      }

      // Map ConflictException to CONFLICT
      if (error instanceof Error && error.name === 'ConflictException') {
        throw new TRPCError({
          code: 'CONFLICT',
          message: error.message,
        });
      }

      // Map BadRequestException to BAD_REQUEST
      if (error instanceof Error && error.name === 'BadRequestException') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.message,
        });
      }

      // Default to INTERNAL_SERVER_ERROR
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message:
          error instanceof Error
            ? error.message
            : (options.errorMessage ?? 'An unexpected error occurred'),
      });
    }
  };
}

/**
 * Wraps a query handler (syntactic sugar for withStoreContext with read permission pattern)
 */
export function storeQuery<TInput, TOutput>(
  permission: Permission,
  handler: (ctx: StoreContext, input: TInput) => Promise<TOutput>
): (params: { input: TInput; ctx: Context }) => Promise<TOutput> {
  return withStoreContext({ permission }, handler);
}

/**
 * Wraps a mutation handler (syntactic sugar for withStoreContext with update permission pattern)
 */
export function storeMutation<TInput, TOutput>(
  permission: Permission,
  handler: (ctx: StoreContext, input: TInput) => Promise<TOutput>
): (params: { input: TInput; ctx: Context }) => Promise<TOutput> {
  return withStoreContext({ permission }, handler);
}

/**
 * Maps common service errors to appropriate TRPCError codes.
 * Use this for custom error handling when withStoreContext doesn't fit.
 */
export function mapServiceError(error: unknown, fallbackMessage: string): never {
  if (error instanceof TRPCError) throw error;

  const errorMessage = error instanceof Error ? error.message : fallbackMessage;

  // Check for specific error patterns
  if (errorMessage.includes('not found') || errorMessage.includes('Not found')) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: errorMessage,
    });
  }

  if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
    throw new TRPCError({
      code: 'CONFLICT',
      message: errorMessage,
    });
  }

  if (errorMessage.includes('Invalid') || errorMessage.includes('invalid')) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: errorMessage,
    });
  }

  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: errorMessage,
  });
}
