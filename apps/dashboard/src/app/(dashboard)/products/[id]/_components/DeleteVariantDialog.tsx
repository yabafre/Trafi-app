'use client'

/**
 * Delete Variant Confirmation Dialog
 *
 * Confirms variant deletion with warning.
 *
 * @see Story 3.2 - Product Variants Management
 */

import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useDeleteVariant } from '../_hooks'
import { VariantOptionChip } from './VariantOptionChip'
import type { VariantOption } from '@trafi/validators'

interface Variant {
  id: string
  sku: string | null
  options: unknown
}

interface DeleteVariantDialogProps {
  variant: Variant | null
  productId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  isLastVariant?: boolean
}

export function DeleteVariantDialog({
  variant,
  productId,
  open,
  onOpenChange,
  isLastVariant = false,
}: DeleteVariantDialogProps) {
  const { mutate, isPending } = useDeleteVariant({
    productId,
    onSuccess: () => {
      onOpenChange(false)
    },
  })

  const handleDelete = () => {
    if (!variant) return
    mutate({ id: variant.id, productId })
  }

  if (!variant) return null

  const options = variant.options as VariantOption[]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-destructive" />
            Supprimer la variante
          </DialogTitle>
          <DialogDescription>
            {isLastVariant ? (
              <span className="text-destructive">
                Impossible de supprimer la derniere variante. Un produit doit avoir au moins une
                variante.
              </span>
            ) : (
              <>
                Etes-vous sur de vouloir supprimer cette variante ?
                <span className="mt-2 flex flex-wrap gap-1">
                  {options.map((opt, i) => (
                    <VariantOptionChip key={i} option={opt} />
                  ))}
                </span>
                {variant.sku && (
                  <span className="mt-1 block font-mono text-xs">SKU: {variant.sku}</span>
                )}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isPending}>
            {isLastVariant ? 'Fermer' : 'Annuler'}
          </Button>
          {!isLastVariant && (
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? 'Suppression...' : 'Supprimer'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
