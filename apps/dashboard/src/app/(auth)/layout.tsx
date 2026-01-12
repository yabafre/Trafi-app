export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      {/* Auth pages (login, register, etc.) centered layout */}
      {children}
    </div>
  )
}
