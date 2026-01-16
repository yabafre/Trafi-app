'use client'

import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'

export function DashboardHeader() {
  const { user, logout, isLoading } = useAuth()

  return (
    <header className="h-16 border-b border-border bg-background sticky top-0 z-30">
      <div className="h-full flex items-center justify-between px-6">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 bg-foreground flex items-center justify-center text-background font-bold text-lg">
            T
          </div>
          <span className="font-bold text-xl uppercase tracking-tighter">
            Trafi
          </span>
        </div>

        {/* User info & Logout */}
        {user && (
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground font-mono uppercase">
              {user.email}
            </span>
            <div className="h-8 w-8 bg-muted border border-border flex items-center justify-center text-xs font-bold uppercase">
              {user.email?.[0] ?? 'U'}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              disabled={isLoading}
              className="font-mono uppercase text-xs"
            >
              {isLoading ? 'Signing out...' : 'Sign out'}
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
