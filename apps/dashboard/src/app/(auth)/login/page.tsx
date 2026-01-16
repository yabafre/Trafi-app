import type { Metadata } from 'next'
import { LoginForm } from './_components/LoginForm'

export const metadata: Metadata = {
  title: 'Login | Trafi Dashboard',
  description: 'Sign in to your Trafi admin dashboard',
}

interface LoginPageProps {
  searchParams: Promise<{ expired?: string; redirect?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams
  const sessionExpired = params.expired === '1'

  return (
    <div className="w-full max-w-md space-y-8 px-4">
      <div className="text-center">
        {/* Brutalist Logo */}
        <div className="mb-8 flex justify-center">
          <div className="h-12 w-12 bg-foreground flex items-center justify-center text-background font-bold text-xl">
            T
          </div>
        </div>
        <h1 className="font-heading text-4xl font-bold uppercase tracking-tighter">
          Welcome back
        </h1>
        <p className="mt-3 text-muted-foreground font-mono text-sm uppercase tracking-wider">
          Sign in to your admin dashboard
        </p>
      </div>

      {/* Session Expired Message */}
      {sessionExpired && (
        <div className="bg-destructive/10 border border-destructive p-4 text-sm text-destructive font-mono uppercase tracking-wider">
          Your session has expired. Please sign in again.
        </div>
      )}

      <LoginForm />
    </div>
  )
}
