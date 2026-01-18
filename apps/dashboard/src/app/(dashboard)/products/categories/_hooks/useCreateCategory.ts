'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useServerActionMutation } from '@/lib/server-action-hooks'
import { createCategoryAction } from '../_actions/category-actions'
import { toast } from 'sonner'

/**
 * Hook for creating a new category
 * Automatically invalidates category cache on success
 *
 * @see Story 3.4 - Categories Management
 */
export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useServerActionMutation(createCategoryAction, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Category created successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create category')
    },
  })
}
