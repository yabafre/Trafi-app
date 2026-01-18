/**
 * App Router - Main tRPC router
 *
 * Combines all domain routers into a single app router.
 * This is the router that gets exposed via the tRPC endpoint.
 *
 * @see https://trpc.io/docs/server/merging-routers
 */
import { router } from '@/trpc';
import { authRouter } from './auth.router';
import { usersRouter } from './users.router';
import { settingsRouter } from './settings.router';
import { apiKeysRouter } from './api-keys.router';
import { ownershipRouter } from './ownership.router';
import { productsRouter } from './products.router';
import { variantsRouter } from './variants.router';
import { mediaRouter } from './media.router';
import { categoriesRouter } from './categories.router';
import { collectionsRouter } from './collections.router';
import { taxRulesRouter } from './tax-rules.router';
import { pricingRouter } from './pricing.router';

/**
 * Main application router
 *
 * All domain routers should be merged here.
 * Convention: router name = domain name (e.g., auth, users, products)
 */
export const appRouter = router({
  auth: authRouter,
  users: usersRouter,
  settings: settingsRouter,
  apiKeys: apiKeysRouter,
  ownership: ownershipRouter,
  products: productsRouter,
  variants: variantsRouter,
  media: mediaRouter,
  categories: categoriesRouter,
  collections: collectionsRouter,
  taxRules: taxRulesRouter,
  pricing: pricingRouter,
});

/**
 * Export type definition for client-side type inference
 *
 * This type is used by the tRPC client to provide
 * end-to-end type safety.
 */
export type AppRouter = typeof appRouter;
