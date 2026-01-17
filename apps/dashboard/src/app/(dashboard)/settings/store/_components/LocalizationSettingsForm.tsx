'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useStoreSettings, useUpdateStoreSettings } from '../_hooks'
import { SettingsFormSkeleton } from './SettingsFormSkeleton'

interface FormData {
  defaultCurrency: string
  defaultLocale: string
  timezone: string
  weightUnit: string
}

const CURRENCIES = [
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'CHF', label: 'CHF - Swiss Franc' },
]

const LOCALES = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Francais' },
  { value: 'de', label: 'Deutsch' },
  { value: 'es', label: 'Espanol' },
  { value: 'it', label: 'Italiano' },
]

const TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET)' },
  { value: 'Europe/London', label: 'Europe/London (GMT)' },
  { value: 'America/New_York', label: 'America/New_York (EST)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
]

const WEIGHT_UNITS = [
  { value: 'g', label: 'Grammes (g)' },
  { value: 'kg', label: 'Kilogrammes (kg)' },
  { value: 'lb', label: 'Pounds (lb)' },
  { value: 'oz', label: 'Ounces (oz)' },
]

/**
 * Localization settings form for currency, locale, timezone, weight unit
 * AC: #1, #2
 */
export function LocalizationSettingsForm() {
  const { data: settings, isLoading } = useStoreSettings()
  const { mutate: updateSettings, isPending } = useUpdateStoreSettings()

  const [formData, setFormData] = useState<FormData>({
    defaultCurrency: 'EUR',
    defaultLocale: 'en',
    timezone: 'UTC',
    weightUnit: 'g',
  })
  const [isDirty, setIsDirty] = useState(false)

  // Sync form with server data
  useEffect(() => {
    if (settings) {
      setFormData({
        defaultCurrency: settings.defaultCurrency || 'EUR',
        defaultLocale: settings.defaultLocale || 'en',
        timezone: settings.timezone || 'UTC',
        weightUnit: settings.weightUnit || 'g',
      })
      setIsDirty(false)
    }
  }, [settings])

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setIsDirty(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Only send changed fields
    const payload: Record<string, string> = {}
    if (formData.defaultCurrency !== settings?.defaultCurrency) {
      payload.defaultCurrency = formData.defaultCurrency
    }
    if (formData.defaultLocale !== settings?.defaultLocale) {
      payload.defaultLocale = formData.defaultLocale
    }
    if (formData.timezone !== settings?.timezone) {
      payload.timezone = formData.timezone
    }
    if (formData.weightUnit !== settings?.weightUnit) {
      payload.weightUnit = formData.weightUnit
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Currency */}
      <div className="grid gap-2">
        <Label className="font-mono text-xs uppercase tracking-wider">
          DEVISE PAR DEFAUT
        </Label>
        <Select
          value={formData.defaultCurrency}
          onValueChange={(value) => handleChange('defaultCurrency', value)}
          disabled={isPending}
        >
          <SelectTrigger
            className="border-[#333333] bg-transparent rounded-none focus:border-[#CCFF00]"
            data-testid="settings-currency-select"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((currency) => (
              <SelectItem key={currency.value} value={currency.value}>
                {currency.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Locale */}
      <div className="grid gap-2">
        <Label className="font-mono text-xs uppercase tracking-wider">
          LANGUE PAR DEFAUT
        </Label>
        <Select
          value={formData.defaultLocale}
          onValueChange={(value) => handleChange('defaultLocale', value)}
          disabled={isPending}
        >
          <SelectTrigger
            className="border-[#333333] bg-transparent rounded-none focus:border-[#CCFF00]"
            data-testid="settings-locale-select"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LOCALES.map((locale) => (
              <SelectItem key={locale.value} value={locale.value}>
                {locale.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Timezone */}
      <div className="grid gap-2">
        <Label className="font-mono text-xs uppercase tracking-wider">
          FUSEAU HORAIRE
        </Label>
        <Select
          value={formData.timezone}
          onValueChange={(value) => handleChange('timezone', value)}
          disabled={isPending}
        >
          <SelectTrigger
            className="border-[#333333] bg-transparent rounded-none focus:border-[#CCFF00]"
            data-testid="settings-timezone-select"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONES.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>
                {tz.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Weight Unit */}
      <div className="grid gap-2">
        <Label className="font-mono text-xs uppercase tracking-wider">
          UNITE DE POIDS
        </Label>
        <Select
          value={formData.weightUnit}
          onValueChange={(value) => handleChange('weightUnit', value)}
          disabled={isPending}
        >
          <SelectTrigger
            className="border-[#333333] bg-transparent rounded-none focus:border-[#CCFF00]"
            data-testid="settings-weight-select"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WEIGHT_UNITS.map((unit) => (
              <SelectItem key={unit.value} value={unit.value}>
                {unit.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isPending || !isDirty}
        className="bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90 font-mono uppercase rounded-none"
        data-testid="settings-save-button"
      >
        {isPending ? 'ENREGISTREMENT...' : 'ENREGISTRER'}
      </Button>
    </form>
  )
}
