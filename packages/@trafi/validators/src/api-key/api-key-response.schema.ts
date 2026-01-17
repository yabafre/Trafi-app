import { z } from '@trafi/zod';
import { ApiKeyScopeSchema } from './api-key-scope.schema';

/**
 * Schema for API key response (used in list/get operations).
 * Note: Does NOT include the actual key - only the masked version.
 */
export const ApiKeyResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  keyPrefix: z.string(), // "trafi_sk_" + first 8 hex chars
  lastFourChars: z.string(), // Last 4 chars for display
  scopes: z.array(ApiKeyScopeSchema),
  createdAt: z.coerce.date(),
  expiresAt: z.coerce.date().nullable(),
  lastUsedAt: z.coerce.date().nullable(),
  revokedAt: z.coerce.date().nullable(),
});

export type ApiKeyResponse = z.infer<typeof ApiKeyResponseSchema>;

/**
 * Schema for API key creation response.
 * This is the ONLY time the full key is returned.
 * The key will NEVER be shown again after creation.
 */
export const ApiKeyCreatedResponseSchema = ApiKeyResponseSchema.extend({
  key: z.string().regex(/^trafi_sk_[a-f0-9]{64}$/, 'Invalid API key format'),
});

export type ApiKeyCreatedResponse = z.infer<typeof ApiKeyCreatedResponseSchema>;

/**
 * Schema for paginated API keys list response.
 */
export const ApiKeysListResponseSchema = z.object({
  data: z.array(ApiKeyResponseSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export type ApiKeysListResponse = z.infer<typeof ApiKeysListResponseSchema>;
