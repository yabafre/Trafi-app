'use client';

/**
 * Hook to update media metadata (alt text, primary status)
 *
 * @see Story 3.3 - Product Media Upload
 */

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useServerActionMutation } from '@/lib/server-action-hooks';
import { updateMediaAction } from '../_actions';
import { MEDIA_QUERY_KEY } from './useMedia';
import { useQueryClient } from '@tanstack/react-query';

export interface UseUpdateMediaOptions {
  productId: string;
  onSuccess?: () => void;
}

export function useUpdateMedia({ productId, onSuccess }: UseUpdateMediaOptions) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useServerActionMutation(updateMediaAction, {
    onSuccess: () => {
      toast.success('Image mise a jour');
      // Invalidate media list
      queryClient.invalidateQueries({ queryKey: MEDIA_QUERY_KEY(productId) });
      router.refresh();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de la mise a jour de l'image");
    },
  });
}
