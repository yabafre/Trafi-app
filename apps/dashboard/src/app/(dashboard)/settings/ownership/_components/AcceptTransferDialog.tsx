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
import { Shield, Loader2 } from 'lucide-react'
import { useConfirmTransfer } from '../_hooks'

interface AcceptTransferDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transferId: string
  fromUserName: string
}

/**
 * Dialog for target user to accept ownership transfer
 * AC: #3 - Target accepts with password confirmation
 */
export function AcceptTransferDialog({
  open,
  onOpenChange,
  transferId,
  fromUserName,
}: AcceptTransferDialogProps) {
  const [password, setPassword] = useState('')
  const { mutate: confirm, isPending } = useConfirmTransfer()

  const handleAccept = () => {
    confirm(
      { transferId, password },
      {
        onSuccess: () => {
          setPassword('')
          onOpenChange(false)
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
            <Shield className="w-5 h-5 text-[#CCFF00]" />
            ACCEPTER LA PROPRIETE
          </DialogTitle>
          <DialogDescription className="text-[#999999]">
            <span className="text-white font-medium">{fromUserName}</span> souhaite
            vous transferer la propriete de cette boutique.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 bg-[#CCFF00]/10 border border-[#CCFF00]/20">
            <p className="text-sm text-[#CCFF00]">
              En acceptant, vous deviendrez le proprietaire de cette boutique avec
              tous les droits associes. L&apos;ancien proprietaire sera retrograde au
              role Admin.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accept-password" className="text-[#999999] font-mono text-sm">
              VOTRE MOT DE PASSE
            </Label>
            <Input
              id="accept-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Confirmez votre identite"
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
            onClick={handleAccept}
            disabled={!password || isPending}
            className="bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90 rounded-none font-mono"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                CONFIRMATION...
              </>
            ) : (
              'ACCEPTER'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
