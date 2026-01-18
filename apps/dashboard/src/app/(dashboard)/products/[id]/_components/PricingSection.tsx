'use client'

/**
 * Pricing Section Component
 *
 * Detailed pricing editor for a single product variant.
 * Supports price, compare-at price, cost price, tax rule assignment.
 * Shows calculated margin and tax information.
 * Digital Brutalism v2 design pattern.
 *
 * @see Story 3.6 - Product Pricing and Tax Rules
 */

import { useState, useEffect } from 'react'
import { DollarSign, Percent, Calculator, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { formatPrice } from '@/lib/utils'
import {
  useUpdateVariantPricing,
  useTaxRulesForSelect,
  useCalculateTax,
  useCalculateMargin,
} from '../../_hooks'
import type { VariantResponse } from '@trafi/validators'

interface PricingSectionProps {
  variant: VariantResponse
  productId: string
  canEdit: boolean
}

interface PricingFormData {
  priceInCents: number
  compareAtPriceInCents: number | null
  costPriceInCents: number | null
  taxRuleId: string | null
}

/**
 * Convert cents to euros for display/editing
 */
function centsToEuros(cents: number | null): string {
  if (cents === null || cents === undefined) return ''
  return (cents / 100).toFixed(2)
}

/**
 * Convert euros input to cents
 */
function eurosToCents(euros: string): number | null {
  if (!euros || euros.trim() === '') return null
  const value = parseFloat(euros.replace(',', '.'))
  if (isNaN(value)) return null
  return Math.round(value * 100)
}

export function PricingSection({ variant, productId, canEdit }: PricingSectionProps) {
  const { data: taxRules, isLoading: taxRulesLoading } = useTaxRulesForSelect()
  const { mutate: updatePricing, isPending: isUpdating } = useUpdateVariantPricing()
  const { mutateAsync: calculateTax } = useCalculateTax()
  const { mutateAsync: calculateMargin } = useCalculateMargin()

  // Local form state
  const [formData, setFormData] = useState<PricingFormData>({
    priceInCents: variant.priceInCents,
    compareAtPriceInCents: variant.compareAtPriceInCents,
    costPriceInCents: variant.costPriceInCents,
    taxRuleId: variant.taxRuleId,
  })

  // Display values (euros for editing)
  const [priceDisplay, setPriceDisplay] = useState(centsToEuros(variant.priceInCents))
  const [compareAtDisplay, setCompareAtDisplay] = useState(centsToEuros(variant.compareAtPriceInCents))
  const [costPriceDisplay, setCostPriceDisplay] = useState(centsToEuros(variant.costPriceInCents))

  // Tax included toggle state (Prix TTC / Prix HT)
  const [taxIncluded, setTaxIncluded] = useState(true)

  // Calculated values
  const [taxAmount, setTaxAmount] = useState<number | null>(null)
  const [taxRate, setTaxRate] = useState<number | null>(null)
  const [netPrice, setNetPrice] = useState<number | null>(null)
  const [grossPrice, setGrossPrice] = useState<number | null>(null)
  const [margin, setMargin] = useState<{ amount: number; percentage: number } | null>(null)

  // Track if form has unsaved changes
  const hasChanges =
    formData.priceInCents !== variant.priceInCents ||
    formData.compareAtPriceInCents !== variant.compareAtPriceInCents ||
    formData.costPriceInCents !== variant.costPriceInCents ||
    formData.taxRuleId !== variant.taxRuleId

  // Reset form when variant changes
  useEffect(() => {
    setFormData({
      priceInCents: variant.priceInCents,
      compareAtPriceInCents: variant.compareAtPriceInCents,
      costPriceInCents: variant.costPriceInCents,
      taxRuleId: variant.taxRuleId,
    })
    setPriceDisplay(centsToEuros(variant.priceInCents))
    setCompareAtDisplay(centsToEuros(variant.compareAtPriceInCents))
    setCostPriceDisplay(centsToEuros(variant.costPriceInCents))
  }, [variant])

  // Calculate tax when price, tax rule, or taxIncluded changes
  useEffect(() => {
    const calculateTaxAmount = async () => {
      if (formData.priceInCents > 0 && formData.taxRuleId && taxRules) {
        // Find the selected tax rule to get its rate
        const selectedRule = taxRules.find((r) => r.id === formData.taxRuleId)
        if (selectedRule) {
          try {
            const result = await calculateTax({
              priceInCents: formData.priceInCents,
              taxRate: selectedRule.rate,
              taxIncluded, // Use toggle state
            })
            setTaxAmount(result.taxAmountInCents)
            setTaxRate(result.taxRate)
            setNetPrice(result.netPriceInCents)
            setGrossPrice(result.grossPriceInCents)
          } catch {
            setTaxAmount(null)
            setTaxRate(null)
            setNetPrice(null)
            setGrossPrice(null)
          }
        } else {
          setTaxAmount(null)
          setTaxRate(null)
          setNetPrice(null)
          setGrossPrice(null)
        }
      } else {
        setTaxAmount(null)
        setTaxRate(null)
        setNetPrice(null)
        setGrossPrice(null)
      }
    }
    calculateTaxAmount()
  }, [formData.priceInCents, formData.taxRuleId, taxRules, taxIncluded, calculateTax])

  // Calculate margin when price or cost changes
  useEffect(() => {
    const calculateMarginAmount = async () => {
      if (formData.priceInCents > 0 && formData.costPriceInCents && formData.costPriceInCents > 0) {
        try {
          const result = await calculateMargin({
            priceInCents: formData.priceInCents,
            costPriceInCents: formData.costPriceInCents,
          })
          if (result) {
            setMargin({
              amount: result.marginInCents,
              percentage: result.marginPercent,
            })
          } else {
            setMargin(null)
          }
        } catch {
          setMargin(null)
        }
      } else {
        setMargin(null)
      }
    }
    calculateMarginAmount()
  }, [formData.priceInCents, formData.costPriceInCents, calculateMargin])

  const handlePriceChange = (value: string) => {
    setPriceDisplay(value)
    const cents = eurosToCents(value)
    if (cents !== null) {
      setFormData((prev) => ({ ...prev, priceInCents: cents }))
    }
  }

  const handleCompareAtChange = (value: string) => {
    setCompareAtDisplay(value)
    const cents = eurosToCents(value)
    setFormData((prev) => ({ ...prev, compareAtPriceInCents: cents }))
  }

  const handleCostPriceChange = (value: string) => {
    setCostPriceDisplay(value)
    const cents = eurosToCents(value)
    setFormData((prev) => ({ ...prev, costPriceInCents: cents }))
  }

  const handleTaxRuleChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      taxRuleId: value === 'none' ? null : value,
    }))
  }

  const handleSave = () => {
    updatePricing({
      variantId: variant.id,
      priceInCents: formData.priceInCents,
      compareAtPriceInCents: formData.compareAtPriceInCents,
      costPriceInCents: formData.costPriceInCents,
      taxRuleId: formData.taxRuleId,
    })
  }

  const handleReset = () => {
    setFormData({
      priceInCents: variant.priceInCents,
      compareAtPriceInCents: variant.compareAtPriceInCents,
      costPriceInCents: variant.costPriceInCents,
      taxRuleId: variant.taxRuleId,
    })
    setPriceDisplay(centsToEuros(variant.priceInCents))
    setCompareAtDisplay(centsToEuros(variant.compareAtPriceInCents))
    setCostPriceDisplay(centsToEuros(variant.costPriceInCents))
  }

  // Get discount percentage if compare-at price is set
  const discountPercentage =
    formData.compareAtPriceInCents && formData.compareAtPriceInCents > formData.priceInCents
      ? Math.round(
          ((formData.compareAtPriceInCents - formData.priceInCents) / formData.compareAtPriceInCents) *
            100
        )
      : null

  return (
    <div className="border border-border">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-secondary/30">
        <div>
          <h3 className="font-mono text-sm uppercase tracking-wider">PRICING</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage prices, taxes, and margins
          </p>
        </div>
        {canEdit && hasChanges && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleReset} disabled={isUpdating}>
              Reset
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isUpdating}>
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Price Inputs */}
          <div className="space-y-4">
            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="price" className="flex items-center gap-2">
                <DollarSign className="size-4" />
                Price (EUR) *
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={priceDisplay}
                onChange={(e) => handlePriceChange(e.target.value)}
                disabled={!canEdit || isUpdating}
                placeholder="0.00"
                className="font-mono"
              />
            </div>

            {/* Compare At Price */}
            <div className="space-y-2">
              <Label htmlFor="compareAt" className="flex items-center gap-2">
                <Percent className="size-4" />
                Compare At Price (EUR)
                {discountPercentage && (
                  <span className="text-xs bg-green-500/20 text-green-500 px-1.5 py-0.5">
                    -{discountPercentage}%
                  </span>
                )}
              </Label>
              <Input
                id="compareAt"
                type="number"
                step="0.01"
                min="0"
                value={compareAtDisplay}
                onChange={(e) => handleCompareAtChange(e.target.value)}
                disabled={!canEdit || isUpdating}
                placeholder="Original price (for sales)"
                className="font-mono"
              />
            </div>

            {/* Cost Price */}
            <div className="space-y-2">
              <Label htmlFor="costPrice" className="flex items-center gap-2">
                <Calculator className="size-4" />
                Cost Price (EUR)
              </Label>
              <Input
                id="costPrice"
                type="number"
                step="0.01"
                min="0"
                value={costPriceDisplay}
                onChange={(e) => handleCostPriceChange(e.target.value)}
                disabled={!canEdit || isUpdating}
                placeholder="Your cost (for margin calculation)"
                className="font-mono"
              />
            </div>

            {/* Tax Rule */}
            <div className="space-y-2">
              <Label htmlFor="taxRule" className="flex items-center gap-2">
                <Receipt className="size-4" />
                Tax Rule
              </Label>
              {taxRulesLoading ? (
                <Skeleton className="h-10" />
              ) : (
                <Select
                  value={formData.taxRuleId || 'none'}
                  onValueChange={handleTaxRuleChange}
                  disabled={!canEdit || isUpdating}
                >
                  <SelectTrigger id="taxRule">
                    <SelectValue placeholder="Select tax rule" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No tax rule</SelectItem>
                    {taxRules?.map((rule) => (
                      <SelectItem key={rule.id} value={rule.id}>
                        {rule.name} ({rule.rate.toFixed(2)}%)
                        {rule.isDefault && ' (Default)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Tax Included Toggle (Prix TTC / Prix HT) */}
            <div className="flex items-center justify-between p-3 border border-border bg-secondary/10">
              <div className="space-y-0.5">
                <Label htmlFor="taxIncluded" className="font-mono text-xs uppercase tracking-wider">
                  {taxIncluded ? 'PRIX TTC' : 'PRIX HT'}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {taxIncluded ? 'Price includes tax' : 'Price excludes tax'}
                </p>
              </div>
              <Switch
                id="taxIncluded"
                checked={taxIncluded}
                onCheckedChange={setTaxIncluded}
                disabled={!formData.taxRuleId}
              />
            </div>
          </div>

          {/* Right Column: Calculated Values */}
          <div className="space-y-4 border-l border-border pl-6">
            <h4 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Calculated Values
            </h4>

            {/* Price Display with Compare-At Strikethrough */}
            <div className="p-3 bg-secondary/20 border border-border">
              <p className="text-xs text-muted-foreground uppercase">Selling Price</p>
              <div className="flex items-baseline gap-3">
                <p className="font-mono text-2xl font-bold">
                  {formatPrice(formData.priceInCents)}
                </p>
                {/* Strikethrough preview for compare-at price */}
                {formData.compareAtPriceInCents && formData.compareAtPriceInCents > formData.priceInCents && (
                  <span className="font-mono text-lg text-muted-foreground line-through">
                    {formatPrice(formData.compareAtPriceInCents)}
                  </span>
                )}
                {discountPercentage && (
                  <span className="text-sm font-bold bg-green-500 text-white px-2 py-0.5">
                    -{discountPercentage}%
                  </span>
                )}
              </div>
            </div>

            {/* Tax Information */}
            {taxAmount !== null && taxRate !== null && (
              <div className="p-3 bg-secondary/20 border border-border">
                <p className="text-xs text-muted-foreground uppercase">
                  {taxIncluded ? 'Tax Included (TTC)' : 'Tax to Add (HT)'}
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="font-mono text-lg font-semibold">
                    {formatPrice(taxAmount)}
                  </p>
                  <span className="text-sm text-muted-foreground">
                    ({taxRate.toFixed(2)}%)
                  </span>
                </div>
                {taxIncluded && netPrice !== null && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Price excl. tax (HT): {formatPrice(netPrice)}
                  </p>
                )}
                {!taxIncluded && grossPrice !== null && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Price incl. tax (TTC): {formatPrice(grossPrice)}
                  </p>
                )}
              </div>
            )}

            {/* Margin Information */}
            {margin && (
              <div className="p-3 bg-secondary/20 border border-border">
                <p className="text-xs text-muted-foreground uppercase">Profit Margin</p>
                <div className="flex items-baseline gap-2">
                  <p className="font-mono text-lg font-semibold">
                    {formatPrice(margin.amount)}
                  </p>
                  <span
                    className={`text-sm ${margin.percentage >= 20 ? 'text-green-500' : margin.percentage >= 10 ? 'text-yellow-500' : 'text-red-500'}`}
                  >
                    ({margin.percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
            )}

            {/* No calculations available */}
            {taxAmount === null && margin === null && (
              <div className="p-3 bg-secondary/10 border border-dashed border-border text-center">
                <p className="text-xs text-muted-foreground">
                  Set cost price and tax rule to see calculations
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function PricingSectionSkeleton() {
  return (
    <div className="border border-border">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-40 mt-1" />
        </div>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10" />
              </div>
            ))}
          </div>
          <div className="space-y-4 border-l border-border pl-6">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-24" />
            <Skeleton className="h-20" />
          </div>
        </div>
      </div>
    </div>
  )
}
