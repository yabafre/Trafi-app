'use client'

import { useState } from 'react'
import { MoreHorizontal, UserCog, UserMinus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserStatusBadge } from './UserStatusBadge'
import { UserRoleBadge } from './UserRoleBadge'
import { UsersTableSkeleton } from './UsersTableSkeleton'
import { useUsers } from '../_hooks'
import { usePermissions } from '@/lib/hooks'
import type { UserResponse } from '@trafi/validators'

interface UsersTableProps {
  onEditRole: (user: UserResponse) => void
  onDeactivate: (user: UserResponse) => void
}

export function UsersTable({ onEditRole, onDeactivate }: UsersTableProps) {
  const { data, isLoading, error } = useUsers()
  const { hasPermission } = usePermissions()
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  const canManageUsers = hasPermission('users:manage')

  if (isLoading) {
    return <UsersTableSkeleton />
  }

  if (error) {
    return (
      <div className="border border-destructive p-8 text-center">
        <p className="font-mono text-destructive text-sm">
          ERREUR: {error.message}
        </p>
      </div>
    )
  }

  if (!data || data.users.length === 0) {
    return (
      <div className="border border-border p-8 text-center">
        <p className="font-mono text-muted-foreground text-sm">
          AUCUN UTILISATEUR TROUVE
        </p>
      </div>
    )
  }

  return (
    <div className="border border-border">
      {/* Header */}
      <div className="flex border-b border-border bg-secondary/30">
        <div className="flex-1 px-4 py-3">
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            EMAIL
          </span>
        </div>
        <div className="flex-1 px-4 py-3">
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            NOM
          </span>
        </div>
        <div className="flex-1 px-4 py-3">
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            ROLE
          </span>
        </div>
        <div className="flex-1 px-4 py-3">
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            STATUT
          </span>
        </div>
        {canManageUsers && (
          <div className="w-24 px-4 py-3">
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              ACTIONS
            </span>
          </div>
        )}
      </div>

      {/* Rows */}
      {data.users.map((user) => (
        <div
          key={user.id}
          className="flex border-b border-border last:border-b-0 hover:bg-secondary/20 transition-colors"
        >
          <div className="flex-1 px-4 py-4">
            <span className="font-mono text-sm text-foreground">
              {user.email}
            </span>
          </div>
          <div className="flex-1 px-4 py-4">
            <span className="text-sm text-foreground">
              {user.name || '-'}
            </span>
          </div>
          <div className="flex-1 px-4 py-4">
            <UserRoleBadge role={user.role} />
          </div>
          <div className="flex-1 px-4 py-4">
            <UserStatusBadge status={user.status} />
          </div>
          {canManageUsers && (
            <div className="w-24 px-4 py-4 relative">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setOpenDropdown(openDropdown === user.id ? null : user.id)}
                data-testid={`user-actions-${user.id}`}
              >
                <MoreHorizontal className="size-4" />
              </Button>

              {openDropdown === user.id && (
                <div
                  className="absolute right-4 top-12 z-10 w-48 border border-border bg-background shadow-lg"
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <button
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm hover:bg-secondary transition-colors"
                    onClick={() => {
                      onEditRole(user)
                      setOpenDropdown(null)
                    }}
                  >
                    <UserCog className="size-4" />
                    <span>Modifier le rôle</span>
                  </button>
                  {user.status === 'ACTIVE' && (
                    <button
                      className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-destructive hover:bg-destructive/10 transition-colors"
                      onClick={() => {
                        onDeactivate(user)
                        setOpenDropdown(null)
                      }}
                    >
                      <UserMinus className="size-4" />
                      <span>Désactiver</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Footer - Pagination Info */}
      <div className="flex items-center justify-between border-t border-border px-4 py-3 bg-secondary/30">
        <span className="font-mono text-xs text-muted-foreground">
          {data.total} utilisateur{data.total > 1 ? 's' : ''}
        </span>
        <span className="font-mono text-xs text-muted-foreground">
          Page {data.page}/{data.totalPages}
        </span>
      </div>
    </div>
  )
}
