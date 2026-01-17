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
          className="inline-flex px-2 py-0.5 bg-foreground text-background border border-border font-mono text-xs font-bold"
        >
          {scope}
        </span>
      ))}
      {remainingCount > 0 && (
        <span className="inline-flex px-2 py-0.5 bg-foreground text-background border border-border font-mono text-xs font-bold">
          +{remainingCount}
        </span>
      )}
    </div>
  )
}
