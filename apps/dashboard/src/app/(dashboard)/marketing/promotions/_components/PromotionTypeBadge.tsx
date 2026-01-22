'use client'

import { Badge } from '@/components/ui/badge'
import { Percent, DollarSign, Truck, Gift } from 'lucide-react'
import { cn } from '@/lib/utils'

type PromotionType = 'PERCENT' | 'FIXED' | 'FREE_SHIPPING' | 'BUY_X_GET_Y'

interface PromotionTypeBadgeProps {
  type: string
  discountValue?: number | null
  className?: string
}

const typeConfig: Record<PromotionType, { label: string; icon: typeof Percent }> = {
  PERCENT: { label: 'Percent', icon: Percent },
  FIXED: { label: 'Fixed', icon: DollarSign },
  FREE_SHIPPING: { label: 'Free Shipping', icon: Truck },
  BUY_X_GET_Y: { label: 'Buy X Get Y', icon: Gift },
}

function isValidType(type: string): type is PromotionType {
  return ['PERCENT', 'FIXED', 'FREE_SHIPPING', 'BUY_X_GET_Y'].includes(type)
}

/**
 * Badge component for displaying promotion type
 *
 * @see Story 3.9 - Promotions & Discounts Foundation
 */
export function PromotionTypeBadge({ type, discountValue, className }: PromotionTypeBadgeProps) {
  const validType = isValidType(type) ? type : 'PERCENT'
  const config = typeConfig[validType]
  const Icon = config.icon

  // Format discount value based on type
  let displayValue = ''
  if (validType === 'PERCENT' && discountValue != null) {
    displayValue = `${discountValue}%`
  } else if (validType === 'FIXED' && discountValue != null) {
    // Convert cents to display
    displayValue = `${(discountValue / 100).toFixed(2)}`
  }

  return (
    <Badge variant="outline" className={cn('gap-1 font-mono', className)}>
      <Icon className="h-3 w-3" />
      {displayValue || config.label}
    </Badge>
  )
}
