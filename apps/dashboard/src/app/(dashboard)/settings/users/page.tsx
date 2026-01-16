'use client'

import { useState } from 'react'
import {
  UsersTable,
  InviteUserDialog,
  EditUserRoleDialog,
  DeactivateUserDialog,
} from './_components'
import { usePermissions } from '@/lib/hooks'
import type { UserResponse } from '@trafi/validators'

export default function UsersPage() {
  const { hasPermission } = usePermissions()
  const canInvite = hasPermission('users:invite')

  // Dialog state
  const [editRoleUser, setEditRoleUser] = useState<UserResponse | null>(null)
  const [deactivateUser, setDeactivateUser] = useState<UserResponse | null>(null)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-2xl uppercase tracking-wider">
            GESTION DES UTILISATEURS
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gérez les utilisateurs et leurs rôles pour votre store.
          </p>
        </div>
        {canInvite && <InviteUserDialog />}
      </div>

      {/* Users Table */}
      <UsersTable
        onEditRole={(user) => setEditRoleUser(user)}
        onDeactivate={(user) => setDeactivateUser(user)}
      />

      {/* Edit Role Dialog */}
      <EditUserRoleDialog
        user={editRoleUser}
        open={!!editRoleUser}
        onOpenChange={(open) => !open && setEditRoleUser(null)}
      />

      {/* Deactivate User Dialog */}
      <DeactivateUserDialog
        user={deactivateUser}
        open={!!deactivateUser}
        onOpenChange={(open) => !open && setDeactivateUser(null)}
      />
    </div>
  )
}
