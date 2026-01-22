'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type PromotionStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'ARCHIVED'

interface PromotionStatusBadgeProps {
  status: string
  className?: string
}

const statusConfig: Record<PromotionStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  DRAFT: { label: 'Draft', variant: 'secondary' },
  ACTIVE: { label: 'Active', variant: 'default' },
  PAUSED: { label: 'Paused', variant: 'outline' },
  EXPIRED: { label: 'Expired', variant: 'destructive' },
  ARCHIVED: { label: 'Archived', variant: 'outline' },
}

function isValidStatus(status: string): status is PromotionStatus {
  return ['DRAFT', 'ACTIVE', 'PAUSED', 'EXPIRED', 'ARCHIVED'].includes(status)
}

/**
 * Badge component for displaying promotion status
 *
 * @see Story 3.9 - Promotions & Discounts Foundation
 */
export function PromotionStatusBadge({ status, className }: PromotionStatusBadgeProps) {
  const validStatus = isValidStatus(status) ? status : 'DRAFT'
  const config = statusConfig[validStatus]

  return (
    <Badge
      variant={config.variant}
      className={cn(
        'uppercase tracking-wider font-mono text-xs',
        validStatus === 'ACTIVE' && 'bg-green-600 hover:bg-green-600',
        validStatus === 'PAUSED' && 'border-yellow-500 text-yellow-500',
        validStatus === 'EXPIRED' && 'bg-red-600 hover:bg-red-600',
        className
      )}
    >
      {config.label}
    </Badge>
  )
}
