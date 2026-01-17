'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useServerActionMutation } from '@/lib/server-action-hooks'
import { revokeApiKeyAction } from '../_actions/api-key-actions'
import { toast } from 'sonner'

/**
 * Hook for revoking an API key
 * Automatically invalidates api-keys query on success
 */
export function useRevokeApiKey() {
  const queryClient = useQueryClient()

  return useServerActionMutation(revokeApiKeyAction, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      toast.success('Cle API revoquee')
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la revocation')
    },
  })
}
