'use client'

import { useServerActionQuery } from '@/lib/server-action-hooks'
import {
  getGiftCardTemplateListAction,
  getGiftCardTemplatesForSelectAction,
} from '../_actions/gift-card-template-actions'

interface UseGiftCardTemplateListOptions {
  isActive?: boolean
  search?: string
  page?: number
  limit?: number
}

/**
 * Hook for fetching paginated list of gift card templates
 *
 * @see Story 3.10 - Gift Cards (AC1, AC6)
 */
export function useGiftCardTemplateList(options: UseGiftCardTemplateListOptions = {}) {
  return useServerActionQuery(getGiftCardTemplateListAction, {
    input: options,
    queryKey: ['giftCardTemplates', 'list', options],
  })
}

/**
 * Hook for fetching templates for dropdown/select usage
 * Returns active templates with minimal data
 */
export function useGiftCardTemplatesForSelect() {
  return useServerActionQuery(getGiftCardTemplatesForSelectAction, {
    input: undefined,
    queryKey: ['giftCardTemplates', 'forSelect'],
  })
}
