'use client'

import { cn } from '@/lib/utils'
import type { UserRole } from '@trafi/validators'

const ROLE_STYLES: Record<UserRole, string> = {
  OWNER: 'text-[#CCFF00]',
  ADMIN: 'text-white',
  EDITOR: 'text-neutral-300',
  VIEWER: 'text-neutral-500',
}

interface UserRoleBadgeProps {
  role: UserRole
  className?: string
}

export function UserRoleBadge({ role, className }: UserRoleBadgeProps) {
  return (
    <span
      className={cn(
        'font-mono text-xs uppercase tracking-wider',
        ROLE_STYLES[role],
        className
      )}
    >
      {role}
    </span>
  )
}
