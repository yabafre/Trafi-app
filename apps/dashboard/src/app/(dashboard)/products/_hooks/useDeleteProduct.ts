'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useServerActionMutation } from '@/lib/server-action-hooks'
import { deleteProductAction } from '../_actions/product-actions'
import { toast } from 'sonner'

/**
 * Hook for deleting a product
 * Automatically invalidates products cache and redirects on success
 *
 * @see Story 3.1 - Product Model and Basic CRUD
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useServerActionMutation(deleteProductAction, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Produit supprimé')
      router.push('/products')
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la suppression')
    },
  })
}
