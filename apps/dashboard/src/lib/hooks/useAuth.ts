'use client'

import { useContext, createContext } from 'react'
import type { AuthUser } from '../auth'

export interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * Hook to access authentication state and methods
 * Must be used within an AuthProvider
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
