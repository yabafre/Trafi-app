export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Dashboard layout will include sidebar, header, etc. */}
      <main className="flex-1">{children}</main>
    </div>
  )
}
