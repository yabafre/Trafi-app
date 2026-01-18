'use client'

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
import { useDeleteProduct } from '../_hooks'
import type { ProductResponse } from '@trafi/validators'

interface DeleteProductDialogProps {
  product: ProductResponse | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Delete Product Confirmation Dialog
 *
 * Confirms product deletion with warning.
 *
 * @see Story 3.1 - Product Model and Basic CRUD
 */
export function DeleteProductDialog({
  product,
  open,
  onOpenChange,
}: DeleteProductDialogProps) {
  const { mutate, isPending } = useDeleteProduct()

  const handleDelete = () => {
    if (!product) return
    mutate({ id: product.id })
    onOpenChange(false)
  }

  if (!product) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-destructive" />
            Supprimer le produit
          </DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer{' '}
            <span className="font-mono font-semibold">{product.name}</span> ?
            Cette action est irréversible.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? 'Suppression...' : 'Supprimer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
