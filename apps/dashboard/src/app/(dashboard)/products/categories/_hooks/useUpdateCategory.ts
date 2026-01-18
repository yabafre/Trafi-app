'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useServerActionMutation } from '@/lib/server-action-hooks'
import { updateCategoryAction } from '../_actions/category-actions'
import { toast } from 'sonner'

/**
 * Hook for updating a category
 * Automatically invalidates category cache on success
 *
 * @see Story 3.4 - Categories Management
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useServerActionMutation(updateCategoryAction, {
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ['categories'] })
      await queryClient.invalidateQueries({ queryKey: ['categories', data.id] })
      toast.success('Category updated successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update category')
    },
  })
}
