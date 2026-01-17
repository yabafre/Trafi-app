'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useStoreSettings, useUpdateStoreSettings } from '../_hooks'
import { SettingsFormSkeleton } from './SettingsFormSkeleton'

interface FormData {
  name: string
  description: string
  slug: string
}

interface FormErrors {
  name?: string
  slug?: string
}

/**
 * General settings form for store name, description, and slug
 * AC: #1, #2, #3
 */
export function GeneralSettingsForm() {
  const { data: settings, isLoading } = useStoreSettings()
  const { mutate: updateSettings, isPending } = useUpdateStoreSettings()

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    slug: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isDirty, setIsDirty] = useState(false)

  // Sync form with server data
  useEffect(() => {
    if (settings) {
      setFormData({
        name: settings.name || '',
        description: settings.description || '',
        slug: settings.slug || '',
      })
      setIsDirty(false)
    }
  }, [settings])

  const validateSlug = (value: string): string | undefined => {
    if (!value) return undefined // Optional field
    const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/
    if (!slugRegex.test(value)) {
      return 'Slug must be lowercase with hyphens and numbers only'
    }
    return undefined
  }

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setIsDirty(true)

    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSlugBlur = () => {
    const error = validateSlug(formData.slug)
    if (error) {
      setErrors((prev) => ({ ...prev, slug: error }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate
    const slugError = validateSlug(formData.slug)
    if (slugError) {
      setErrors({ slug: slugError })
      return
    }

    // Only send changed fields
    const payload: Record<string, string> = {}
    if (formData.name && formData.name !== settings?.name) {
      payload.name = formData.name
    }
    if (formData.description !== (settings?.description || '')) {
      payload.description = formData.description
    }
    if (formData.slug !== (settings?.slug || '')) {
      payload.slug = formData.slug
    }

    if (Object.keys(payload).length === 0) {
      return // Nothing to update
    }

    updateSettings(payload, {
      onSuccess: () => {
        setIsDirty(false)
      },
    })
  }

  if (isLoading) {
    return <SettingsFormSkeleton />
  }

  const isValid = !errors.slug

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Store Name */}
      <div className="grid gap-2">
        <Label htmlFor="name" className="font-mono text-xs uppercase tracking-wider">
          NOM DE LA BOUTIQUE
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="My Awesome Store"
          disabled={isPending}
          className="border-[#333333] bg-transparent rounded-none focus:border-[#CCFF00] focus:ring-[#CCFF00]"
          data-testid="settings-name-input"
        />
      </div>

      {/* Description */}
      <div className="grid gap-2">
        <Label htmlFor="description" className="font-mono text-xs uppercase tracking-wider">
          DESCRIPTION
        </Label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="The best products at the best prices"
          disabled={isPending}
          className="flex min-h-[100px] w-full border border-[#333333] bg-transparent px-3 py-2 text-sm font-mono rounded-none focus:border-[#CCFF00] focus:ring-[#CCFF00] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          data-testid="settings-description-input"
        />
      </div>

      {/* Slug */}
      <div className="grid gap-2">
        <Label htmlFor="slug" className="font-mono text-xs uppercase tracking-wider">
          SLUG (URL)
        </Label>
        <Input
          id="slug"
          value={formData.slug}
          onChange={(e) => handleChange('slug', e.target.value.toLowerCase())}
          onBlur={handleSlugBlur}
          placeholder="my-awesome-store"
          disabled={isPending}
          className="border-[#333333] bg-transparent rounded-none focus:border-[#CCFF00] focus:ring-[#CCFF00]"
          data-testid="settings-slug-input"
        />
        {errors.slug && (
          <span className="font-mono text-xs text-destructive" data-testid="slug-error">
            {errors.slug}
          </span>
        )}
        <span className="font-mono text-xs text-muted-foreground">
          Utilisé dans l'URL: https://trafi.io/store/{formData.slug || 'your-slug'}
        </span>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isPending || !isDirty || !isValid}
        className="bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90 font-mono uppercase rounded-none"
        data-testid="settings-save-button"
      >
        {isPending ? 'ENREGISTREMENT...' : 'ENREGISTRER'}
      </Button>
    </form>
  )
}
