'use client';

/**
 * Hook to bulk create variants from option combinations
 *
 * @see Story 3.2 - Product Variants Management
 */

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useServerActionMutation } from '@/lib/server-action-hooks';
import { bulkCreateVariantsAction } from '../_actions';
import { VARIANTS_QUERY_KEY } from './useVariants';
import { useQueryClient } from '@tanstack/react-query';

export interface UseBulkCreateVariantsOptions {
  productId: string;
  onSuccess?: (count: number) => void;
}

export function useBulkCreateVariants({
  productId,
  onSuccess,
}: UseBulkCreateVariantsOptions) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useServerActionMutation(bulkCreateVariantsAction, {
    onSuccess: (data) => {
      const count = Array.isArray(data) ? data.length : 0;
      toast.success(`${count} variantes creees`);
      // Invalidate variants list
      queryClient.invalidateQueries({ queryKey: VARIANTS_QUERY_KEY(productId) });
      router.refresh();
      onSuccess?.(count);
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la creation des variantes');
    },
  });
}
