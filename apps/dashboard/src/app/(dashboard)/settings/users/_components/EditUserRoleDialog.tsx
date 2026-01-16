'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useUpdateUserRole } from '../_hooks'
import { usePermissions } from '@/lib/hooks'
import type { UserResponse, UserRole } from '@trafi/validators'

const ROLE_OPTIONS: { value: UserRole; label: string; description: string }[] = [
  { value: 'VIEWER', label: 'Viewer', description: 'Lecture seule' },
  { value: 'EDITOR', label: 'Editor', description: 'Modifier le contenu' },
  { value: 'ADMIN', label: 'Admin', description: 'Gestion complète' },
  { value: 'OWNER', label: 'Owner', description: 'Propriétaire du store' },
]

const ROLE_HIERARCHY: Record<UserRole, number> = {
  VIEWER: 0,
  EDITOR: 1,
  ADMIN: 2,
  OWNER: 3,
}

interface EditUserRoleDialogProps {
  user: UserResponse | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditUserRoleDialog({ user, open, onOpenChange }: EditUserRoleDialogProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>('VIEWER')

  const { mutate: updateRole, isPending } = useUpdateUserRole()
  const { userRole } = usePermissions()

  // Set initial role when user changes
  useEffect(() => {
    if (user) {
      setSelectedRole(user.role)
    }
  }, [user])

  // Filter roles based on current user's role (can only assign roles below their own)
  // Exception: OWNER can assign OWNER to transfer ownership
  const availableRoles = ROLE_OPTIONS.filter((option) => {
    const currentUserLevel = ROLE_HIERARCHY[userRole as UserRole]
    const optionLevel = ROLE_HIERARCHY[option.value]

    // OWNER can assign any role including OWNER
    if (userRole === 'OWNER') {
      return true
    }

    // Others can only assign roles below their own
    return optionLevel < currentUserLevel
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || selectedRole === user.role) {
      return
    }

    updateRole(
      { userId: user.id, role: selectedRole },
      {
        onSuccess: () => {
          onOpenChange(false)
        },
      }
    )
  }

  const hasChanged = user && selectedRole !== user.role

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>MODIFIER LE ROLE</DialogTitle>
            <DialogDescription>
              Modifier le rôle de{' '}
              <span className="font-mono text-foreground">{user?.email}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Current Role Display */}
            <div className="grid gap-2">
              <Label>ROLE ACTUEL</Label>
              <div className="border border-border bg-secondary/30 px-3 py-2">
                <span className="font-mono text-sm uppercase">{user?.role}</span>
              </div>
            </div>

            {/* New Role Select */}
            <div className="grid gap-2">
              <Label htmlFor="new-role">NOUVEAU ROLE</Label>
              <Select
                value={selectedRole}
                onValueChange={(value) => setSelectedRole(value as UserRole)}
                disabled={isPending}
              >
                <SelectTrigger data-testid="edit-role-select">
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Warning for OWNER transfer */}
            {userRole === 'OWNER' && selectedRole === 'OWNER' && user?.role !== 'OWNER' && (
              <div className="border border-warning bg-warning/10 p-3">
                <p className="font-mono text-xs text-warning">
                  ATTENTION: Transférer le rôle Owner vous rétrograde en ADMIN.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              ANNULER
            </Button>
            <Button
              type="submit"
              disabled={isPending || !hasChanged || availableRoles.length === 0}
            >
              {isPending ? 'MODIFICATION...' : 'CONFIRMER'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
