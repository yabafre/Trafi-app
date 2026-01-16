'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useServerActionMutation } from '@/lib/server-action-hooks'
import { inviteUserAction } from '../_actions/user-actions'
import { toast } from 'sonner'

/**
 * Hook for inviting a new user
 * Automatically invalidates users query on success
 */
export function useInviteUser() {
  const queryClient = useQueryClient()

  return useServerActionMutation(inviteUserAction, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Invitation envoyée')
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de l\'invitation')
    },
  })
}
