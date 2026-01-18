'use client'

import { useState } from 'react'
import { FolderTree, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useCategoryList } from '@/app/(dashboard)/products/categories/_hooks'
import {
  useAssignProductsToCategory,
  useRemoveProductsFromCategory,
} from '@/app/(dashboard)/products/categories/_hooks'
import { useProductCategories } from '../_hooks'

interface CategoriesSectionProps {
  productId: string
}

/**
 * Categories Section Component
 *
 * Displays and manages product category assignments.
 * Used on the product detail page.
 *
 * @see Story 3.4 - Categories Management
 */
export function CategoriesSection({ productId }: CategoriesSectionProps) {
  const { data: productCategories, isLoading: categoriesLoading } = useProductCategories({ productId })
  const { data: allCategories, isLoading: allCategoriesLoading } = useCategoryList()
  const { mutate: assignToCategory, isPending: isAssigning } = useAssignProductsToCategory()
  const { mutate: removeFromCategory, isPending: isRemoving } = useRemoveProductsFromCategory()

  const [showAddDialog, setShowAddDialog] = useState(false)

  const isLoading = categoriesLoading || allCategoriesLoading
  const isPending = isAssigning || isRemoving

  // Get available categories (not already assigned)
  const assignedIds = new Set(productCategories?.map((c) => c.id) || [])
  const availableCategories = (allCategories || []).filter((c) => !assignedIds.has(c.id))

  const handleAddCategory = (categoryId: string) => {
    assignToCategory(
      { categoryId, productIds: [productId] },
      { onSuccess: () => setShowAddDialog(false) }
    )
  }

  const handleRemoveCategory = (categoryId: string) => {
    removeFromCategory({ categoryId, productIds: [productId] })
  }

  if (isLoading) {
    return <CategoriesSectionSkeleton />
  }

  const hasCategories = productCategories && productCategories.length > 0

  return (
    <div className="border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-mono text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <FolderTree className="size-4" />
          CATEGORIES
        </h2>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowAddDialog(true)}
          disabled={isPending || availableCategories.length === 0}
        >
          <Plus className="size-4 mr-1" />
          Add
        </Button>
      </div>

      {hasCategories ? (
        <div className="flex flex-wrap gap-2">
          {productCategories.map((category) => (
            <div
              key={category.id}
              className="flex items-center gap-2 border border-border px-3 py-1 bg-zinc-900"
            >
              <span className="font-mono text-sm">
                {'\u00A0'.repeat(category.depth * 2)}
                {category.name}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveCategory(category.id)}
                disabled={isPending}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No categories assigned. Click &quot;Add&quot; to assign this product to a category.
        </p>
      )}

      {/* Add Category Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add to Category</DialogTitle>
          </DialogHeader>

          <div className="max-h-64 overflow-y-auto border rounded-md p-2 space-y-1">
            {availableCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                This product is already in all categories
              </p>
            ) : (
              availableCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleAddCategory(category.id)}
                  disabled={isAssigning}
                  className="w-full text-left px-3 py-2 hover:bg-zinc-800 rounded transition-colors"
                >
                  {'\u00A0'.repeat(category.depth * 4)}
                  {category.name}
                </button>
              ))
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/**
 * Skeleton for loading state
 */
function CategoriesSectionSkeleton() {
  return (
    <div className="border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-16" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-32" />
      </div>
    </div>
  )
}
