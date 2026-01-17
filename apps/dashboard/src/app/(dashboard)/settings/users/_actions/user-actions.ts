'use server'

import { createServerAction } from 'zsa'
import { createAuthenticatedTrpcClient } from '@/lib/trpc'
import {
  ListUsersSchema,
  InviteUserSchema,
  UpdateUserRoleSchema,
  type UsersListResponse,
  type UserResponse,
} from '@trafi/validators'
import { z } from '@trafi/zod'

/**
 * Get users list action
 * Uses tRPC for type-safe API communication
 */
export const getUsersAction = createServerAction()
  .input(ListUsersSchema)
  .handler(async ({ input }): Promise<UsersListResponse> => {
    const trpc = await createAuthenticatedTrpcClient()
    return await trpc.users.list.query(input)
  })

/**
 * Invite user action
 * Uses tRPC for type-safe API communication
 */
export const inviteUserAction = createServerAction()
  .input(InviteUserSchema.omit({ storeId: true }))
  .handler(async ({ input }): Promise<UserResponse> => {
    const trpc = await createAuthenticatedTrpcClient()
    return await trpc.users.invite.mutate(input)
  })

/**
 * Update user role action
 * Uses tRPC for type-safe API communication
 */
export const updateUserRoleAction = createServerAction()
  .input(UpdateUserRoleSchema)
  .handler(async ({ input }): Promise<UserResponse> => {
    const trpc = await createAuthenticatedTrpcClient()
    return await trpc.users.updateRole.mutate(input)
  })

/**
 * Deactivate user action
 * Uses tRPC for type-safe API communication
 */
export const deactivateUserAction = createServerAction()
  .input(z.object({ userId: z.string().min(1) }))
  .handler(async ({ input }): Promise<UserResponse> => {
    const trpc = await createAuthenticatedTrpcClient()
    return await trpc.users.deactivate.mutate(input)
  })
