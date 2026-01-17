import { getSession } from '@/lib/auth';
import { AuthProvider } from '@/lib/providers/AuthProvider';
import { DashboardShell } from '@/components/layout';
import { DashboardHeader } from './_components/DashboardHeader';
import { DashboardContent } from './_components/DashboardContent';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <AuthProvider initialUser={session?.user ?? null}>
      <DashboardShell>
        <DashboardHeader />
        <DashboardContent>{children}</DashboardContent>
      </DashboardShell>
    </AuthProvider>
  );
}
