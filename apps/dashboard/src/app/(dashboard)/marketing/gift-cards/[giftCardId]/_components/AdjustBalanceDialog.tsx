'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAdjustGiftCardBalance } from '../../_hooks'
import { formatCurrency } from '@/lib/utils'

interface AdjustBalanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  giftCardId: string
  currentBalanceCents: number
  currencyCode: string
}

/**
 * Dialog for adjusting gift card balance
 *
 * Supports adding or subtracting from the balance with a required reason.
 *
 * @see Story 3.10 - Gift Cards (AC4)
 */
export function AdjustBalanceDialog({
  open,
  onOpenChange,
  giftCardId,
  currentBalanceCents,
  currencyCode,
}: AdjustBalanceDialogProps) {
  const [adjustType, setAdjustType] = useState<'add' | 'subtract'>('add')
  const [amountCents, setAmountCents] = useState(0)
  const [reason, setReason] = useState('')

  const adjustMutation = useAdjustGiftCardBalance()

  const newBalance = adjustType === 'add'
    ? currentBalanceCents + amountCents
    : Math.max(0, currentBalanceCents - amountCents)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim() || amountCents <= 0) return

    const adjustedAmount = adjustType === 'add' ? amountCents : -amountCents
    await adjustMutation.mutateAsync({
      giftCardId,
      amountCents: adjustedAmount,
      reason: reason.trim(),
    })
    resetForm()
    onOpenChange(false)
  }

  const resetForm = () => {
    setAdjustType('add')
    setAmountCents(0)
    setReason('')
  }

  const handleClose = () => {
    resetForm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adjust Balance</DialogTitle>
          <DialogDescription>
            Add or subtract from the gift card balance.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Balance */}
          <div className="p-3 bg-muted rounded-none">
            <div className="text-sm text-muted-foreground">Current Balance</div>
            <div className="text-xl font-mono font-bold">
              {formatCurrency(currentBalanceCents, currencyCode)}
            </div>
          </div>

          {/* Adjustment Type */}
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={adjustType} onValueChange={(v) => setAdjustType(v as 'add' | 'subtract')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="add">Add to Balance</SelectItem>
                <SelectItem value="subtract">Subtract from Balance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label>Amount *</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="10.00"
              value={amountCents ? (amountCents / 100).toFixed(2) : ''}
              onChange={(e) => {
                const cents = Math.round(parseFloat(e.target.value || '0') * 100)
                setAmountCents(cents)
              }}
              required
            />
          </div>

          {/* New Balance Preview */}
          <div className="p-3 bg-muted rounded-none">
            <div className="text-sm text-muted-foreground">New Balance</div>
            <div className="text-xl font-mono font-bold">
              {formatCurrency(newBalance, currencyCode)}
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label>Reason *</Label>
            <Textarea
              placeholder="Reason for adjustment..."
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              This will be recorded in the transaction history.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={adjustMutation.isPending || !reason.trim() || amountCents <= 0}
            >
              {adjustMutation.isPending ? 'Adjusting...' : 'Adjust Balance'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
