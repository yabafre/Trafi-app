'use server'

import { createServerAction } from 'zsa'
import { createAuthenticatedTrpcClient } from '@/lib/trpc'
import { setAuthCookies } from '@/lib/auth'
import { generateCsrfToken } from '@/lib/csrf'
import { z } from '@trafi/zod'

/**
 * Input schema for switch store action
 */
const SwitchStoreInputSchema = z.object({
  storeId: z.string().min(1, 'Store ID is required'),
})

/**
 * Response from switch store action
 */
export interface SwitchStoreResponse {
  success: boolean
  user: {
    id: string
    email: string
    name: string | null
    role: string
    storeId: string
  }
}

/**
 * Switch to a different store
 * Updates auth tokens and cookies for the new store context
 *
 * @see Story 2-R2 - Store Switching UI
 */
export const switchStoreAction = createServerAction()
  .input(SwitchStoreInputSchema)
  .handler(async ({ input }): Promise<SwitchStoreResponse> => {
    const trpc = await createAuthenticatedTrpcClient()

    // Call switchStore endpoint - returns new tokens
    const result = await trpc.auth.switchStore.mutate({
      storeId: input.storeId,
    })

    // Update cookies with new tokens
    const csrfToken = generateCsrfToken()
    await setAuthCookies(result.accessToken, result.refreshToken, csrfToken)

    return {
      success: result.success,
      user: result.user,
    }
  })
