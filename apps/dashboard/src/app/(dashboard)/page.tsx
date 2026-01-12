import { Button } from "@/components/ui/button"

export default function DashboardHome() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          Trafi Dashboard
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Admin interface for Trafi commerce platform
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <Button>Primary Button</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
      </div>

      <div className="mt-8 rounded-lg border border-border bg-card p-6 text-card-foreground">
        <h2 className="text-xl font-semibold">Dark Mode Active</h2>
        <p className="mt-2 text-muted-foreground">
          This dashboard uses dark mode as the default theme identity.
        </p>
      </div>
    </div>
  )
}
