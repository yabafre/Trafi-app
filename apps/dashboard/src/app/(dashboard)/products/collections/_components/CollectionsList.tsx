'use client'

import { useState } from 'react'
import { Plus, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CollectionCard } from './CollectionCard'
import { CollectionFormDialog } from './CollectionFormDialog'
import { useCollectionList } from '../_hooks'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Collections List Component
 *
 * Main component for displaying and managing collections.
 * Includes search, filtering, and pagination.
 *
 * @see Story 3.5 - Collections Management
 */
export function CollectionsList() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [visibilityFilter, setVisibilityFilter] = useState<string>('all')
  const [featuredFilter, setFeaturedFilter] = useState<string>('all')
  const [page, setPage] = useState(1)

  const { data, isLoading, error } = useCollectionList({
    page,
    limit: 12,
    search: search || undefined,
    isVisible: visibilityFilter === 'all' ? undefined : visibilityFilter === 'visible',
    isFeatured: featuredFilter === 'all' ? undefined : featuredFilter === 'featured',
  })

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setPage(1) // Reset to first page on search
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load collections</p>
        <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with search and filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-3 w-full sm:w-auto">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search collections..."
              value={search}
              onChange={handleSearchChange}
              className="pl-9"
            />
          </div>
          <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Visibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="visible">Visible</SelectItem>
              <SelectItem value="hidden">Hidden</SelectItem>
            </SelectContent>
          </Select>
          <Select value={featuredFilter} onValueChange={setFeaturedFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Featured" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="not-featured">Not Featured</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Collection
        </Button>
      </div>

      {/* Collections grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : !data?.collections.length ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h3 className="text-lg font-semibold">No collections yet</h3>
          <p className="text-muted-foreground mt-1">
            Create your first collection to organize products.
          </p>
          <Button onClick={() => setIsCreateOpen(true)} className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Create Collection
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.collections.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {data.page} of {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      <CollectionFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        collection={null}
      />
    </div>
  )
}
