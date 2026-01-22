'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { usePermissions } from '@/lib/hooks'
import { useCreatePromotion } from '../_hooks'

type PromotionType = 'PERCENT' | 'FIXED' | 'FREE_SHIPPING' | 'BUY_X_GET_Y'

interface FormData {
  name: string
  description: string
  type: PromotionType
  discountValue: string
  minOrderCents: string
  maxDiscountCents: string
  usageLimit: string
  perCustomerLimit: string
  startsAt: string
  endsAt: string
  priority: string
  stackable: boolean
  buyQuantity: string
  getQuantity: string
}

interface FormErrors {
  name?: string
  discountValue?: string
  minOrderCents?: string
  maxDiscountCents?: string
  usageLimit?: string
  perCustomerLimit?: string
  startsAt?: string
  endsAt?: string
  priority?: string
  buyQuantity?: string
  getQuantity?: string
}

const initialFormData: FormData = {
  name: '',
  description: '',
  type: 'PERCENT',
  discountValue: '',
  minOrderCents: '',
  maxDiscountCents: '',
  usageLimit: '',
  perCustomerLimit: '',
  startsAt: '',
  endsAt: '',
  priority: '0',
  stackable: false,
  buyQuantity: '',
  getQuantity: '',
}

/**
 * New Promotion Page
 *
 * Form for creating a new promotion.
 *
 * @see Story 3.9 - Promotions & Discounts Foundation
 */
