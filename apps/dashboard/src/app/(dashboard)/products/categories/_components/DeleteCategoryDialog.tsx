'use client'

import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useDeleteCategory } from '../_hooks'
import type { CategoryTreeNode } from '@trafi/validators'

interface DeleteCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: CategoryTreeNode | null
}

/**
 * Delete Category Confirmation Dialog
 *
 * Confirms category deletion with warning about child categories.
 * Products are NOT deleted, only the category assignment is removed.
 *
 * @see Story 3.4 - Categories Management
 */
export function DeleteCategoryDialog({
  open,
  onOpenChange,
  category,
}: DeleteCategoryDialogProps) {
  const { mutate, isPending } = useDeleteCategory()

  const handleDelete = () => {
    if (!category) return
    mutate({ id: category.id }, { onSuccess: () => onOpenChange(false) })
  }

  if (!category) return null

  const hasChildren = category.children && category.children.length > 0
  const hasProducts = category.productCount && category.productCount > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-destructive" />
            Delete Category
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2">
              <p>
                Are you sure you want to delete{' '}
                <span className="font-mono font-semibold">{category.name}</span>?
              </p>
              {hasChildren && (
                <p className="text-amber-500">
                  This category has {category.children.length} child{' '}
                  {category.children.length === 1 ? 'category' : 'categories'} that
                  will become root categories.
                </p>
              )}
              {hasProducts && (
                <p className="text-zinc-400">
                  {category.productCount} product{category.productCount === 1 ? '' : 's'}{' '}
                  will be removed from this category (products are not deleted).
                </p>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
