import { getSession } from '@/lib/auth'
import { AuthProvider } from '@/lib/providers/AuthProvider'
import { DashboardHeader } from './_components/DashboardHeader'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  return (
    <AuthProvider initialUser={session?.user ?? null}>
      <div className="flex min-h-screen flex-col bg-background">
        <DashboardHeader />
        <main className="flex-1">{children}</main>
      </div>
    </AuthProvider>
  )
}
