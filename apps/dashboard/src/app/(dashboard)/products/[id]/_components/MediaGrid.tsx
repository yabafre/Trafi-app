'use client'

/**
 * Media Grid Component
 *
 * Grid layout for media items with drag-and-drop reordering.
 * Digital Brutalism v2 design pattern.
 *
 * @see Story 3.3 - Product Media Upload
 */

import { useState, useCallback } from 'react'
import { MediaItem } from './MediaItem'
import type { MediaResponse } from '@trafi/validators'

interface MediaGridProps {
  media: MediaResponse[]
  onReorder: (mediaIds: string[]) => void
  onEdit: (media: MediaResponse) => void
  onDelete: (media: MediaResponse) => void
  onSetPrimary: (media: MediaResponse) => void
  canEdit: boolean
  isReordering?: boolean
}

export function MediaGrid({
  media,
  onReorder,
  onEdit,
  onDelete,
  onSetPrimary,
  canEdit,
  isReordering = false,
}: MediaGridProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const handleDragStart = useCallback(
    (e: React.DragEvent, index: number) => {
      if (!canEdit) return
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', index.toString())
      setDraggedIndex(index)
    },
    [canEdit]
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      if (!canEdit) return
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      setDragOverIndex(index)
    },
    [canEdit]
  )

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent, dropIndex: number) => {
      if (!canEdit || draggedIndex === null) return
      e.preventDefault()

      if (draggedIndex === dropIndex) {
        setDraggedIndex(null)
        setDragOverIndex(null)
        return
      }

      // Create new order
      const newMedia = [...media]
      const [removed] = newMedia.splice(draggedIndex, 1)
      newMedia.splice(dropIndex, 0, removed)

      // Call reorder with new media IDs
      onReorder(newMedia.map((m) => m.id))

      setDraggedIndex(null)
      setDragOverIndex(null)
    },
    [canEdit, draggedIndex, media, onReorder]
  )

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }, [])

  if (media.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {media.map((item, index) => (
        <div
          key={item.id}
          draggable={canEdit}
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          className={
            dragOverIndex === index && draggedIndex !== index
              ? 'ring-2 ring-primary ring-offset-2'
              : ''
          }
        >
          <MediaItem
            media={item}
            onEdit={onEdit}
            onDelete={onDelete}
            onSetPrimary={onSetPrimary}
            canEdit={canEdit && !isReordering}
            isDragging={draggedIndex === index}
            dragHandleProps={
              canEdit
                ? {
                    className: 'cursor-grab active:cursor-grabbing',
                  }
                : undefined
            }
          />
        </div>
      ))}
    </div>
  )
}
