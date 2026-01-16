'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthContext, type AuthContextValue } from '../hooks/useAuth'
import type { AuthUser } from '../auth'
import { logout as logoutAction } from '@/app/(auth)/login/_actions/login'

interface AuthProviderProps {
  children: React.ReactNode
  initialUser: AuthUser | null
}

/**
 * Auth context provider that manages authentication state
 * Receives initial user from server component
 */
export function AuthProvider({ children, initialUser }: AuthProviderProps) {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(initialUser)
  const [isLoading, setIsLoading] = useState(false)

  // Sync user state with initial user on navigation
  useEffect(() => {
    setUser(initialUser)
  }, [initialUser])

  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      await logoutAction()
      setUser(null)
      router.push('/login')
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }, [router])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      logout,
    }),
    [user, isLoading, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
