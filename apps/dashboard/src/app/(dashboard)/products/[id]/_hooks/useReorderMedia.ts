'use client';

/**
 * Hook to reorder media within a product
 *
 * @see Story 3.3 - Product Media Upload
 */

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useServerActionMutation } from '@/lib/server-action-hooks';
import { reorderMediaAction } from '../_actions';
import { MEDIA_QUERY_KEY } from './useMedia';
import { useQueryClient } from '@tanstack/react-query';

export interface UseReorderMediaOptions {
  productId: string;
  onSuccess?: () => void;
}

export function useReorderMedia({ productId, onSuccess }: UseReorderMediaOptions) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useServerActionMutation(reorderMediaAction, {
    onSuccess: () => {
      toast.success('Ordre des images mis a jour');
      // Invalidate media list
      queryClient.invalidateQueries({ queryKey: MEDIA_QUERY_KEY(productId) });
      router.refresh();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de la reorganisation des images");
    },
  });
}
