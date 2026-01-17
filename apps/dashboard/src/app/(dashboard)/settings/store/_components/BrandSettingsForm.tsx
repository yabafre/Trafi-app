'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useStoreSettings, useUpdateStoreSettings } from '../_hooks'
import { SettingsFormSkeleton } from './SettingsFormSkeleton'

interface FormData {
  primaryColor: string
  logoUrl: string
  faviconUrl: string
}

interface FormErrors {
  primaryColor?: string
}

const hexColorRegex = /^#[0-9A-Fa-f]{6}$/

/**
 * Brand settings form for colors and logo
 * AC: #1, #2
 */
export function BrandSettingsForm() {
  const { data: settings, isLoading } = useStoreSettings()
  const { mutate: updateSettings, isPending } = useUpdateStoreSettings()

  const [formData, setFormData] = useState<FormData>({
    primaryColor: '#CCFF00',
    logoUrl: '',
    faviconUrl: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isDirty, setIsDirty] = useState(false)

  // Sync form with server data
  useEffect(() => {
    if (settings) {
      setFormData({
        primaryColor: settings.primaryColor || '#CCFF00',
        logoUrl: settings.logoUrl || '',
        faviconUrl: settings.faviconUrl || '',
      })
      setIsDirty(false)
    }
  }, [settings])

  const validateColor = (value: string): string | undefined => {
    if (!value) return 'Couleur requise'
    if (!hexColorRegex.test(value)) {
      return 'Format hex invalide (ex: #CCFF00)'
    }
    return undefined
  }

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setIsDirty(true)

    if (field === 'primaryColor' && errors.primaryColor) {
      setErrors((prev) => ({ ...prev, primaryColor: undefined }))
    }
  }

  const handleColorBlur = () => {
    const error = validateColor(formData.primaryColor)
    if (error) {
      setErrors((prev) => ({ ...prev, primaryColor: error }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate color
    const colorError = validateColor(formData.primaryColor)
    if (colorError) {
      setErrors({ primaryColor: colorError })
      return
    }

    // Build payload with only changed fields
    const payload: Record<string, string | undefined> = {}

    if (formData.primaryColor !== settings?.primaryColor) {
      payload.primaryColor = formData.primaryColor
    }
    if (formData.logoUrl !== (settings?.logoUrl || '')) {
      payload.logoUrl = formData.logoUrl || undefined
    }
    if (formData.faviconUrl !== (settings?.faviconUrl || '')) {
      payload.faviconUrl = formData.faviconUrl || undefined
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

  const isValid = !errors.primaryColor

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Primary Color */}
      <div className="grid gap-2">
        <Label htmlFor="primaryColor" className="font-mono text-xs uppercase tracking-wider">
          COULEUR PRINCIPALE
        </Label>
        <div className="flex gap-3 items-center">
          <div
            className="h-10 w-10 border border-[#333333] flex-shrink-0"
            style={{ backgroundColor: hexColorRegex.test(formData.primaryColor) ? formData.primaryColor : '#000000' }}
            data-testid="color-preview"
          />
          <Input
            id="primaryColor"
            type="text"
            value={formData.primaryColor}
            onChange={(e) => handleChange('primaryColor', e.target.value.toUpperCase())}
            onBlur={handleColorBlur}
            placeholder="#CCFF00"
            maxLength={7}
            disabled={isPending}
            className="border-[#333333] bg-transparent rounded-none focus:border-[#CCFF00] focus:ring-[#CCFF00] font-mono"
            data-testid="settings-color-input"
          />
          <input
            type="color"
            value={hexColorRegex.test(formData.primaryColor) ? formData.primaryColor : '#CCFF00'}
            onChange={(e) => handleChange('primaryColor', e.target.value.toUpperCase())}
            disabled={isPending}
            className="h-10 w-10 cursor-pointer border-0 p-0 bg-transparent"
            data-testid="settings-color-picker"
          />
        </div>
        {errors.primaryColor && (
          <span className="font-mono text-xs text-destructive">{errors.primaryColor}</span>
        )}
        <span className="font-mono text-xs text-muted-foreground">
          Utilisee pour les boutons, liens et accents
        </span>
      </div>

      {/* Logo URL */}
      <div className="grid gap-2">
        <Label htmlFor="logoUrl" className="font-mono text-xs uppercase tracking-wider">
          URL DU LOGO
        </Label>
        <Input
          id="logoUrl"
          type="url"
          value={formData.logoUrl}
          onChange={(e) => handleChange('logoUrl', e.target.value)}
          placeholder="https://cdn.example.com/logo.png"
          disabled={isPending}
          className="border-[#333333] bg-transparent rounded-none focus:border-[#CCFF00] focus:ring-[#CCFF00]"
          data-testid="settings-logo-input"
        />
        {formData.logoUrl && (
          <div className="mt-2 p-4 border border-[#333333] bg-background">
            <img
              src={formData.logoUrl}
              alt="Logo preview"
              className="max-h-16 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          </div>
        )}
      </div>

      {/* Favicon URL */}
      <div className="grid gap-2">
        <Label htmlFor="faviconUrl" className="font-mono text-xs uppercase tracking-wider">
          URL DU FAVICON
        </Label>
        <Input
          id="faviconUrl"
          type="url"
          value={formData.faviconUrl}
          onChange={(e) => handleChange('faviconUrl', e.target.value)}
          placeholder="https://cdn.example.com/favicon.ico"
          disabled={isPending}
          className="border-[#333333] bg-transparent rounded-none focus:border-[#CCFF00] focus:ring-[#CCFF00]"
          data-testid="settings-favicon-input"
        />
        {formData.faviconUrl && (
          <div className="mt-2 flex items-center gap-2">
            <img
              src={formData.faviconUrl}
              alt="Favicon preview"
              className="h-4 w-4 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
            <span className="font-mono text-xs text-muted-foreground">Preview</span>
          </div>
        )}
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
