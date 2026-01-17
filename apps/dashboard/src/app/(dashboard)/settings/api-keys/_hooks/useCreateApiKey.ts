'use client'

import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useServerActionMutation } from '@/lib/server-action-hooks'
import { createApiKeyAction } from '../_actions/api-key-actions'
import { toast } from 'sonner'

/**
 * Hook for creating a new API key
 * Manages the created key state (shown only once)
 * Automatically invalidates api-keys query on success
 */
export function useCreateApiKey() {
  const queryClient = useQueryClient()
  const [createdKey, setCreatedKey] = useState<string | null>(null)

  const mutation = useServerActionMutation(createApiKeyAction, {
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      setCreatedKey(data.key) // Store the key to show in modal
      toast.success('Cle API creee')
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la creation')
    },
  })

  const clearCreatedKey = useCallback(() => {
    setCreatedKey(null)
  }, [])

  return {
    ...mutation,
    createdKey,
    clearCreatedKey,
  }
}
