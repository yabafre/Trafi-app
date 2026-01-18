'use client';

/**
 * Hook to delete a variant
 *
 * @see Story 3.2 - Product Variants Management
 */

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useServerActionMutation } from '@/lib/server-action-hooks';
import { deleteVariantAction } from '../_actions';
import { VARIANTS_QUERY_KEY } from './useVariants';
import { useQueryClient } from '@tanstack/react-query';

export interface UseDeleteVariantOptions {
  productId: string;
  onSuccess?: () => void;
}

export function useDeleteVariant({ productId, onSuccess }: UseDeleteVariantOptions) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useServerActionMutation(deleteVariantAction, {
    onSuccess: () => {
      toast.success('Variante supprimee');
      // Invalidate variants list
      queryClient.invalidateQueries({ queryKey: VARIANTS_QUERY_KEY(productId) });
      router.refresh();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la suppression de la variante');
    },
  });
}
