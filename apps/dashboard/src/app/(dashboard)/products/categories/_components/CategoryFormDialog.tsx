'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateCategory, useUpdateCategory, useCategoryList } from '../_hooks'
import type { CategoryTreeNode } from '@trafi/validators'

interface CategoryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: CategoryTreeNode | null
  parentId: string | null
}

interface FormData {
  name: string
  slug: string
  description: string
  parentId: string | null
  imageUrl: string
}

interface FormErrors {
  name?: string
  slug?: string
}

/**
 * Category Form Dialog
 *
 * Used for creating and editing categories.
 * Includes parent category selection (for non-root categories).
 *
 * Digital Brutalism design pattern.
 *
 * @see Story 3.4 - Categories Management
 */
export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  parentId,
}: CategoryFormDialogProps) {
  const { data: categoryList } = useCategoryList()
  const { mutate: createCategory, isPending: isCreating } = useCreateCategory()
  const { mutate: updateCategory, isPending: isUpdating } = useUpdateCategory()

  const isEditMode = !!category
  const isPending = isCreating || isUpdating

  const [formData, setFormData] = useState<FormData>({
    name: '',
    slug: '',
    description: '',
    parentId: null,
    imageUrl: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})

  // Reset form when dialog opens/closes or category changes
  useEffect(() => {
    if (open) {
      if (category) {
        setFormData({
          name: category.name,
          slug: category.slug,
          description: category.description || '',
          parentId: category.parentId,
          imageUrl: category.imageUrl || '',
        })
      } else {
        setFormData({
          name: '',
          slug: '',
          description: '',
          parentId: parentId,
          imageUrl: '',
        })
      }
      setErrors({})
    }
  }, [open, category, parentId])

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

  const handleChange = (field: keyof FormData, value: string | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (field in errors) {
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
      parentId: formData.parentId || undefined,
      imageUrl: formData.imageUrl.trim() || undefined,
    }

    if (isEditMode) {
      updateCategory(
        { id: category!.id, ...payload },
        { onSuccess: () => onOpenChange(false) }
      )
    } else {
      createCategory(payload, { onSuccess: () => onOpenChange(false) })
    }
  }

  // Filter out current category and its descendants from parent options
  const parentOptions = (categoryList || []).filter((cat) => {
    if (!category) return cat.depth < 2 // Can only add to depth 0 or 1
    if (cat.id === category.id) return false
    // TODO: Also filter out descendants
    return cat.depth < 2
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Edit Category' : 'Create Category'}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? 'Update the category details below.'
                : 'Fill in the details to create a new category.'}
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
                placeholder="e.g., Electronics"
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
                placeholder="e.g., electronics (auto-generated if empty)"
                disabled={isPending}
              />
              {errors.slug && (
                <p className="text-sm text-destructive">{errors.slug}</p>
              )}
            </div>

            {/* Parent Category */}
            {!isEditMode && (
              <div className="grid gap-2">
                <Label htmlFor="parentId">Parent Category</Label>
                <Select
                  value={formData.parentId || 'none'}
                  onValueChange={(value) =>
                    handleChange('parentId', value === 'none' ? null : value)
                  }
                  disabled={isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None (root category)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (root category)</SelectItem>
                    {parentOptions.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {'\u00A0'.repeat(cat.depth * 2)}
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Optional description for this category"
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
