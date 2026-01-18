'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useServerActionMutation } from '@/lib/server-action-hooks'
import { createCollectionAction } from '../_actions/collection-actions'
import { toast } from 'sonner'

/**
 * Hook for creating a new collection
 * Automatically invalidates collection cache on success
 *
 * @see Story 3.5 - Collections Management
 */
export function useCreateCollection() {
  const queryClient = useQueryClient()

  return useServerActionMutation(createCollectionAction, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['collections'] })
      toast.success('Collection created successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create collection')
    },
  })
}
