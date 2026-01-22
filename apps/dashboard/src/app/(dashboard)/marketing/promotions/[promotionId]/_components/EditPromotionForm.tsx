'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
import { useUpdatePromotion } from '../../_hooks'

type PromotionType = 'PERCENT' | 'FIXED' | 'FREE_SHIPPING' | 'BUY_X_GET_Y'

interface PromotionData {
  id: string
  name: string
  description: string | null
  type: string
  discountValue: number | null
  conditions?: Record<string, unknown> | null
  maxDiscountCents: number | null
  usageLimit: number | null
  usageCount: number
  perCustomerLimit: number | null
  startsAt: Date
  endsAt: Date | null
  status: string
  priority: number
  stackable: boolean
}

interface EditPromotionFormProps {
  promotion: PromotionData
  canUpdate: boolean
}

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

function formatDateForInput(date: Date | null): string {
  if (!date) return ''
  const d = new Date(date)
  return d.toISOString().slice(0, 16)
}

/**
 * Edit Promotion Form Component
 *
 * Form for editing an existing promotion.
 *
 * @see Story 3.9 - Promotions & Discounts Foundation
 */
export function EditPromotionForm({ promotion, canUpdate }: EditPromotionFormProps) {
  const router = useRouter()
  const { mutate: updatePromotion, isPending } = useUpdatePromotion()

  const conditions = promotion.conditions as Record<string, unknown> | null

  const [formData, setFormData] = useState<FormData>({
    name: promotion.name,
    description: promotion.description || '',
    type: promotion.type as PromotionType,
    discountValue: promotion.discountValue?.toString() || '',
    minOrderCents: (conditions?.minOrderCents as number)?.toString() || '',
    maxDiscountCents: promotion.maxDiscountCents?.toString() || '',
    usageLimit: promotion.usageLimit?.toString() || '',
    perCustomerLimit: promotion.perCustomerLimit?.toString() || '',
    startsAt: formatDateForInput(promotion.startsAt),
    endsAt: formatDateForInput(promotion.endsAt),
    priority: promotion.priority.toString(),
    stackable: promotion.stackable,
    buyQuantity: (conditions?.buyQuantity as number)?.toString() || '',
    getQuantity: (conditions?.getQuantity as number)?.toString() || '',
  })
  const [errors, setErrors] = useState<FormErrors>({})

  // Reset form when promotion changes
  useEffect(() => {
    const conds = promotion.conditions as Record<string, unknown> | null
    setFormData({
      name: promotion.name,
      description: promotion.description || '',
      type: promotion.type as PromotionType,
      discountValue: promotion.discountValue?.toString() || '',
      minOrderCents: (conds?.minOrderCents as number)?.toString() || '',
      maxDiscountCents: promotion.maxDiscountCents?.toString() || '',
      usageLimit: promotion.usageLimit?.toString() || '',
      perCustomerLimit: promotion.perCustomerLimit?.toString() || '',
      startsAt: formatDateForInput(promotion.startsAt),
      endsAt: formatDateForInput(promotion.endsAt),
      priority: promotion.priority.toString(),
      stackable: promotion.stackable,
      buyQuantity: (conds?.buyQuantity as number)?.toString() || '',
      getQuantity: (conds?.getQuantity as number)?.toString() || '',
    })
    setErrors({})
  }, [promotion])

  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

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

    const newConditions: Record<string, unknown> = {}
    if (formData.minOrderCents.trim()) {
      newConditions.minOrderCents = parseInt(formData.minOrderCents, 10)
    }
    if (formData.type === 'BUY_X_GET_Y') {
      newConditions.buyQuantity = parseInt(formData.buyQuantity, 10)
      newConditions.getQuantity = parseInt(formData.getQuantity, 10)
    }

    const payload = {
      id: promotion.id,
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      type: formData.type,
      discountValue:
        formData.type === 'FREE_SHIPPING' || formData.type === 'BUY_X_GET_Y'
          ? null
          : parseInt(formData.discountValue, 10),
      conditions: Object.keys(newConditions).length > 0 ? newConditions : null,
      maxDiscountCents: formData.maxDiscountCents.trim()
        ? parseInt(formData.maxDiscountCents, 10)
        : null,
      usageLimit: formData.usageLimit.trim()
        ? parseInt(formData.usageLimit, 10)
        : null,
      perCustomerLimit: formData.perCustomerLimit.trim()
        ? parseInt(formData.perCustomerLimit, 10)
        : null,
      startsAt: new Date(formData.startsAt),
      endsAt: formData.endsAt ? new Date(formData.endsAt) : null,
      priority: parseInt(formData.priority, 10) || 0,
      stackable: formData.stackable,
    }

    updatePromotion(payload, {
      onSuccess: () => {
        router.refresh()
      },
    })
  }

  const isDisabled = !canUpdate || isPending

  return (
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
              disabled={isDisabled}
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
              disabled={isDisabled}
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
              disabled={isDisabled}
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
                disabled={isDisabled}
              />
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
                  disabled={isDisabled}
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
                  disabled={isDisabled}
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
                disabled={isDisabled}
              />
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
              disabled={isDisabled}
            />
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
          <CardDescription>
            Current usage: {promotion.usageCount}
            {promotion.usageLimit && ` / ${promotion.usageLimit}`}
          </CardDescription>
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
                disabled={isDisabled}
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
                disabled={isDisabled}
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
                disabled={isDisabled}
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
                disabled={isDisabled}
              />
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
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="priority">Priority</Label>
            <Input
              id="priority"
              type="number"
              value={formData.priority}
              onChange={(e) => handleChange('priority', e.target.value)}
              disabled={isDisabled}
            />
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
              disabled={isDisabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {canUpdate && (
        <div className="flex items-center justify-end gap-4">
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}
    </form>
  )
}
