'use client'

import { cn } from '@/lib/utils'
import type { ProductStatus } from '@trafi/validators'

interface ProductStatusBadgeProps {
  status: ProductStatus
}

const statusConfig: Record<ProductStatus, { label: string; className: string }> = {
  draft: {
    label: 'BROUILLON',
    className: 'bg-muted text-muted-foreground border-muted-foreground/20',
  },
  active: {
    label: 'ACTIF',
    className: 'bg-accent/20 text-accent border-accent/30',
  },
  archived: {
    label: 'ARCHIVÉ',
    className: 'bg-secondary text-secondary-foreground border-secondary-foreground/20',
  },
}

/**
 * Product Status Badge Component
 *
 * Displays product status with appropriate styling.
 * Digital Brutalism design with monospace font and uppercase text.
 *
 * @see Story 3.1 - Product Model and Basic CRUD
 */
export function ProductStatusBadge({ status }: ProductStatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      className={cn(
        'inline-flex items-center border px-2 py-1 font-mono text-xs uppercase tracking-wider',
        config.className
      )}
    >
      {config.label}
    </span>
  )
}
