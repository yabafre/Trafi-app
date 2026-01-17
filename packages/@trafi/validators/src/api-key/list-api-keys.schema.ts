import { z } from '@trafi/zod';

/**
 * Schema for listing API keys with pagination and filtering.
 * - page: Page number (1-indexed)
 * - limit: Number of items per page
 * - includeRevoked: Whether to include revoked keys in the list
 */
export const ListApiKeysSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  includeRevoked: z.coerce.boolean().default(false),
});

export type ListApiKeysInput = z.infer<typeof ListApiKeysSchema>;
