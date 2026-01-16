'use client'

import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useDeactivateUser } from '../_hooks'
import type { UserResponse } from '@trafi/validators'

interface DeactivateUserDialogProps {
  user: UserResponse | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeactivateUserDialog({ user, open, onOpenChange }: DeactivateUserDialogProps) {
  const { mutate: deactivateUser, isPending } = useDeactivateUser()

  const handleConfirm = () => {
    if (!user) return

    deactivateUser(
      { userId: user.id },
      {
        onSuccess: () => {
          onOpenChange(false)
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center border border-destructive bg-destructive/10">
              <AlertTriangle className="size-5 text-destructive" />
            </div>
            <DialogTitle>DESACTIVER L&apos;UTILISATEUR</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Êtes-vous sûr de vouloir désactiver{' '}
            <span className="font-mono text-foreground">{user?.email}</span> ?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="border border-border bg-secondary/30 p-4">
            <p className="font-mono text-sm text-muted-foreground">
              L&apos;utilisateur ne pourra plus accéder au dashboard. Vous pourrez
              le réactiver ultérieurement si nécessaire.
            </p>
          </div>

          {/* Warning for OWNER */}
          {user?.role === 'OWNER' && (
            <div className="mt-4 border border-destructive bg-destructive/10 p-3">
              <p className="font-mono text-xs text-destructive">
                ATTENTION: Vous ne pouvez pas désactiver le dernier Owner du store.
                Transférez d&apos;abord le rôle Owner à un autre utilisateur.
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
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending}
            data-testid="confirm-deactivate-button"
          >
            {isPending ? 'DESACTIVATION...' : 'DESACTIVER'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
