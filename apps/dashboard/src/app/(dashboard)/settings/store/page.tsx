'use client'

import { StoreSettingsTabs } from './_components'
import { usePermissions } from '@/lib/hooks'

/**
 * Store Settings Page
 *
 * Allows Owner/Admin users to configure basic store settings.
 * Requires 'settings:read' permission to view.
 *
 * @see Story 2.7 - Store Settings Configuration
 */
export default function StoreSettingsPage() {
  const { hasPermission } = usePermissions()
  const canRead = hasPermission('settings:read')
  const canUpdate = hasPermission('settings:update')

  // Permission check - show access denied if no read permission
  if (!canRead) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h1 className="font-mono text-2xl uppercase tracking-wider text-destructive">
          ACCES REFUSE
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Vous n'avez pas les permissions necessaires pour acceder a cette page.
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
            PARAMETRES DU STORE
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {canUpdate
              ? 'Configurez les parametres de votre boutique.'
              : 'Consultez les parametres de votre boutique (lecture seule).'}
          </p>
        </div>
      </div>

      {/* Read-only indicator for viewers */}
      {!canUpdate && (
        <div className="border border-yellow-500/50 bg-yellow-500/10 px-4 py-3">
          <p className="font-mono text-xs uppercase tracking-wider text-yellow-500">
            MODE LECTURE SEULE - Contactez un administrateur pour modifier les parametres.
          </p>
        </div>
      )}

      {/* Settings Tabs */}
      <StoreSettingsTabs />
    </div>
  )
}
