'use server'

import { createServerAction } from 'zsa'
import { createAuthenticatedTrpcClient } from '@/lib/trpc'
import {
  InitiateTransferSchema,
  ConfirmTransferSchema,
  type TransferResponse,
} from '@trafi/validators'
import { z } from '@trafi/zod'

/**
 * Get pending ownership transfer for current user
 * Returns null if no pending transfer exists
 * Uses tRPC for type-safe API communication
 */
export const getPendingTransferAction = createServerAction()
  .handler(async (): Promise<TransferResponse | null> => {
    const trpc = await createAuthenticatedTrpcClient()
    return await trpc.ownership.getPending.query()
  })

/**
 * Get transfer history for the store
 * Only accessible by store Owner
 * Uses tRPC for type-safe API communication
 */
export const getTransferHistoryAction = createServerAction()
  .handler(async (): Promise<TransferResponse[]> => {
    const trpc = await createAuthenticatedTrpcClient()
    return await trpc.ownership.getHistory.query()
  })

/**
 * Initiate an ownership transfer
 * Requires current owner password for confirmation
 * Uses tRPC for type-safe API communication
 */
export const initiateTransferAction = createServerAction()
  .input(InitiateTransferSchema)
  .handler(async ({ input }): Promise<TransferResponse> => {
    const trpc = await createAuthenticatedTrpcClient()
    return await trpc.ownership.initiate.mutate(input)
  })

/**
 * Confirm an ownership transfer
 * Only the target user can confirm with their password
 * Uses tRPC for type-safe API communication
 */
export const confirmTransferAction = createServerAction()
  .input(ConfirmTransferSchema)
  .handler(async ({ input }): Promise<TransferResponse> => {
    const trpc = await createAuthenticatedTrpcClient()
    return await trpc.ownership.confirm.mutate(input)
  })

/**
 * Cancel an ownership transfer
 * Both the initiator and target can cancel
 * Uses tRPC for type-safe API communication
 */
export const cancelTransferAction = createServerAction()
  .input(z.object({ transferId: z.string() }))
  .handler(async ({ input }): Promise<TransferResponse> => {
    const trpc = await createAuthenticatedTrpcClient()
    return await trpc.ownership.cancel.mutate(input)
  })
