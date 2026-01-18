'use server'

import { createServerAction } from 'zsa'
import { createAuthenticatedTrpcClient } from '@/lib/trpc'

/**
 * Store info returned by myStores endpoint
 */
export interface StoreInfo {
  id: string
  name: string
  slug: string
  role: string
  isCurrent: boolean
}

/**
 * Response from get my stores action
 */
export interface GetMyStoresResponse {
  stores: StoreInfo[]
}

/**
 * Get all stores the current user has access to
 * Uses tRPC auth.myStores endpoint
 *
 * @see Story 2-R2 - Store Switching UI
 */
export const getMyStoresAction = createServerAction()
  .handler(async (): Promise<GetMyStoresResponse> => {
    const trpc = await createAuthenticatedTrpcClient()
    return await trpc.auth.myStores.query()
  })
