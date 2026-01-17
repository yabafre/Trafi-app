'use client'

/**
 * Query Provider
 *
 * Provides React Query client for zsa-react-query hooks.
 * Must wrap any component using useServerActionQuery/Mutation.
 */
import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

interface QueryProviderProps {
  children: React.ReactNode
}

/**
 * QueryProvider component
 *
 * Initializes React Query client with default options.
 */
export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Don't retry on error by default
            retry: false,
            // Stale time of 5 minutes
            staleTime: 5 * 60 * 1000,
            // Don't refetch on window focus
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
