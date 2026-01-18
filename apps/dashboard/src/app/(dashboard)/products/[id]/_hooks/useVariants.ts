'use client';

/**
 * Hook to fetch variants for a product
 *
 * @see Story 3.2 - Product Variants Management
 */

import { useServerActionQuery } from '@/lib/server-action-hooks';
import { getVariantsAction } from '../_actions';

export const VARIANTS_QUERY_KEY = (productId: string) =>
  ['products', productId, 'variants'] as const;

export interface UseVariantsOptions {
  productId: string;
  enabled?: boolean;
}

export function useVariants({ productId, enabled = true }: UseVariantsOptions) {
  return useServerActionQuery(getVariantsAction, {
    queryKey: VARIANTS_QUERY_KEY(productId),
    input: productId,
    enabled: enabled && !!productId,
  });
}
