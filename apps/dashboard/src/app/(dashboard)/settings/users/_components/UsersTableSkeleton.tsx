'use client'

export function UsersTableSkeleton() {
  return (
    <div className="border border-border">
      {/* Header */}
      <div className="flex border-b border-border bg-secondary/30">
        <div className="flex-1 px-4 py-3">
          <div className="h-4 w-24 bg-neutral-800 animate-pulse" />
        </div>
        <div className="flex-1 px-4 py-3">
          <div className="h-4 w-16 bg-neutral-800 animate-pulse" />
        </div>
        <div className="flex-1 px-4 py-3">
          <div className="h-4 w-12 bg-neutral-800 animate-pulse" />
        </div>
        <div className="flex-1 px-4 py-3">
          <div className="h-4 w-16 bg-neutral-800 animate-pulse" />
        </div>
        <div className="w-24 px-4 py-3" />
      </div>

      {/* Rows */}
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex border-b border-border last:border-b-0">
          <div className="flex-1 px-4 py-4">
            <div className="h-4 w-48 bg-neutral-800 animate-pulse" />
          </div>
          <div className="flex-1 px-4 py-4">
            <div className="h-4 w-32 bg-neutral-800 animate-pulse" />
          </div>
          <div className="flex-1 px-4 py-4">
            <div className="h-4 w-16 bg-neutral-800 animate-pulse" />
          </div>
          <div className="flex-1 px-4 py-4">
            <div className="h-5 w-14 bg-neutral-800 animate-pulse" />
          </div>
          <div className="w-24 px-4 py-4">
            <div className="h-8 w-8 bg-neutral-800 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}
