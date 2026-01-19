'use client'

/**
 * Edit Variant Inventory Dialog
 *
 * Dialog wrapper for editing inventory of a variant.
 * Includes stock adjustments, settings, and history.
 * Digital Brutalism v2 design pattern.
 *
 * @see Story 3.7 - Inventory Tracking
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { InventorySection } from './InventorySection'
import type { VariantResponse } from '@trafi/validators'

interface EditVariantInventoryDialogProps {
  variant: VariantResponse | null
  productId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  canEdit: boolean
}

export function EditVariantInventoryDialog({
  variant,
  productId,
  open,
  onOpenChange,
  canEdit,
}: EditVariantInventoryDialogProps) {
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
            Inventory Management
          </DialogTitle>
          <DialogDescription>{variantName}</DialogDescription>
        </DialogHeader>

        <InventorySection variant={variant} productId={productId} canEdit={canEdit} />
      </DialogContent>
    </Dialog>
  )
}
