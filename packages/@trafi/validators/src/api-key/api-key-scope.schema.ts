import { z } from '@trafi/zod';

/**
 * API Key Scopes - defines what resources the API key can access.
 * Follows FR37 from PRD: API keys with scoped permissions.
 */
export const API_KEY_SCOPES = {
  'products:read': 'View products, categories, and collections',
  'products:write': 'Create, update, and delete products',
  'orders:read': 'View orders and order history',
  'orders:write': 'Update order status and process fulfillment',
  'customers:read': 'View customer information',
  'inventory:read': 'View inventory levels',
  'inventory:write': 'Update inventory quantities',
} as const;

export const ApiKeyScopeSchema = z.enum([
  'products:read',
  'products:write',
  'orders:read',
  'orders:write',
  'customers:read',
  'inventory:read',
  'inventory:write',
]);

export type ApiKeyScope = z.infer<typeof ApiKeyScopeSchema>;
