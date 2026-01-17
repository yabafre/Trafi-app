'use client'

import { History } from 'lucide-react'
import { useTransferHistory } from '../_hooks'

/**
 * Status badge component with correct Digital Brutalism colors
 */
function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { bg: string; text: string; border: string; label: string }> = {
    PENDING: {
      bg: 'bg-[#CCFF00]/10',
      text: 'text-[#CCFF00]',
      border: 'border-[#CCFF00]',
      label: 'EN ATTENTE',
    },
    CONFIRMED: {
      bg: 'bg-[#00FF94]/10',
      text: 'text-[#00FF94]',
      border: 'border-[#00FF94]',
      label: 'CONFIRME',
    },
    CANCELLED: {
      bg: 'bg-[#666666]/10',
      text: 'text-[#666666]',
      border: 'border-[#666666]',
      label: 'ANNULE',
    },
    EXPIRED: {
      bg: 'bg-[#FF3366]/10',
      text: 'text-[#FF3366]',
      border: 'border-[#FF3366]',
      label: 'EXPIRE',
    },
  }

  const config = statusConfig[status] || statusConfig.CANCELLED

  return (
    <span
      className={`px-2 py-1 text-xs font-mono border ${config.bg} ${config.text} ${config.border}`}
    >
      {config.label}
    </span>
  )
}

/**
 * Transfer history table showing past transfers
 * AC: #6 - Audit trail with timestamps and outcomes
 */
export function TransferHistoryTable() {
  const { data: history, isLoading } = useTransferHistory()

  if (isLoading) {
    return (
      <div className="border border-[#333333] p-6">
        <div className="flex items-center gap-3 mb-6">
          <History className="w-6 h-6 text-[#CCFF00]" />
          <h2 className="font-mono uppercase tracking-wider">HISTORIQUE</h2>
        </div>
        <div className="text-[#666666] text-sm">Chargement...</div>
      </div>
    )
  }

  const transfers = history ?? []

  return (
    <div className="border border-[#333333] p-6">
      <div className="flex items-center gap-3 mb-6">
        <History className="w-6 h-6 text-[#CCFF00]" />
        <h2 className="font-mono uppercase tracking-wider">HISTORIQUE</h2>
      </div>

      {transfers.length === 0 ? (
        <div className="text-[#666666] text-sm">Aucun transfert dans l&apos;historique</div>
      ) : (
        <div className="space-y-3">
          {transfers.map((transfer) => {
            const createdAt = new Date(transfer.createdAt)
            const completedAt = transfer.completedAt
              ? new Date(transfer.completedAt)
              : null

            // Check if pending and expired
            const isExpired =
              transfer.status === 'pending' &&
              new Date(transfer.expiresAt) < new Date()
            const displayStatus = isExpired ? 'EXPIRED' : transfer.status.toUpperCase()

            return (
              <div
                key={transfer.id}
                className="p-4 border border-[#222222] bg-[#111111]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <StatusBadge status={displayStatus} />
                      <span className="text-xs text-[#666666] font-mono">
                        {createdAt.toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <p className="text-sm">
                      <span className="text-[#999999]">De:</span>{' '}
                      <span className="text-white">
                        {transfer.fromUser?.name || transfer.fromUser?.email}
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="text-[#999999]">A:</span>{' '}
                      <span className="text-white">
                        {transfer.toUser?.name || transfer.toUser?.email}
                      </span>
                    </p>
                    {completedAt && (
                      <p className="text-xs text-[#666666] mt-2">
                        Termine le{' '}
                        {completedAt.toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                    {transfer.reason && (
                      <p className="text-xs text-[#666666] mt-1">
                        Raison: {transfer.reason}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
