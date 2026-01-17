'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useServerActionMutation } from '@/lib/server-action-hooks'
import { cancelTransferAction } from '../_actions/ownership-actions'
import { toast } from 'sonner'

/**
 * Hook for cancelling an ownership transfer
 * Both the initiator and target can cancel
 */
export function useCancelTransfer() {
  const queryClient = useQueryClient()

  return useServerActionMutation(cancelTransferAction, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['pending-transfer'] })
      await queryClient.invalidateQueries({ queryKey: ['transfer-history'] })
      toast.success('Transfert annule')
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de l'annulation")
    },
  })
}
