'use client'

/**
 * Media Section Component
 *
 * Main media manager for the product detail page.
 * Displays media grid with drag-drop reordering and provides actions for
 * uploading, editing, and deleting media.
 * Digital Brutalism v2 design pattern.
 *
 * @see Story 3.3 - Product Media Upload
 */

import { useState, useCallback } from 'react'
import { ImagePlus, Images } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useMedia, useReorderMedia, useUpdateMedia } from '../_hooks'
import { usePermissions } from '@/lib/hooks'
import { MediaGrid } from './MediaGrid'
import { UploadMediaDialog } from './UploadMediaDialog'
import { EditMediaDialog } from './EditMediaDialog'
import { DeleteMediaDialog } from './DeleteMediaDialog'
import { MEDIA_CONSTANTS } from '@trafi/validators'
import type { MediaResponse } from '@trafi/validators'

interface MediaSectionProps {
  productId: string
  variantId?: string
}

export function MediaSection({ productId, variantId }: MediaSectionProps) {
  const { data: media, isLoading, error } = useMedia({ productId })
  const { hasPermission } = usePermissions()
  const { mutate: reorderMedia, isPending: isReordering } = useReorderMedia({ productId })
  const { mutate: updateMedia, isPending: isUpdating } = useUpdateMedia({ productId })

  const canEdit = hasPermission('products:update')

  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [mediaToEdit, setMediaToEdit] = useState<MediaResponse | null>(null)
  const [mediaToDelete, setMediaToDelete] = useState<MediaResponse | null>(null)

  const mediaList = media ?? []
  const remainingSlots = MEDIA_CONSTANTS.MAX_IMAGES_PER_PRODUCT - mediaList.length

  const handleReorder = useCallback(
    (mediaIds: string[]) => {
      reorderMedia({ productId, mediaIds })
    },
    [productId, reorderMedia]
  )

  const handleSetPrimary = useCallback(
    (media: MediaResponse) => {
      updateMedia({
        mediaId: media.id,
        productId,
        isPrimary: true,
      })
    },
    [productId, updateMedia]
  )

  if (isLoading) {
    return <MediaSectionSkeleton />
  }

  if (error) {
    return (
      <div className="border border-destructive p-8 text-center">
        <p className="font-mono text-destructive text-sm">ERREUR: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="border border-border">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-secondary/30">
        <div>
          <h3 className="font-mono text-sm uppercase tracking-wider">IMAGES</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {mediaList.length}/{MEDIA_CONSTANTS.MAX_IMAGES_PER_PRODUCT} images
          </p>
        </div>
        {canEdit && remainingSlots > 0 && (
          <Button size="sm" onClick={() => setShowUploadDialog(true)}>
            <ImagePlus className="mr-2 size-4" />
            Ajouter
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {mediaList.length === 0 ? (
          <div className="py-8 text-center">
            <Images className="mx-auto size-12 text-muted-foreground/50" />
            <p className="mt-2 font-mono text-muted-foreground text-sm">
              AUCUNE IMAGE
            </p>
            {canEdit && (
              <Button
                className="mt-4"
                onClick={() => setShowUploadDialog(true)}
              >
                <ImagePlus className="mr-2 size-4" />
                Ajouter des images
              </Button>
            )}
          </div>
        ) : (
          <MediaGrid
            media={mediaList}
            onReorder={handleReorder}
            onEdit={setMediaToEdit}
            onDelete={setMediaToDelete}
            onSetPrimary={handleSetPrimary}
            canEdit={canEdit}
            isReordering={isReordering || isUpdating}
          />
        )}

        {/* Drag hint */}
        {canEdit && mediaList.length > 1 && (
          <p className="mt-3 text-center font-mono text-[10px] text-muted-foreground">
            GLISSEZ-DEPOSEZ POUR REORGANISER
          </p>
        )}
      </div>

      {/* Dialogs */}
      <UploadMediaDialog
        productId={productId}
        variantId={variantId}
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        remainingSlots={remainingSlots}
      />

      <EditMediaDialog
        media={mediaToEdit}
        productId={productId}
        open={!!mediaToEdit}
        onOpenChange={(open) => !open && setMediaToEdit(null)}
      />

      <DeleteMediaDialog
        media={mediaToDelete}
        productId={productId}
        open={!!mediaToDelete}
        onOpenChange={(open) => !open && setMediaToDelete(null)}
      />
    </div>
  )
}

function MediaSectionSkeleton() {
  return (
    <div className="border border-border">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-16 mt-1" />
        </div>
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border border-border">
              <Skeleton className="aspect-square" />
              <div className="border-t border-border p-2">
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
