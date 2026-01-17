'use client'

import { useState } from 'react'
import { MoreHorizontal, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ApiKeyStatusIndicator } from './ApiKeyStatusIndicator'
import { ApiKeyScopesBadges } from './ApiKeyScopesBadges'
import { ApiKeysTableSkeleton } from './ApiKeysTableSkeleton'
import { useApiKeys } from '../_hooks'
import { usePermissions } from '@/lib/hooks'
import type { ApiKeyResponse } from '@trafi/validators'

interface ApiKeysTableProps {
  onRevoke: (apiKey: ApiKeyResponse) => void
}

export function ApiKeysTable({ onRevoke }: ApiKeysTableProps) {
  const { data, isLoading, error } = useApiKeys()
  const { hasPermission } = usePermissions()
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  const canManageKeys = hasPermission('api-keys:manage')

  if (isLoading) {
    return <ApiKeysTableSkeleton />
  }

  if (error) {
    return (
      <div className="border border-destructive p-8 text-center">
        <p className="font-mono text-destructive text-sm">
          ERREUR: {error.message}
        </p>
      </div>
    )
  }

  if (!data || data.data.length === 0) {
    return (
      <div className="border border-border p-8 text-center">
        <p className="font-mono text-muted-foreground text-sm">
          AUCUNE CLE API TROUVEE
        </p>
        <p className="mt-2 text-muted-foreground text-xs">
          Creez une cle API pour integrer des services externes.
        </p>
      </div>
    )
  }

  return (
    <div className="border border-border">
      {/* Header */}
      <div className="flex border-b border-border bg-secondary/30">
        <div className="flex-1 px-4 py-3">
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            NOM
          </span>
        </div>
        <div className="flex-1 px-4 py-3">
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            CLE
          </span>
        </div>
        <div className="flex-1 px-4 py-3">
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            SCOPES
          </span>
        </div>
        <div className="flex-1 px-4 py-3">
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            STATUT
          </span>
        </div>
        {canManageKeys && (
          <div className="w-24 px-4 py-3">
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              ACTIONS
            </span>
          </div>
        )}
      </div>

      {/* Rows */}
      {data.data.map((apiKey) => (
        <div
          key={apiKey.id}
          className={`flex border-b border-border last:border-b-0 hover:bg-secondary/20 transition-colors ${
            apiKey.revokedAt ? 'opacity-60' : ''
          }`}
        >
          <div className="flex-1 px-4 py-4">
            <span className={`text-sm text-foreground ${apiKey.revokedAt ? 'line-through' : ''}`}>
              {apiKey.name}
            </span>
          </div>
          <div className="flex-1 px-4 py-4">
            <span className="font-mono text-sm text-muted-foreground">
              {apiKey.keyPrefix}...{apiKey.lastFourChars}
            </span>
          </div>
          <div className="flex-1 px-4 py-4">
            <ApiKeyScopesBadges scopes={apiKey.scopes} />
          </div>
          <div className="flex-1 px-4 py-4">
            <ApiKeyStatusIndicator
              expiresAt={apiKey.expiresAt}
              revokedAt={apiKey.revokedAt}
            />
          </div>
          {canManageKeys && (
            <div className="w-24 px-4 py-4 relative">
              {!apiKey.revokedAt && (
                <>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setOpenDropdown(openDropdown === apiKey.id ? null : apiKey.id)}
                    data-testid={`api-key-actions-${apiKey.id}`}
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>

                  {openDropdown === apiKey.id && (
                    <div
                      className="absolute right-4 top-12 z-10 w-48 border border-border bg-background shadow-lg"
                      onMouseLeave={() => setOpenDropdown(null)}
                    >
                      <button
                        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-destructive hover:bg-destructive/10 transition-colors"
                        onClick={() => {
                          onRevoke(apiKey)
                          setOpenDropdown(null)
                        }}
                      >
                        <Trash2 className="size-4" />
                        <span>Revoquer</span>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Footer - Pagination Info */}
      <div className="flex items-center justify-between border-t border-border px-4 py-3 bg-secondary/30">
        <span className="font-mono text-xs text-muted-foreground">
          {data.meta.total} cle{data.meta.total > 1 ? 's' : ''} API
        </span>
        <span className="font-mono text-xs text-muted-foreground">
          Page {data.meta.page}/{data.meta.totalPages}
        </span>
      </div>
    </div>
  )
}
