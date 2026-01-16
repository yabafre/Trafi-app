'use client'

import { cn } from '@/lib/utils'
import type { UserStatus } from '@trafi/validators'

const STATUS_STYLES: Record<UserStatus, string> = {
  ACTIVE: 'bg-[#00FF94]/20 text-[#00FF94] border-[#00FF94]',
  INACTIVE: 'bg-neutral-800 text-neutral-500 border-neutral-600',
  INVITED: 'bg-[#CCFF00]/20 text-[#CCFF00] border-[#CCFF00]',
}

const STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: 'ACTIF',
  INACTIVE: 'INACTIF',
  INVITED: 'INVITE',
}

interface UserStatusBadgeProps {
  status: UserStatus
  className?: string
}

export function UserStatusBadge({ status, className }: UserStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 border font-mono text-[10px] uppercase tracking-wider',
        STATUS_STYLES[status],
        className
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}
