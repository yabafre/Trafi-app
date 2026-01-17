'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useStoreSettings, useUpdateStoreSettings } from '../_hooks'
import { SettingsFormSkeleton } from './SettingsFormSkeleton'

interface AddressData {
  street?: string
  city?: string
  postalCode?: string
  country?: string
}

interface FormData {
  contactEmail: string
  supportEmail: string
  phoneNumber: string
  address: AddressData
}

interface FormErrors {
  contactEmail?: string
  supportEmail?: string
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Contact settings form for emails, phone, and address
 * AC: #1, #2
 */
export function ContactSettingsForm() {
  const { data: settings, isLoading } = useStoreSettings()
  const { mutate: updateSettings, isPending } = useUpdateStoreSettings()

  const [formData, setFormData] = useState<FormData>({
    contactEmail: '',
    supportEmail: '',
    phoneNumber: '',
    address: {},
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isDirty, setIsDirty] = useState(false)

  // Sync form with server data
  useEffect(() => {
    if (settings) {
      setFormData({
        contactEmail: settings.contactEmail || '',
        supportEmail: settings.supportEmail || '',
        phoneNumber: settings.phoneNumber || '',
        address: (settings.address as AddressData) || {},
      })
      setIsDirty(false)
    }
  }, [settings])

  const validateEmail = (value: string, field: 'contactEmail' | 'supportEmail'): boolean => {
    if (!value) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
      return true // Optional field
    }
    if (!emailRegex.test(value)) {
      setErrors((prev) => ({ ...prev, [field]: 'Email invalide' }))
      return false
    }
    setErrors((prev) => ({ ...prev, [field]: undefined }))
    return true
  }

  const handleChange = (field: keyof FormData, value: string | AddressData) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setIsDirty(true)

    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleAddressChange = (field: keyof AddressData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }))
    setIsDirty(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate emails
    const contactValid = validateEmail(formData.contactEmail, 'contactEmail')
    const supportValid = validateEmail(formData.supportEmail, 'supportEmail')

    if (!contactValid || !supportValid) {
      return
    }

    // Build payload with only changed fields
    const payload: Record<string, unknown> = {}

    if (formData.contactEmail !== (settings?.contactEmail || '')) {
      payload.contactEmail = formData.contactEmail || undefined
    }
    if (formData.supportEmail !== (settings?.supportEmail || '')) {
      payload.supportEmail = formData.supportEmail || undefined
    }
    if (formData.phoneNumber !== (settings?.phoneNumber || '')) {
      payload.phoneNumber = formData.phoneNumber || undefined
    }

    // Check if address changed
    const currentAddress = (settings?.address as AddressData) || {}
    const addressChanged =
      formData.address.street !== currentAddress.street ||
      formData.address.city !== currentAddress.city ||
      formData.address.postalCode !== currentAddress.postalCode ||
      formData.address.country !== currentAddress.country

    if (addressChanged) {
      payload.address = formData.address
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

  const isValid = !errors.contactEmail && !errors.supportEmail

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Contact Email */}
      <div className="grid gap-2">
        <Label htmlFor="contactEmail" className="font-mono text-xs uppercase tracking-wider">
          EMAIL DE CONTACT
        </Label>
        <Input
          id="contactEmail"
          type="email"
          value={formData.contactEmail}
          onChange={(e) => handleChange('contactEmail', e.target.value)}
          onBlur={() => validateEmail(formData.contactEmail, 'contactEmail')}
          placeholder="contact@mystore.com"
          disabled={isPending}
          className="border-[#333333] bg-transparent rounded-none focus:border-[#CCFF00] focus:ring-[#CCFF00]"
          data-testid="settings-contact-email-input"
        />
        {errors.contactEmail && (
          <span className="font-mono text-xs text-destructive">{errors.contactEmail}</span>
        )}
      </div>

      {/* Support Email */}
      <div className="grid gap-2">
        <Label htmlFor="supportEmail" className="font-mono text-xs uppercase tracking-wider">
          EMAIL DE SUPPORT
        </Label>
        <Input
          id="supportEmail"
          type="email"
          value={formData.supportEmail}
          onChange={(e) => handleChange('supportEmail', e.target.value)}
          onBlur={() => validateEmail(formData.supportEmail, 'supportEmail')}
          placeholder="support@mystore.com"
          disabled={isPending}
          className="border-[#333333] bg-transparent rounded-none focus:border-[#CCFF00] focus:ring-[#CCFF00]"
          data-testid="settings-support-email-input"
        />
        {errors.supportEmail && (
          <span className="font-mono text-xs text-destructive">{errors.supportEmail}</span>
        )}
      </div>

      {/* Phone */}
      <div className="grid gap-2">
        <Label htmlFor="phoneNumber" className="font-mono text-xs uppercase tracking-wider">
          TELEPHONE
        </Label>
        <Input
          id="phoneNumber"
          type="tel"
          value={formData.phoneNumber}
          onChange={(e) => handleChange('phoneNumber', e.target.value)}
          placeholder="+33 1 23 45 67 89"
          disabled={isPending}
          className="border-[#333333] bg-transparent rounded-none focus:border-[#CCFF00] focus:ring-[#CCFF00]"
          data-testid="settings-phone-input"
        />
      </div>

      {/* Address */}
      <div className="grid gap-4">
        <Label className="font-mono text-xs uppercase tracking-wider">ADRESSE</Label>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="street" className="font-mono text-[10px] uppercase text-muted-foreground">
              RUE
            </Label>
            <Input
              id="street"
              value={formData.address.street || ''}
              onChange={(e) => handleAddressChange('street', e.target.value)}
              placeholder="123 Commerce Street"
              disabled={isPending}
              className="border-[#333333] bg-transparent rounded-none focus:border-[#CCFF00] focus:ring-[#CCFF00]"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="city" className="font-mono text-[10px] uppercase text-muted-foreground">
              VILLE
            </Label>
            <Input
              id="city"
              value={formData.address.city || ''}
              onChange={(e) => handleAddressChange('city', e.target.value)}
              placeholder="Paris"
              disabled={isPending}
              className="border-[#333333] bg-transparent rounded-none focus:border-[#CCFF00] focus:ring-[#CCFF00]"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="postalCode" className="font-mono text-[10px] uppercase text-muted-foreground">
              CODE POSTAL
            </Label>
            <Input
              id="postalCode"
              value={formData.address.postalCode || ''}
              onChange={(e) => handleAddressChange('postalCode', e.target.value)}
              placeholder="75001"
              disabled={isPending}
              className="border-[#333333] bg-transparent rounded-none focus:border-[#CCFF00] focus:ring-[#CCFF00]"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="country" className="font-mono text-[10px] uppercase text-muted-foreground">
              PAYS (CODE ISO)
            </Label>
            <Input
              id="country"
              value={formData.address.country || ''}
              onChange={(e) => handleAddressChange('country', e.target.value.toUpperCase().slice(0, 2))}
              placeholder="FR"
              maxLength={2}
              disabled={isPending}
              className="border-[#333333] bg-transparent rounded-none focus:border-[#CCFF00] focus:ring-[#CCFF00]"
            />
          </div>
        </div>
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
