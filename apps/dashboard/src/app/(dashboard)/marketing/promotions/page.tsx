'use client'

import { PromotionsDataTable } from './_components'
import { usePermissions } from '@/lib/hooks'

/**
 * Promotions List Page
 *
 * Allows Owner/Admin users to manage promotions and discounts.
 * Requires 'settings:read' permission to view.
 *
 * @see Story 3.9 - Promotions & Discounts Foundation
 */
export default function PromotionsPage() {
  const { hasPermission } = usePermissions()
  const canRead = hasPermission('settings:read')
  const canUpdate = hasPermission('settings:update')

  // Permission check - show access denied if no read permission
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

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-2xl uppercase tracking-wider">
            PROMOTIONS
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {canUpdate
              ? 'Create and manage promotions and discount codes.'
              : 'View promotions configuration (read-only).'}
          </p>
        </div>
      </div>

      {/* Read-only indicator for viewers */}
      {!canUpdate && (
        <div className="border border-yellow-500/50 bg-yellow-500/10 px-4 py-3">
          <p className="font-mono text-xs uppercase tracking-wider text-yellow-500">
            READ-ONLY MODE - Contact an administrator to modify promotions.
          </p>
        </div>
      )}

      {/* Promotions List */}
      <PromotionsDataTable />
    </div>
  )
}
