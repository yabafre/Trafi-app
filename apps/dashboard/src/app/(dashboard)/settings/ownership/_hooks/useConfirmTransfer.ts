'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useServerActionMutation } from '@/lib/server-action-hooks'
import { confirmTransferAction } from '../_actions/ownership-actions'
import { toast } from 'sonner'

/**
 * Hook for confirming an ownership transfer (target user accepts)
 * Invalidates pending-transfer and auth queries on success
 */
export function useConfirmTransfer() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useServerActionMutation(confirmTransferAction, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['pending-transfer'] })
      await queryClient.invalidateQueries({ queryKey: ['auth'] })
      toast.success('Transfert confirmé. Vous êtes maintenant propriétaire.')
      router.refresh()
    },
    onError: (error) => {
      if (error.message.includes('password')) {
        toast.error('Mot de passe incorrect')
      } else {
        toast.error(error.message || 'Erreur lors de la confirmation')
      }
    },
  })
}
