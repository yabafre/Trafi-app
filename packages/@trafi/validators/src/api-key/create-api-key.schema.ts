import { z } from '@trafi/zod';
import { ApiKeyScopeSchema } from './api-key-scope.schema';

/**
 * Schema for creating a new API key.
 * - name: Human-readable identifier for the key
 * - scopes: Array of permissions the key will have
 * - expiresAt: Optional expiration date
 */
export const CreateApiKeySchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  scopes: z
    .array(ApiKeyScopeSchema)
    .min(1, 'At least one scope is required')
    .refine(
      (scopes) => new Set(scopes).size === scopes.length,
      'Duplicate scopes are not allowed',
    ),
  expiresAt: z.coerce.date().optional(),
});

export type CreateApiKeyInput = z.infer<typeof CreateApiKeySchema>;
