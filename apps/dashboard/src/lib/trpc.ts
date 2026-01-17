/**
 * tRPC Client - Server-side only
 *
 * This client is used exclusively in Server Actions to communicate
 * with the NestJS API via tRPC.
 *
 * Architecture:
 * Client Component → useServerActionMutation → Server Action → tRPC Client → NestJS API
 *
 * @see Epic-02 for data flow documentation
 */
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '@api/trpc/routers/_app';

/**
 * API URL for tRPC endpoint
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/**
 * tRPC client for Server Actions
 *
 * Usage in Server Actions:
 * ```ts
 * const result = await trpc.auth.login.mutate({ email, password });
 * ```
 */
export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${API_URL}/trpc`,
      transformer: superjson,
    }),
  ],
});

/**
 * Re-export type for convenience
 */
export type { AppRouter };
