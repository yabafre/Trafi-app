'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useServerActionMutation } from '@/lib/server-action-hooks'
import {
  addProductsToCollectionAction,
  removeProductsFromCollectionAction,
  reorderCollectionProductsAction,
} from '../_actions/collection-actions'
import { toast } from 'sonner'

/**
 * Hook for adding products to a collection
 * Automatically invalidates collection and products cache on success
 *
 * @see Story 3.5 - Collections Management
 */
export function useAddProductsToCollection() {
  const queryClient = useQueryClient()

  return useServerActionMutation(addProductsToCollectionAction, {
    onSuccess: async (_, { collectionId }) => {
      await queryClient.invalidateQueries({ queryKey: ['collections'] })
      await queryClient.invalidateQueries({ queryKey: ['collections', collectionId] })
      await queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Products added to collection')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add products')
    },
  })
}

/**
 * Hook for removing products from a collection
 * Automatically invalidates collection and products cache on success
 *
 * @see Story 3.5 - Collections Management
 */
export function useRemoveProductsFromCollection() {
  const queryClient = useQueryClient()

  return useServerActionMutation(removeProductsFromCollectionAction, {
    onSuccess: async (_, { collectionId }) => {
      await queryClient.invalidateQueries({ queryKey: ['collections'] })
      await queryClient.invalidateQueries({ queryKey: ['collections', collectionId] })
      await queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Products removed from collection')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to remove products')
    },
  })
}

/**
 * Hook for reordering products within a collection
 * Automatically invalidates collection cache on success
 *
 * @see Story 3.5 - Collections Management
 */
export function useReorderCollectionProducts() {
  const queryClient = useQueryClient()

  return useServerActionMutation(reorderCollectionProductsAction, {
    onSuccess: async (_, { collectionId }) => {
      await queryClient.invalidateQueries({ queryKey: ['collections', collectionId] })
      toast.success('Products reordered')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to reorder products')
    },
  })
}
