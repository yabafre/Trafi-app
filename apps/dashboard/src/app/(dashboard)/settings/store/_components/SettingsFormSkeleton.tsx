'use client'

/**
 * Loading skeleton for settings forms
 */
export function SettingsFormSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Field skeleton */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="grid gap-2">
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="h-10 w-full bg-muted rounded-none" />
        </div>
      ))}

      {/* Button skeleton */}
      <div className="h-10 w-32 bg-muted rounded-none" />
    </div>
  )
}
