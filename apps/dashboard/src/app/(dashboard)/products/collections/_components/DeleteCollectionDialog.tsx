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
import { useDeleteCollection } from '../_hooks'

interface DeleteCollectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  collectionId: string
  collectionName: string
}

/**
 * Delete Collection Confirmation Dialog
 *
 * Confirms deletion of a collection.
 * Products are NOT deleted, only the collection itself.
 *
 * @see Story 3.5 - Collections Management
 */
export function DeleteCollectionDialog({
  open,
  onOpenChange,
  collectionId,
  collectionName,
}: DeleteCollectionDialogProps) {
  const { mutate: deleteCollection, isPending } = useDeleteCollection()

  const handleDelete = () => {
    deleteCollection(
      { id: collectionId },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-destructive" />
            Delete Collection
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2">
              <p>
                Are you sure you want to delete{' '}
                <span className="font-mono font-semibold">{collectionName}</span>?
              </p>
              <p className="text-zinc-400">
                Products in this collection will not be deleted, only the collection
                itself will be removed.
              </p>
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
