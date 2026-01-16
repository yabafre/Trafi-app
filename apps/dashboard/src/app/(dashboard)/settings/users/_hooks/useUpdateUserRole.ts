'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useServerActionMutation } from '@/lib/server-action-hooks'
import { updateUserRoleAction } from '../_actions/user-actions'
import { toast } from 'sonner'

/**
 * Hook for updating a user's role
 * Automatically invalidates users query on success
 */
export function useUpdateUserRole() {
  const queryClient = useQueryClient()

  return useServerActionMutation(updateUserRoleAction, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Rôle mis à jour')
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la mise à jour du rôle')
    },
  })
}
