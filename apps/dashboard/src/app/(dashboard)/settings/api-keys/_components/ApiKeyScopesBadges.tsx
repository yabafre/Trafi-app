'use client'

import type { ApiKeyScope } from '@trafi/validators'

interface ApiKeyScopesBadgesProps {
  scopes: ApiKeyScope[]
  maxDisplay?: number
}

export function ApiKeyScopesBadges({ scopes, maxDisplay = 3 }: ApiKeyScopesBadgesProps) {
  const displayScopes = maxDisplay > 0 ? scopes.slice(0, maxDisplay) : scopes
  const remainingCount = scopes.length - displayScopes.length

  return (
    <div className="flex flex-wrap gap-1">
      {displayScopes.map((scope) => (
        <span
          key={scope}
          className="inline-flex px-2 py-0.5 bg-neutral-900 border border-neutral-700 font-mono text-xs"
        >
          {scope}
        </span>
      ))}
      {remainingCount > 0 && (
        <span className="inline-flex px-2 py-0.5 bg-neutral-800 border border-neutral-600 font-mono text-xs text-muted-foreground">
          +{remainingCount}
        </span>
      )}
    </div>
  )
}
