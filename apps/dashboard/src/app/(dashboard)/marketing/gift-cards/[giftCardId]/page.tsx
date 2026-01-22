'use client'

import { useParams, useSearchParams } from 'next/navigation'
import { GiftCardDetailView } from './_components'
import { usePermissions } from '@/lib/hooks'

/**
 * Gift Card Detail Page
 *
 * Shows full details and transaction history for a single gift card.
 * Requires 'settings:read' permission to view.
 *
 * @see Story 3.10 - Gift Cards (AC3, AC4)
 */
export default function GiftCardDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const giftCardId = params.giftCardId as string
  const showAdjustDialog = searchParams.get('adjust') === 'true'

  const { hasPermission } = usePermissions()
  const canRead = hasPermission('settings:read')

  // Permission check
  if (!canRead) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h1 className="font-mono text-2xl uppercase tracking-wider text-destructive">
          ACCESS DENIED
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have the necessary permissions to access this page.
        </p>
      </div>
    )
  }

  return <GiftCardDetailView giftCardId={giftCardId} showAdjustDialog={showAdjustDialog} />
}
