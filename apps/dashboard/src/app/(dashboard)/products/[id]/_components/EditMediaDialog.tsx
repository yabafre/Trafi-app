'use client'

/**
 * Edit Media Dialog
 *
 * Dialog for editing media metadata (alt text).
 * Digital Brutalism v2 design pattern.
 *
 * @see Story 3.3 - Product Media Upload
 */

import { useState, useEffect } from 'react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUpdateMedia } from '../_hooks'
import type { MediaResponse } from '@trafi/validators'

interface EditMediaDialogProps {
  media: MediaResponse | null
  productId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditMediaDialog({
  media,
  productId,
  open,
  onOpenChange,
}: EditMediaDialogProps) {
  const [altText, setAltText] = useState('')
  const { mutate: updateMedia, isPending } = useUpdateMedia({
    productId,
    onSuccess: () => onOpenChange(false),
  })

  // Reset form when media changes
  useEffect(() => {
    if (media) {
      setAltText(media.altText || '')
    }
  }, [media])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!media) return

    updateMedia({
      mediaId: media.id,
      productId,
      altText: altText || undefined,
    })
  }

  if (!media) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono uppercase">
            Modifier l&apos;image
          </DialogTitle>
          <DialogDescription>
            Modifiez le texte alternatif de l&apos;image pour l&apos;accessibilite.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Image Preview */}
            <div className="relative mx-auto aspect-square w-40 overflow-hidden border border-border bg-secondary/20">
              <Image
                src={media.thumbnailUrl || media.url}
                alt={media.altText || 'Product image'}
                fill
                className="object-cover"
                sizes="160px"
              />
            </div>

            {/* Alt Text Input */}
            <div className="space-y-2">
              <Label htmlFor="altText" className="font-mono text-xs uppercase">
                Texte alternatif
              </Label>
              <Input
                id="altText"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Description de l'image..."
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {altText.length}/500 caracteres
              </p>
            </div>

            {/* Image Info */}
            <div className="border border-border bg-secondary/20 p-2">
              <p className="font-mono text-xs text-muted-foreground">
                Dimensions: {media.width}x{media.height}px
              </p>
              <p className="font-mono text-xs text-muted-foreground">
                Taille: {(media.sizeInBytes / 1024).toFixed(1)} KB
              </p>
            </div>
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
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
