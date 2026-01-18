'use client'

import { TaxRulesList } from './_components'
import { usePermissions } from '@/lib/hooks'

/**
 * Tax Rules Settings Page
 *
 * Allows Owner/Admin users to manage tax rules.
 * Requires 'settings:read' permission to view.
 *
 * @see Story 3.6 - Product Pricing and Tax Rules
 */
export default function TaxRulesPage() {
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
            TAX RULES
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {canUpdate
              ? 'Manage tax rates for your products.'
              : 'View tax rules configuration (read-only).'}
          </p>
        </div>
      </div>

      {/* Read-only indicator for viewers */}
      {!canUpdate && (
        <div className="border border-yellow-500/50 bg-yellow-500/10 px-4 py-3">
          <p className="font-mono text-xs uppercase tracking-wider text-yellow-500">
            READ-ONLY MODE - Contact an administrator to modify tax rules.
          </p>
        </div>
      )}

      {/* Tax Rules List */}
      <TaxRulesList />
    </div>
  )
}
