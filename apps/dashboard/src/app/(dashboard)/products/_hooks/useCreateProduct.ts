'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useServerActionMutation } from '@/lib/server-action-hooks'
import { createProductAction } from '../_actions/product-actions'
import { toast } from 'sonner'

/**
 * Hook for creating a new product
 * Automatically invalidates products cache and redirects on success
 *
 * @see Story 3.1 - Product Model and Basic CRUD
 */
export function useCreateProduct() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useServerActionMutation(createProductAction, {
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Produit créé avec succès')
      router.push(`/products/${data.id}`)
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la création du produit')
    },
  })
}
