'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useServerActionMutation } from '@/lib/server-action-hooks'
import { reorderCategoryAction } from '../_actions/category-actions'
import { toast } from 'sonner'

/**
 * Hook for reordering a category (move to new parent/position)
 * Automatically invalidates category cache on success
 *
 * @see Story 3.4 - Categories Management
 */
export function useReorderCategory() {
  const queryClient = useQueryClient()

  return useServerActionMutation(reorderCategoryAction, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Category reordered successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to reorder category')
    },
  })
}
