'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useServerActionMutation } from '@/lib/server-action-hooks'
import {
  assignProductsToCategoryAction,
  removeProductsFromCategoryAction,
} from '../_actions/category-actions'
import { toast } from 'sonner'

/**
 * Hook for assigning products to a category
 *
 * @see Story 3.4 - Categories Management
 */
export function useAssignProductsToCategory() {
  const queryClient = useQueryClient()

  return useServerActionMutation(assignProductsToCategoryAction, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['categories'] })
      await queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Products assigned to category')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to assign products')
    },
  })
}

/**
 * Hook for removing products from a category
 *
 * @see Story 3.4 - Categories Management
 */
export function useRemoveProductsFromCategory() {
  const queryClient = useQueryClient()

  return useServerActionMutation(removeProductsFromCategoryAction, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['categories'] })
      await queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Products removed from category')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to remove products')
    },
  })
}
