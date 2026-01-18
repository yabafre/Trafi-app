'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useServerActionMutation } from '@/lib/server-action-hooks'
import { deleteCategoryAction } from '../_actions/category-actions'
import { toast } from 'sonner'

/**
 * Hook for deleting a category
 * Automatically invalidates category and products cache on success
 *
 * @see Story 3.4 - Categories Management
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useServerActionMutation(deleteCategoryAction, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['categories'] })
      await queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Category deleted successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete category')
    },
  })
}
