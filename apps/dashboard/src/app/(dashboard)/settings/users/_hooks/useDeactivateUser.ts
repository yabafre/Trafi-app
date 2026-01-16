'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useServerActionMutation } from '@/lib/server-action-hooks'
import { deactivateUserAction } from '../_actions/user-actions'
import { toast } from 'sonner'

/**
 * Hook for deactivating a user
 * Automatically invalidates users query on success
 */
export function useDeactivateUser() {
  const queryClient = useQueryClient()

  return useServerActionMutation(deactivateUserAction, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Utilisateur désactivé')
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la désactivation')
    },
  })
}
