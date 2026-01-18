'use client'

/**
 * Delete Media Dialog
 *
 * Confirmation dialog for deleting media.
 * Digital Brutalism v2 design pattern.
 *
 * @see Story 3.3 - Product Media Upload
 */

import Image from 'next/image'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useDeleteMedia } from '../_hooks'
import type { MediaResponse } from '@trafi/validators'

interface DeleteMediaDialogProps {
  media: MediaResponse | null
  productId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteMediaDialog({
  media,
  productId,
  open,
  onOpenChange,
}: DeleteMediaDialogProps) {
  const { mutate: deleteMedia, isPending } = useDeleteMedia({
    productId,
    onSuccess: () => onOpenChange(false),
  })

  const handleDelete = () => {
    if (!media) return
    deleteMedia({
      id: media.id,
      productId,
    })
  }

  if (!media) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono uppercase text-destructive">
            Supprimer l&apos;image
          </DialogTitle>
          <DialogDescription>
            Cette action est irreversible. L&apos;image sera definitivement supprimee.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Image Preview */}
          <div className="relative mx-auto aspect-square w-32 overflow-hidden border border-destructive bg-secondary/20">
            <Image
              src={media.thumbnailUrl || media.url}
              alt={media.altText || 'Product image'}
              fill
              className="object-cover opacity-50"
              sizes="128px"
            />
          </div>

          {media.isPrimary && (
            <div className="mt-4 border border-yellow-500 bg-yellow-500/10 p-2 text-center">
              <p className="font-mono text-xs text-yellow-600">
                ATTENTION: Cette image est l&apos;image principale.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Une autre image sera automatiquement definie comme principale.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? 'Suppression...' : 'Supprimer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
