'use client';

/**
 * Hook to create a single variant
 *
 * @see Story 3.2 - Product Variants Management
 */

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useServerActionMutation } from '@/lib/server-action-hooks';
import { createVariantAction } from '../_actions';
import { VARIANTS_QUERY_KEY } from './useVariants';
import { useQueryClient } from '@tanstack/react-query';

export interface UseCreateVariantOptions {
  productId: string;
  onSuccess?: () => void;
}

export function useCreateVariant({ productId, onSuccess }: UseCreateVariantOptions) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useServerActionMutation(createVariantAction, {
    onSuccess: () => {
      toast.success('Variante creee');
      // Invalidate variants list
      queryClient.invalidateQueries({ queryKey: VARIANTS_QUERY_KEY(productId) });
      router.refresh();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la creation de la variante');
    },
  });
}
