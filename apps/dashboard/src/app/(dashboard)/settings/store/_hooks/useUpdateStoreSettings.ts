'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useServerActionMutation } from '@/lib/server-action-hooks'
import { updateStoreSettingsAction } from '../_actions/settings-actions'
import { toast } from 'sonner'

/**
 * Hook for updating store settings
 * Automatically invalidates store-settings query on success
 *
 * AC #4: queryClient.invalidateQueries({ queryKey: ['store-settings'] })
 * enables real-time sidebar updates via React Query cache
 */
export function useUpdateStoreSettings() {
  const queryClient = useQueryClient()

  return useServerActionMutation(updateStoreSettingsAction, {
    onSuccess: async () => {
      // Invalidate to refetch latest settings
      await queryClient.invalidateQueries({ queryKey: ['store-settings'] })
      toast.success('Paramètres enregistrés')
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la sauvegarde')
    },
  })
}
