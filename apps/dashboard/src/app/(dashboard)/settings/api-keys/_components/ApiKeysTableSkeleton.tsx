'use client'

export function ApiKeysTableSkeleton() {
  return (
    <div className="border border-border animate-pulse">
      {/* Header */}
      <div className="flex border-b border-border bg-secondary/30">
        <div className="flex-1 px-4 py-3">
          <div className="h-3 w-12 bg-muted rounded" />
        </div>
        <div className="flex-1 px-4 py-3">
          <div className="h-3 w-16 bg-muted rounded" />
        </div>
        <div className="flex-1 px-4 py-3">
          <div className="h-3 w-20 bg-muted rounded" />
        </div>
        <div className="flex-1 px-4 py-3">
          <div className="h-3 w-14 bg-muted rounded" />
        </div>
        <div className="w-24 px-4 py-3">
          <div className="h-3 w-16 bg-muted rounded" />
        </div>
      </div>

      {/* Rows */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex border-b border-border last:border-b-0">
          <div className="flex-1 px-4 py-4">
            <div className="h-4 w-40 bg-muted rounded" />
          </div>
          <div className="flex-1 px-4 py-4">
            <div className="h-4 w-28 bg-muted rounded" />
          </div>
          <div className="flex-1 px-4 py-4">
            <div className="flex gap-1">
              <div className="h-4 w-20 bg-muted rounded" />
              <div className="h-4 w-20 bg-muted rounded" />
            </div>
          </div>
          <div className="flex-1 px-4 py-4">
            <div className="h-4 w-16 bg-muted rounded" />
          </div>
          <div className="w-24 px-4 py-4">
            <div className="h-6 w-6 bg-muted rounded" />
          </div>
        </div>
      ))}

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border px-4 py-3 bg-secondary/30">
        <div className="h-3 w-20 bg-muted rounded" />
        <div className="h-3 w-16 bg-muted rounded" />
      </div>
    </div>
  )
}
