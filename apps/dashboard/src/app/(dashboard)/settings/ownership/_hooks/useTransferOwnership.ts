'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useServerActionMutation } from '@/lib/server-action-hooks'
import { initiateTransferAction } from '../_actions/ownership-actions'
import { toast } from 'sonner'

/**
 * Hook for initiating an ownership transfer
 * Invalidates pending-transfer query on success
 */
export function useTransferOwnership() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useServerActionMutation(initiateTransferAction, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['pending-transfer'] })
      toast.success('Demande de transfert envoyée')
      router.refresh()
    },
    onError: (error) => {
      if (error.message.includes('password')) {
        toast.error('Mot de passe incorrect')
      } else if (error.message.includes('pending')) {
        toast.error('Un transfert est deja en cours')
      } else {
        toast.error(error.message || 'Erreur lors du transfert')
      }
    },
  })
}
