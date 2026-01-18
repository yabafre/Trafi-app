'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useServerActionMutation } from '@/lib/server-action-hooks'
import { updateProductAction } from '../_actions/product-actions'
import { toast } from 'sonner'

/**
 * Hook for updating an existing product
 * Automatically invalidates product and products cache on success
 *
 * @see Story 3.1 - Product Model and Basic CRUD
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useServerActionMutation(updateProductAction, {
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ['products'] })
      await queryClient.invalidateQueries({ queryKey: ['product', data.id] })
      toast.success('Produit mis à jour')
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la mise à jour')
    },
  })
}
