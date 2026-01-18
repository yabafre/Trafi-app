'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useServerActionMutation } from '@/lib/server-action-hooks'
import { updateCollectionAction } from '../_actions/collection-actions'
import { toast } from 'sonner'

/**
 * Hook for updating an existing collection
 * Automatically invalidates collection cache on success
 *
 * @see Story 3.5 - Collections Management
 */
export function useUpdateCollection() {
  const queryClient = useQueryClient()

  return useServerActionMutation(updateCollectionAction, {
    onSuccess: async (_, { id }) => {
      await queryClient.invalidateQueries({ queryKey: ['collections'] })
      await queryClient.invalidateQueries({ queryKey: ['collections', id] })
      toast.success('Collection updated successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update collection')
    },
  })
}
