'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Clock, X, CheckCircle, Loader2 } from 'lucide-react'
import { usePendingTransfer, useCancelTransfer } from '../_hooks'
import { AcceptTransferDialog } from './AcceptTransferDialog'

interface PendingTransferBannerProps {
  currentUserId: string
}

/**
 * Banner showing pending transfer to target user
 * AC: #3 - Target receives banner with accept/reject
 */
export function PendingTransferBanner({ currentUserId }: PendingTransferBannerProps) {
  const [showAcceptDialog, setShowAcceptDialog] = useState(false)
  const { data: pendingTransfer, isLoading } = usePendingTransfer()
  const { mutate: cancel, isPending: isCancelling } = useCancelTransfer()

  if (isLoading || !pendingTransfer) {
    return null
  }

  const transfer = pendingTransfer
  const isTarget = transfer.toUser.id === currentUserId
  const isInitiator = transfer.fromUser.id === currentUserId

  // Calculate time remaining
  const expiresAt = new Date(transfer.expiresAt)
  const now = new Date()
  const hoursRemaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)))

  const handleCancel = () => {
    cancel({ transferId: transfer.id })
  }

  if (isTarget) {
    return (
      <>
        <div className="p-4 bg-[#CCFF00]/10 border border-[#CCFF00]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-[#CCFF00] mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-[#CCFF00] font-mono uppercase tracking-wider">
                  TRANSFERT DE PROPRIETE EN ATTENTE
                </p>
                <p className="text-sm text-[#999999] mt-1">
                  {transfer.fromUser?.name || transfer.fromUser?.email} souhaite vous
                  transferer la propriete de cette boutique.
                </p>
                <p className="text-xs text-[#666666] mt-2">
                  Expire dans {hoursRemaining}h
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowAcceptDialog(true)}
                className="bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90 rounded-none font-mono text-sm"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                ACCEPTER
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isCancelling}
                className="border-[#FF3366] text-[#FF3366] hover:bg-[#FF3366]/10 rounded-none font-mono text-sm"
              >
                {isCancelling ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    REFUSER
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <AcceptTransferDialog
          open={showAcceptDialog}
          onOpenChange={setShowAcceptDialog}
          transferId={transfer.id}
          fromUserName={transfer.fromUser?.name || transfer.fromUser?.email || ''}
        />
      </>
    )
  }

  if (isInitiator) {
    return (
      <div className="p-4 bg-[#CCFF00]/10 border border-[#CCFF00]/50">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-[#CCFF00] mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-[#CCFF00] font-mono uppercase tracking-wider">
                TRANSFERT EN COURS
              </p>
              <p className="text-sm text-[#999999] mt-1">
                En attente de confirmation de{' '}
                <span className="text-white">
                  {transfer.toUser?.name || transfer.toUser?.email}
                </span>
              </p>
              <p className="text-xs text-[#666666] mt-2">
                Expire dans {hoursRemaining}h
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isCancelling}
            className="border-[#FF3366] text-[#FF3366] hover:bg-[#FF3366]/10 rounded-none font-mono text-sm"
          >
            {isCancelling ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <X className="w-4 h-4 mr-2" />
                ANNULER
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  return null
}
