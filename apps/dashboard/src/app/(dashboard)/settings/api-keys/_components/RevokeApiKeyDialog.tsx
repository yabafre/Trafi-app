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
import { useRevokeApiKey } from '../_hooks'
import type { ApiKeyResponse } from '@trafi/validators'

interface RevokeApiKeyDialogProps {
  open: boolean
  onClose: () => void
  apiKey: ApiKeyResponse | null
}

export function RevokeApiKeyDialog({ open, onClose, apiKey }: RevokeApiKeyDialogProps) {
  const { mutate: revokeApiKey, isPending } = useRevokeApiKey()

  const handleRevoke = () => {
    if (!apiKey) return

    revokeApiKey({ keyId: apiKey.id }, {
      onSuccess: () => {
        onClose()
      },
    })
  }

  if (!apiKey) return null

  return (
    <Dialog open={open} onOpenChange={(newOpen) => !newOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-destructive" />
            <span>REVOQUER LA CLE API</span>
          </DialogTitle>
          <DialogDescription>
            Etes-vous sur de vouloir revoquer cette cle API ?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Key Info */}
          <div className="border border-border bg-secondary/20 p-4">
            <div className="grid gap-2">
              <div className="flex justify-between">
                <span className="font-mono text-xs text-muted-foreground">NOM</span>
                <span className="font-mono text-sm">{apiKey.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono text-xs text-muted-foreground">CLE</span>
                <span className="font-mono text-sm text-muted-foreground">
                  {apiKey.keyPrefix}...{apiKey.lastFourChars}
                </span>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="mt-4 flex items-start gap-3 border border-destructive bg-destructive/10 p-4">
            <AlertTriangle className="size-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold text-destructive">IRREVERSIBLE</p>
              <p className="text-muted-foreground">
                Cette action est irreversible. Toutes les applications utilisant cette cle
                perdront immediatement l'acces.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            ANNULER
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleRevoke}
            disabled={isPending}
            data-testid="confirm-revoke-api-key"
          >
            {isPending ? 'REVOCATION...' : 'REVOQUER'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
