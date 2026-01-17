'use client'

import { useAuth } from '@/lib/hooks'
import {
  OwnershipTransferCard,
  PendingTransferBanner,
  TransferHistoryTable,
} from './_components'

/**
 * Ownership Settings Page
 *
 * Shows different UI based on user role:
 * - Owner: Transfer form + history
 * - Admin/Editor (target): Pending transfer banner
 *
 * @see Story 2.8 - Ownership Transfer
 */
export default function OwnershipSettingsPage() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-[#222222]" />
          <div className="h-4 w-96 bg-[#222222] mt-2" />
        </div>
      </div>
    )
  }

  if (!user || !user.role) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h1 className="font-mono text-2xl uppercase tracking-wider text-[#FF3366]">
          ACCES REFUSE
        </h1>
        <p className="mt-2 text-sm text-[#999999]">
          Vous devez etre connecte pour acceder a cette page.
        </p>
      </div>
    )
  }

  const isOwner = user.role?.toLowerCase() === 'owner'

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="font-mono text-2xl uppercase tracking-wider">
          PROPRIETE
        </h1>
        <p className="mt-1 text-sm text-[#999999]">
          {isOwner
            ? 'Gerez la propriete de votre boutique.'
            : 'Consultez les transferts de propriete en attente.'}
        </p>
      </div>

      {/* Pending Transfer Banner - shown to both parties */}
      <PendingTransferBanner currentUserId={user.id} />

      {/* Owner View: Transfer Form + History */}
      {isOwner && (
        <div className="grid gap-6 md:grid-cols-2">
          <OwnershipTransferCard />
          <TransferHistoryTable />
        </div>
      )}

      {/* Non-Owner View: History only (if they have any involvement) */}
      {!isOwner && (
        <div className="max-w-2xl">
          <TransferHistoryTable />
        </div>
      )}
    </div>
  )
}
