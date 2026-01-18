'use client';

/**
 * Hook to fetch media for a product
 *
 * @see Story 3.3 - Product Media Upload
 */

import { useServerActionQuery } from '@/lib/server-action-hooks';
import { getMediaAction } from '../_actions';

export const MEDIA_QUERY_KEY = (productId: string) =>
  ['products', productId, 'media'] as const;

export interface UseMediaOptions {
  productId: string;
  enabled?: boolean;
}

export function useMedia({ productId, enabled = true }: UseMediaOptions) {
  return useServerActionQuery(getMediaAction, {
    queryKey: MEDIA_QUERY_KEY(productId),
    input: productId,
    enabled: enabled && !!productId,
  });
}
