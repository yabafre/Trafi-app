'use client';

/**
 * Hook to update an existing variant
 *
 * @see Story 3.2 - Product Variants Management
 */

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useServerActionMutation } from '@/lib/server-action-hooks';
import { updateVariantAction } from '../_actions';
import { VARIANTS_QUERY_KEY } from './useVariants';
import { useQueryClient } from '@tanstack/react-query';

export interface UseUpdateVariantOptions {
  productId: string;
  onSuccess?: () => void;
}

export function useUpdateVariant({ productId, onSuccess }: UseUpdateVariantOptions) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useServerActionMutation(updateVariantAction, {
    onSuccess: () => {
      toast.success('Variante mise a jour');
      // Invalidate variants list
      queryClient.invalidateQueries({ queryKey: VARIANTS_QUERY_KEY(productId) });
      router.refresh();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la mise a jour de la variante');
    },
  });
}
