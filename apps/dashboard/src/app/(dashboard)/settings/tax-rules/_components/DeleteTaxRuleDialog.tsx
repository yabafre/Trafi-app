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
import { useDeleteTaxRule } from '../_hooks'
import type { TaxRuleResponse } from '@trafi/types'

interface DeleteTaxRuleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taxRule: TaxRuleResponse | null
}

/**
 * Delete Tax Rule Confirmation Dialog
 *
 * Confirms deletion of a tax rule.
 * Cannot delete the default tax rule.
 *
 * @see Story 3.6 - Product Pricing and Tax Rules
 */
export function DeleteTaxRuleDialog({
  open,
  onOpenChange,
  taxRule,
}: DeleteTaxRuleDialogProps) {
  const { mutate: deleteTaxRule, isPending } = useDeleteTaxRule()

  const handleDelete = () => {
    if (!taxRule) return
    deleteTaxRule(
      { id: taxRule.id },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  if (!taxRule) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-destructive" />
            Delete Tax Rule
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2">
              <p>
                Are you sure you want to delete{' '}
                <span className="font-mono font-semibold">{taxRule.name}</span>?
              </p>
              <p className="text-zinc-400">
                Products using this tax rule will need to be reassigned to a different
                tax rule. This action cannot be undone.
              </p>
              {taxRule.isDefault && (
                <p className="text-destructive font-medium">
                  Warning: This is the default tax rule. You should set another rule as
                  default before deleting.
                </p>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
