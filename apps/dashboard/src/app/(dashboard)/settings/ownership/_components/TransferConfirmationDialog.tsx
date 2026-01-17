'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { useTransferOwnership } from '../_hooks'

interface TransferConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetUser: {
    id: string
    name: string | null
    email: string
    role: string
  }
  onSuccess: () => void
}

/**
 * Password confirmation dialog for initiating ownership transfer
 * AC: #2 - Requires current owner password confirmation
 */
export function TransferConfirmationDialog({
  open,
  onOpenChange,
  targetUser,
  onSuccess,
}: TransferConfirmationDialogProps) {
  const [password, setPassword] = useState('')
  const { mutate: transfer, isPending } = useTransferOwnership()

  const handleConfirm = () => {
    transfer(
      { targetUserId: targetUser.id, password },
      {
        onSuccess: () => {
          setPassword('')
          onSuccess()
        },
      }
    )
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setPassword('')
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-black border-[#333333] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#FF3366]" />
            CONFIRMER LE TRANSFERT
          </DialogTitle>
          <DialogDescription className="text-[#999999]">
            Vous etes sur le point de transferer la propriete a{' '}
            <span className="text-white font-medium">
              {targetUser.name || targetUser.email}
            </span>
            . Cette action est irreversible.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 bg-[#FF3366]/10 border border-[#FF3366]/20">
            <p className="text-sm text-[#FF3366]">
              Apres confirmation, le nouvel utilisateur aura 72 heures pour
              accepter le transfert. Vous serez retrograde au role Admin.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-[#999999] font-mono text-sm">
              MOT DE PASSE ACTUEL
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Entrez votre mot de passe"
              className="border-[#333333] bg-transparent rounded-none"
              disabled={isPending}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
            className="border-[#333333] bg-transparent rounded-none font-mono"
          >
            ANNULER
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!password || isPending}
            className="bg-[#FF3366] text-white hover:bg-[#FF3366]/90 rounded-none font-mono"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                TRANSFERT...
              </>
            ) : (
              'CONFIRMER'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
