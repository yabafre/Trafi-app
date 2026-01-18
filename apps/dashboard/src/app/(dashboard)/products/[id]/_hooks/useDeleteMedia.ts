'use client';

/**
 * Hook to delete media
 *
 * @see Story 3.3 - Product Media Upload
 */

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useServerActionMutation } from '@/lib/server-action-hooks';
import { deleteMediaAction } from '../_actions';
import { MEDIA_QUERY_KEY } from './useMedia';
import { useQueryClient } from '@tanstack/react-query';

export interface UseDeleteMediaOptions {
  productId: string;
  onSuccess?: () => void;
}

export function useDeleteMedia({ productId, onSuccess }: UseDeleteMediaOptions) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useServerActionMutation(deleteMediaAction, {
    onSuccess: () => {
      toast.success('Image supprimee');
      // Invalidate media list
      queryClient.invalidateQueries({ queryKey: MEDIA_QUERY_KEY(productId) });
      router.refresh();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de la suppression de l'image");
    },
  });
}
