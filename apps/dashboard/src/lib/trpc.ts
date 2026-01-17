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
import { cookies } from 'next/headers';
import superjson from 'superjson';
import type { AppRouter } from '@api/trpc/routers/_app';

/**
 * API URL for tRPC endpoint
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const ACCESS_TOKEN_COOKIE = 'trafi_access_token';

/**
 * tRPC client for Server Actions (unauthenticated)
 *
 * Usage in Server Actions for public endpoints (login, register):
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
 * Create authenticated tRPC client for Server Actions
 *
 * This function creates a tRPC client with the auth token from cookies.
 * Must be called within a Server Action context.
 *
 * Usage in Server Actions:
 * ```ts
 * const client = await createAuthenticatedTrpcClient();
 * const result = await client.users.list.query({ page: 1, limit: 20 });
 * ```
 */
export async function createAuthenticatedTrpcClient() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  if (!accessToken) {
    throw new Error('Not authenticated');
  }

  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${API_URL}/trpc`,
        transformer: superjson,
        headers: () => ({
          Authorization: `Bearer ${accessToken}`,
        }),
      }),
    ],
  });
}

/**
 * Re-export type for convenience
 */
export type { AppRouter };
