'use client'

/**
 * Edit Variant Pricing Dialog
 *
 * Dialog wrapper for editing detailed pricing of a variant.
 * Includes price, compare-at price, cost price, tax rule, and calculations.
 * Digital Brutalism v2 design pattern.
 *
 * @see Story 3.6 - Product Pricing and Tax Rules
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { PricingSection } from './PricingSection'
import type { VariantResponse } from '@trafi/validators'

interface EditVariantPricingDialogProps {
  variant: VariantResponse | null
  productId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  canEdit: boolean
}

export function EditVariantPricingDialog({
  variant,
  productId,
  open,
  onOpenChange,
  canEdit,
}: EditVariantPricingDialogProps) {
  if (!variant) return null

  // Get variant display name from options
  const variantName = variant.options
    ? (variant.options as Array<{ name: string; value: string }>)
        .map((opt) => `${opt.name}: ${opt.value}`)
        .join(', ')
    : variant.sku || 'Default Variant'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm uppercase tracking-wider">
            Edit Pricing
          </DialogTitle>
          <DialogDescription>
            {variantName}
          </DialogDescription>
        </DialogHeader>

        <PricingSection
          variant={variant}
          productId={productId}
          canEdit={canEdit}
        />
      </DialogContent>
    </Dialog>
  )
}
