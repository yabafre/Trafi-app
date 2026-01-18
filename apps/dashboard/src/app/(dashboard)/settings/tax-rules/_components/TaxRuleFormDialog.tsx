'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCreateTaxRule, useUpdateTaxRule } from '../_hooks'
import type { TaxRuleResponse } from '../_actions'

interface TaxRuleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taxRule: TaxRuleResponse | null
}

interface FormData {
  name: string
  rate: string // String for input, converted to number on submit
  countryIso2: string
  isDefault: boolean
  appliesToShipping: boolean
}

interface FormErrors {
  name?: string
  rate?: string
  countryIso2?: string
}

/**
 * Tax Rule Form Dialog
 *
 * Used for creating and editing tax rules.
 * Supports rate as percentage, ISO2 country code, default and shipping flags.
 *
 * Digital Brutalism design pattern.
 *
 * @see Story 3.6 - Product Pricing and Tax Rules
 */
export function TaxRuleFormDialog({
  open,
  onOpenChange,
  taxRule,
}: TaxRuleFormDialogProps) {
  const { mutate: createTaxRule, isPending: isCreating } = useCreateTaxRule()
  const { mutate: updateTaxRule, isPending: isUpdating } = useUpdateTaxRule()

  const isEditMode = !!taxRule
  const isPending = isCreating || isUpdating

  const [formData, setFormData] = useState<FormData>({
    name: '',
    rate: '',
    countryIso2: '',
    isDefault: false,
    appliesToShipping: false,
  })
  const [errors, setErrors] = useState<FormErrors>({})

  // Reset form when dialog opens/closes or taxRule changes
  useEffect(() => {
    if (open) {
      if (taxRule) {
        setFormData({
          name: taxRule.name,
          rate: taxRule.rate.toString(),
          countryIso2: taxRule.countryIso2,
          isDefault: taxRule.isDefault,
          appliesToShipping: taxRule.appliesToShipping,
        })
      } else {
        setFormData({
          name: '',
          rate: '',
          countryIso2: '',
          isDefault: false,
          appliesToShipping: false,
        })
      }
      setErrors({})
    }
  }, [open, taxRule])

  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    const rateNum = parseFloat(formData.rate)
    if (!formData.rate.trim()) {
      newErrors.rate = 'Rate is required'
    } else if (isNaN(rateNum) || rateNum < 0 || rateNum > 100) {
      newErrors.rate = 'Rate must be between 0 and 100'
    }

    if (!formData.countryIso2.trim()) {
      newErrors.countryIso2 = 'Country code is required'
    } else if (!/^[A-Za-z]{2}$/.test(formData.countryIso2.trim())) {
      newErrors.countryIso2 = 'Must be a 2-letter country code (e.g., FR, US)'
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
      rate: parseFloat(formData.rate),
      countryIso2: formData.countryIso2.trim().toUpperCase(),
      isDefault: formData.isDefault,
      appliesToShipping: formData.appliesToShipping,
    }

    if (isEditMode) {
      updateTaxRule(
        { id: taxRule!.id, ...payload },
        { onSuccess: () => onOpenChange(false) }
      )
    } else {
      createTaxRule(payload, { onSuccess: () => onOpenChange(false) })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Edit Tax Rule' : 'Create Tax Rule'}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? 'Update the tax rule details below.'
                : 'Fill in the details to create a new tax rule.'}
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
                placeholder="e.g., Standard VAT France"
                disabled={isPending}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            {/* Rate */}
            <div className="grid gap-2">
              <Label htmlFor="rate">Rate (%) *</Label>
              <Input
                id="rate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.rate}
                onChange={(e) => handleChange('rate', e.target.value)}
                placeholder="e.g., 20.00"
                disabled={isPending}
              />
              {errors.rate && (
                <p className="text-sm text-destructive">{errors.rate}</p>
              )}
            </div>

            {/* Country Code */}
            <div className="grid gap-2">
              <Label htmlFor="countryIso2">Country Code *</Label>
              <Input
                id="countryIso2"
                value={formData.countryIso2}
                onChange={(e) => handleChange('countryIso2', e.target.value.toUpperCase())}
                placeholder="e.g., FR"
                maxLength={2}
                disabled={isPending}
              />
              {errors.countryIso2 && (
                <p className="text-sm text-destructive">{errors.countryIso2}</p>
              )}
            </div>

            {/* Default and Shipping toggles */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <Switch
                  id="isDefault"
                  checked={formData.isDefault}
                  onCheckedChange={(checked) => handleChange('isDefault', checked)}
                  disabled={isPending}
                />
                <Label htmlFor="isDefault">Default Rule</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="appliesToShipping"
                  checked={formData.appliesToShipping}
                  onCheckedChange={(checked) => handleChange('appliesToShipping', checked)}
                  disabled={isPending}
                />
                <Label htmlFor="appliesToShipping">Apply to Shipping</Label>
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
