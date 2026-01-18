'use client'

import { Skeleton } from '@/components/ui/skeleton'

/**
 * Products Table Skeleton
 *
 * Loading skeleton for the products table.
 *
 * @see Story 3.1 - Product Model and Basic CRUD
 */
export function ProductsTableSkeleton() {
  return (
    <div className="border border-border">
      {/* Header */}
      <div className="flex border-b border-border bg-secondary/30">
        <div className="flex-1 px-4 py-3">
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            NOM
          </span>
        </div>
        <div className="w-32 px-4 py-3">
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            PRIX
          </span>
        </div>
        <div className="w-32 px-4 py-3">
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            STATUT
          </span>
        </div>
        <div className="w-40 px-4 py-3">
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            DATE
          </span>
        </div>
        <div className="w-24 px-4 py-3">
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            ACTIONS
          </span>
        </div>
      </div>

      {/* Skeleton Rows */}
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex border-b border-border last:border-b-0"
        >
          <div className="flex-1 px-4 py-4">
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="w-32 px-4 py-4">
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="w-32 px-4 py-4">
            <Skeleton className="h-6 w-20" />
          </div>
          <div className="w-40 px-4 py-4">
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="w-24 px-4 py-4">
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      ))}
    </div>
  )
}
