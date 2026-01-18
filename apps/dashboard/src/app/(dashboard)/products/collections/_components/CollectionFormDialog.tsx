'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCreateCollection, useUpdateCollection } from '../_hooks'
import type { CollectionListItem } from '@trafi/validators'

interface CollectionFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  collection: CollectionListItem | null
}

interface FormData {
  name: string
  slug: string
  description: string
  imageUrl: string
  isVisible: boolean
  isFeatured: boolean
}

interface FormErrors {
  name?: string
  slug?: string
}

/**
 * Collection Form Dialog
 *
 * Used for creating and editing collections.
 * Collections are flat (no hierarchy, unlike categories).
 *
 * Digital Brutalism design pattern.
 *
 * @see Story 3.5 - Collections Management
 */
export function CollectionFormDialog({
  open,
  onOpenChange,
  collection,
}: CollectionFormDialogProps) {
  const { mutate: createCollection, isPending: isCreating } = useCreateCollection()
  const { mutate: updateCollection, isPending: isUpdating } = useUpdateCollection()

  const isEditMode = !!collection
  const isPending = isCreating || isUpdating

  const [formData, setFormData] = useState<FormData>({
    name: '',
    slug: '',
    description: '',
    imageUrl: '',
    isVisible: true,
    isFeatured: false,
  })
  const [errors, setErrors] = useState<FormErrors>({})

  // Reset form when dialog opens/closes or collection changes
  useEffect(() => {
    if (open) {
      if (collection) {
        setFormData({
          name: collection.name,
          slug: collection.slug,
          description: collection.description || '',
          imageUrl: collection.imageUrl || '',
          isVisible: collection.isVisible,
          isFeatured: collection.isFeatured,
        })
      } else {
        setFormData({
          name: '',
          slug: '',
          description: '',
          imageUrl: '',
          isVisible: true,
          isFeatured: false,
        })
      }
      setErrors({})
    }
  }, [open, collection])

  const validateSlug = (value: string): string | undefined => {
    if (!value) return undefined // Optional
    const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/
    if (!slugRegex.test(value)) {
      return 'Slug must contain only lowercase letters, numbers, and hyphens'
    }
    return undefined
  }

  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    const slugError = validateSlug(formData.slug)
    if (slugError) {
      newErrors.slug = slugError
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (typeof value === 'string' && field in errors) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    const payload = {
      name: formData.name.trim(),
      slug: formData.slug.trim() || undefined,
      description: formData.description.trim() || undefined,
      imageUrl: formData.imageUrl.trim() || undefined,
      isVisible: formData.isVisible,
      isFeatured: formData.isFeatured,
    }

    if (isEditMode) {
      updateCollection(
        { id: collection!.id, ...payload },
        { onSuccess: () => onOpenChange(false) }
      )
    } else {
      createCollection(payload, { onSuccess: () => onOpenChange(false) })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Edit Collection' : 'Create Collection'}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? 'Update the collection details below.'
                : 'Fill in the details to create a new collection.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., Summer Sale"
                disabled={isPending}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            {/* Slug */}
            <div className="grid gap-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => handleChange('slug', e.target.value.toLowerCase())}
                placeholder="e.g., summer-sale (auto-generated if empty)"
                disabled={isPending}
              />
              {errors.slug && (
                <p className="text-sm text-destructive">{errors.slug}</p>
              )}
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Optional description for this collection"
                rows={3}
                disabled={isPending}
              />
            </div>

            {/* Image URL */}
            <div className="grid gap-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => handleChange('imageUrl', e.target.value)}
                placeholder="https://example.com/image.jpg"
                disabled={isPending}
              />
            </div>

            {/* Visibility and Featured toggles */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  id="isVisible"
                  checked={formData.isVisible}
                  onCheckedChange={(checked) => handleChange('isVisible', checked)}
                  disabled={isPending}
                />
                <Label htmlFor="isVisible">Visible</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="isFeatured"
                  checked={formData.isFeatured}
                  onCheckedChange={(checked) => handleChange('isFeatured', checked)}
                  disabled={isPending}
                />
                <Label htmlFor="isFeatured">Featured</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
