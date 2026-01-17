'use client'

interface ApiKeyStatusIndicatorProps {
  expiresAt: Date | null
  revokedAt: Date | null
}

type Status = 'active' | 'expired' | 'revoked'

const STATUS_STYLES: Record<Status, string> = {
  active: 'bg-success text-success-foreground border-success font-bold',
  expired: 'bg-destructive text-destructive-foreground border-destructive font-bold',
  revoked: 'bg-muted text-muted-foreground border-border font-bold',
}

const STATUS_LABELS: Record<Status, string> = {
  active: 'ACTIVE',
  expired: 'EXPIREE',
  revoked: 'REVOQUEE',
}

function getStatus(expiresAt: Date | null, revokedAt: Date | null): Status {
  if (revokedAt) return 'revoked'
  if (expiresAt && new Date(expiresAt) < new Date()) return 'expired'
  return 'active'
}

export function ApiKeyStatusIndicator({ expiresAt, revokedAt }: ApiKeyStatusIndicatorProps) {
  const status = getStatus(expiresAt, revokedAt)

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 border font-mono text-xs uppercase tracking-wider ${
        STATUS_STYLES[status]
      } ${status === 'revoked' ? 'line-through' : ''}`}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}
