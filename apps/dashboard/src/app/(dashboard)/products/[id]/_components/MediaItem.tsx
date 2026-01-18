'use client'

/**
 * Media Item Component
 *
 * Single media item card with image preview, drag handle, and action menu.
 * Digital Brutalism v2 design pattern.
 *
 * @see Story 3.3 - Product Media Upload
 */

import Image from 'next/image'
import { useState } from 'react'
import { GripVertical, Star, Pencil, Trash2, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { MediaResponse } from '@trafi/validators'

interface MediaItemProps {
  media: MediaResponse
  onEdit: (media: MediaResponse) => void
  onDelete: (media: MediaResponse) => void
  onSetPrimary: (media: MediaResponse) => void
  canEdit: boolean
  isDragging?: boolean
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
}

export function MediaItem({
  media,
  onEdit,
  onDelete,
  onSetPrimary,
  canEdit,
  isDragging = false,
  dragHandleProps,
}: MediaItemProps) {
  const [imageError, setImageError] = useState(false)

  return (
    <div
      className={cn(
        'group relative border border-border bg-background transition-all',
        isDragging && 'opacity-50 ring-2 ring-primary',
        media.isPrimary && 'ring-2 ring-yellow-500'
      )}
    >
      {/* Drag Handle */}
      {canEdit && dragHandleProps && (
        <div
          {...dragHandleProps}
          className="absolute left-0 top-0 z-10 flex h-full w-6 cursor-grab items-center justify-center bg-secondary/50 opacity-0 transition-opacity group-hover:opacity-100"
        >
          <GripVertical className="size-4 text-muted-foreground" />
        </div>
      )}

      {/* Primary Badge */}
      {media.isPrimary && (
        <div className="absolute right-1 top-1 z-10 bg-yellow-500 px-1.5 py-0.5">
          <span className="font-mono text-[10px] font-bold uppercase text-black">
            PRIMARY
          </span>
        </div>
      )}

      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-secondary/20">
        {!imageError ? (
          <Image
            src={media.thumbnailUrl || media.url}
            alt={media.altText || 'Product image'}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 200px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-mono text-xs text-muted-foreground">ERROR</span>
          </div>
        )}

        {/* Hover Overlay */}
        {canEdit && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon">
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                {!media.isPrimary && (
                  <DropdownMenuItem onClick={() => onSetPrimary(media)}>
                    <Star className="mr-2 size-4" />
                    Definir comme principale
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onEdit(media)}>
                  <Pencil className="mr-2 size-4" />
                  Modifier le texte alt
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(media)}
                  destructive
                >
                  <Trash2 className="mr-2 size-4" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="border-t border-border px-2 py-1.5">
        <p className="truncate font-mono text-[10px] text-muted-foreground">
          {media.width}x{media.height} &bull;{' '}
          {(media.sizeInBytes / 1024).toFixed(0)}KB
        </p>
        {media.altText && (
          <p className="truncate text-xs text-foreground/80">{media.altText}</p>
        )}
      </div>
    </div>
  )
}
