/**
 * Router Types Export
 *
 * This file exists to provide a clean type export for the tRPC client.
 * Importing from here avoids pulling in NestJS dependencies.
 *
 * Usage in dashboard:
 * import type { AppRouter } from '@api/trpc/router-types';
 */
export type { AppRouter } from './routers/_app';