export default function NewPromotionPage() {
  const router = useRouter()
  const { hasPermission } = usePermissions()
  const canUpdate = hasPermission('settings:update')

  const { mutate: createPromotion, isPending } = useCreatePromotion()

  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [errors, setErrors] = useState<FormErrors>({})

  // Permission check
  if (!canUpdate) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h1 className="font-mono text-2xl uppercase tracking-wider text-destructive">
          ACCESS DENIED
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have the necessary permissions to create promotions.
        </p>
      </div>
    )
  }

  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    // Validate discount value based on type
    if (formData.type !== 'FREE_SHIPPING' && formData.type !== 'BUY_X_GET_Y') {
      if (!formData.discountValue.trim()) {
        newErrors.discountValue = 'Discount value is required'
      } else {
        const value = parseInt(formData.discountValue, 10)
        if (isNaN(value) || value < 1) {
          newErrors.discountValue = 'Must be at least 1'
        }
        if (formData.type === 'PERCENT' && value > 100) {
          newErrors.discountValue = 'Percentage must be between 1 and 100'
        }
      }
    }

    // Validate BUY_X_GET_Y specific fields
    if (formData.type === 'BUY_X_GET_Y') {
      if (!formData.buyQuantity.trim()) {
        newErrors.buyQuantity = 'Buy quantity is required'
      } else {
        const value = parseInt(formData.buyQuantity, 10)
        if (isNaN(value) || value < 1) {
          newErrors.buyQuantity = 'Must be at least 1'
        }
      }
      if (!formData.getQuantity.trim()) {
        newErrors.getQuantity = 'Get quantity is required'
      } else {
        const value = parseInt(formData.getQuantity, 10)
        if (isNaN(value) || value < 1) {
          newErrors.getQuantity = 'Must be at least 1'
        }
      }
    }

    // Validate optional numeric fields
    if (formData.minOrderCents.trim()) {
      const value = parseInt(formData.minOrderCents, 10)
      if (isNaN(value) || value < 0) {
        newErrors.minOrderCents = 'Must be a positive number'
      }
    }

    if (formData.maxDiscountCents.trim()) {
      const value = parseInt(formData.maxDiscountCents, 10)
      if (isNaN(value) || value < 0) {
        newErrors.maxDiscountCents = 'Must be a positive number'
      }
    }

    if (formData.usageLimit.trim()) {
      const value = parseInt(formData.usageLimit, 10)
      if (isNaN(value) || value < 1) {
        newErrors.usageLimit = 'Must be at least 1'
      }
    }

    if (formData.perCustomerLimit.trim()) {
      const value = parseInt(formData.perCustomerLimit, 10)
      if (isNaN(value) || value < 1) {
        newErrors.perCustomerLimit = 'Must be at least 1'
      }
    }

    // Validate dates
    if (!formData.startsAt) {
      newErrors.startsAt = 'Start date is required'
    }

    if (formData.endsAt && formData.startsAt) {
      if (new Date(formData.endsAt) <= new Date(formData.startsAt)) {
        newErrors.endsAt = 'End date must be after start date'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (typeof value === 'string' && field in errors) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    // Build conditions object
    const conditions: Record<string, unknown> = {}
    if (formData.minOrderCents.trim()) {
      conditions.minOrderCents = parseInt(formData.minOrderCents, 10)
    }
    if (formData.type === 'BUY_X_GET_Y') {
      conditions.buyQuantity = parseInt(formData.buyQuantity, 10)
      conditions.getQuantity = parseInt(formData.getQuantity, 10)
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      type: formData.type,
      discountValue:
        formData.type === 'FREE_SHIPPING' || formData.type === 'BUY_X_GET_Y'
          ? undefined
          : parseInt(formData.discountValue, 10),
      conditions: Object.keys(conditions).length > 0 ? conditions : undefined,
      maxDiscountCents: formData.maxDiscountCents.trim()
        ? parseInt(formData.maxDiscountCents, 10)
        : undefined,
      usageLimit: formData.usageLimit.trim()
        ? parseInt(formData.usageLimit, 10)
        : undefined,
      perCustomerLimit: formData.perCustomerLimit.trim()
        ? parseInt(formData.perCustomerLimit, 10)
        : undefined,
      startsAt: new Date(formData.startsAt),
      endsAt: formData.endsAt ? new Date(formData.endsAt) : undefined,
      priority: parseInt(formData.priority, 10) || 0,
      stackable: formData.stackable,
    }

    createPromotion(payload, {
      onSuccess: () => {
        router.push('/marketing/promotions')
      },
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="font-mono text-2xl uppercase tracking-wider">
            NEW PROMOTION
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a new promotion or discount code campaign.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Name and description of the promotion.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., Summer Sale 2026"
                disabled={isPending}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Optional description for internal reference"
                disabled={isPending}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Discount Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Discount Settings</CardTitle>
            <CardDescription>Configure the type and value of the discount.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="type">Discount Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleChange('type', value)}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENT">Percentage Off</SelectItem>
                  <SelectItem value="FIXED">Fixed Amount Off</SelectItem>
                  <SelectItem value="FREE_SHIPPING">Free Shipping</SelectItem>
                  <SelectItem value="BUY_X_GET_Y">Buy X Get Y</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.type !== 'FREE_SHIPPING' && formData.type !== 'BUY_X_GET_Y' && (
              <div className="grid gap-2">
                <Label htmlFor="discountValue">
                  {formData.type === 'PERCENT'
                    ? 'Discount Percentage *'
                    : 'Discount Amount (cents) *'}
                </Label>
                <Input
                  id="discountValue"
                  type="number"
                  min="1"
                  max={formData.type === 'PERCENT' ? 100 : undefined}
                  value={formData.discountValue}
                  onChange={(e) => handleChange('discountValue', e.target.value)}
                  placeholder={formData.type === 'PERCENT' ? 'e.g., 10' : 'e.g., 1000'}
                  disabled={isPending}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.type === 'PERCENT'
                    ? 'Enter percentage (e.g., 10 for 10% off)'
                    : 'Enter amount in cents (e.g., 1000 for 10.00 off)'}
                </p>
                {errors.discountValue && (
                  <p className="text-sm text-destructive">{errors.discountValue}</p>
                )}
              </div>
            )}

            {formData.type === 'BUY_X_GET_Y' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="buyQuantity">Buy Quantity *</Label>
                  <Input
                    id="buyQuantity"
                    type="number"
                    min="1"
                    value={formData.buyQuantity}
                    onChange={(e) => handleChange('buyQuantity', e.target.value)}
                    placeholder="e.g., 2"
                    disabled={isPending}
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of items customer must buy
                  </p>
                  {errors.buyQuantity && (
                    <p className="text-sm text-destructive">{errors.buyQuantity}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="getQuantity">Get Quantity Free *</Label>
                  <Input
                    id="getQuantity"
                    type="number"
                    min="1"
                    value={formData.getQuantity}
                    onChange={(e) => handleChange('getQuantity', e.target.value)}
                    placeholder="e.g., 1"
                    disabled={isPending}
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of free items customer gets
                  </p>
                  {errors.getQuantity && (
                    <p className="text-sm text-destructive">{errors.getQuantity}</p>
                  )}
                </div>
              </div>
            )}

            {formData.type === 'PERCENT' && (
              <div className="grid gap-2">
                <Label htmlFor="maxDiscountCents">Maximum Discount (cents)</Label>
                <Input
                  id="maxDiscountCents"
                  type="number"
                  min="0"
                  value={formData.maxDiscountCents}
                  onChange={(e) => handleChange('maxDiscountCents', e.target.value)}
                  placeholder="e.g., 5000"
                  disabled={isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Cap the maximum discount amount (e.g., 5000 for max 50.00 off)
                </p>
                {errors.maxDiscountCents && (
                  <p className="text-sm text-destructive">{errors.maxDiscountCents}</p>
                )}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="minOrderCents">Minimum Order Amount (cents)</Label>
              <Input
                id="minOrderCents"
                type="number"
                min="0"
                value={formData.minOrderCents}
                onChange={(e) => handleChange('minOrderCents', e.target.value)}
                placeholder="e.g., 5000"
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground">
                Minimum order value required (e.g., 5000 for 50.00 minimum)
              </p>
              {errors.minOrderCents && (
                <p className="text-sm text-destructive">{errors.minOrderCents}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Usage Limits */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Limits</CardTitle>
            <CardDescription>Control how many times the promotion can be used.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="usageLimit">Total Usage Limit</Label>
                <Input
                  id="usageLimit"
                  type="number"
                  min="1"
                  value={formData.usageLimit}
                  onChange={(e) => handleChange('usageLimit', e.target.value)}
                  placeholder="Unlimited"
                  disabled={isPending}
                />
                {errors.usageLimit && (
                  <p className="text-sm text-destructive">{errors.usageLimit}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="perCustomerLimit">Per Customer Limit</Label>
                <Input
                  id="perCustomerLimit"
                  type="number"
                  min="1"
                  value={formData.perCustomerLimit}
                  onChange={(e) => handleChange('perCustomerLimit', e.target.value)}
                  placeholder="Unlimited"
                  disabled={isPending}
                />
                {errors.perCustomerLimit && (
                  <p className="text-sm text-destructive">{errors.perCustomerLimit}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Schedule</CardTitle>
            <CardDescription>Set when the promotion is active.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startsAt">Start Date *</Label>
                <Input
                  id="startsAt"
                  type="datetime-local"
                  value={formData.startsAt}
                  onChange={(e) => handleChange('startsAt', e.target.value)}
                  disabled={isPending}
                />
                {errors.startsAt && (
                  <p className="text-sm text-destructive">{errors.startsAt}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endsAt">End Date</Label>
                <Input
                  id="endsAt"
                  type="datetime-local"
                  value={formData.endsAt}
                  onChange={(e) => handleChange('endsAt', e.target.value)}
                  disabled={isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty for no end date
                </p>
                {errors.endsAt && (
                  <p className="text-sm text-destructive">{errors.endsAt}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Options */}
        <Card>
          <CardHeader>
            <CardTitle>Advanced Options</CardTitle>
            <CardDescription>Additional promotion settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <Input
                id="priority"
                type="number"
                value={formData.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
                placeholder="0"
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground">
                Higher priority promotions are applied first (default: 0)
              </p>
              {errors.priority && (
                <p className="text-sm text-destructive">{errors.priority}</p>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="stackable">Stackable</Label>
                <p className="text-xs text-muted-foreground">
                  Allow combining with other promotions
                </p>
              </div>
              <Switch
                id="stackable"
                checked={formData.stackable}
                onCheckedChange={(checked) => handleChange('stackable', checked)}
                disabled={isPending}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Creating...' : 'Create Promotion'}
          </Button>
        </div>
      </form>
    </div>
  )
}
