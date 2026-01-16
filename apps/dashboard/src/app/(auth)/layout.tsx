export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      {/* Brutalist corner accent */}
      <div className="fixed top-0 left-0 w-16 h-16 bg-primary" />
      <div className="fixed bottom-0 right-0 w-16 h-16 bg-primary" />
      {/* Auth pages (login, register, etc.) centered layout */}
      {children}
    </div>
  )
}
