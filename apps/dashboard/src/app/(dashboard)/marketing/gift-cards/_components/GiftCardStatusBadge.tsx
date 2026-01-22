'use client'

import { Badge } from '@/components/ui/badge'

type GiftCardStatus = 'PENDING' | 'ACTIVE' | 'DISABLED' | 'EXPIRED' | 'DEPLETED'

interface GiftCardStatusBadgeProps {
  status: GiftCardStatus
}

/**
 * Status badge for gift cards
 * Shows different colors/styles based on status
 *
 * @see Story 3.10 - Gift Cards
 */
export function GiftCardStatusBadge({ status }: GiftCardStatusBadgeProps) {
  const styles: Record<GiftCardStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    PENDING: {
      variant: 'secondary',
      label: 'Pending',
    },
    ACTIVE: {
      variant: 'default',
      label: 'Active',
    },
    DISABLED: {
      variant: 'destructive',
      label: 'Disabled',
    },
    EXPIRED: {
      variant: 'outline',
      label: 'Expired',
    },
    DEPLETED: {
      variant: 'outline',
      label: 'Depleted',
    },
  }

  const { variant, label } = styles[status] || { variant: 'outline', label: status }

  return (
    <Badge variant={variant} className="font-mono text-xs uppercase">
      {label}
    </Badge>
  )
}
