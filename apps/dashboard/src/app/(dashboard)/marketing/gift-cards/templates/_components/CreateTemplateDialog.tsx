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
import { Switch } from '@/components/ui/switch'
import { X } from 'lucide-react'
import { useCreateGiftCardTemplate } from '../../_hooks'
import { formatCurrency, parseEuroToCents, formatCentsToEuroInput } from '@/lib/utils'

interface CreateTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Dialog for creating a new gift card template
 *
 * @see Story 3.10 - Gift Cards (AC1, AC6)
 */
export function CreateTemplateDialog({ open, onOpenChange }: CreateTemplateDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [denominations, setDenominations] = useState<number[]>([2500, 5000, 10000])
  const [newDenomination, setNewDenomination] = useState('')
  const [allowCustomAmount, setAllowCustomAmount] = useState(false)
  const [minAmountCents, setMinAmountCents] = useState(500)
  const [maxAmountCents, setMaxAmountCents] = useState(50000)
  const [validityDays, setValidityDays] = useState<number | null>(365)
  const [isActive, setIsActive] = useState(true)

  const createMutation = useCreateGiftCardTemplate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || denominations.length === 0) return

    await createMutation.mutateAsync({
      name: name.trim(),
      description: description.trim() || undefined,
      denominations,
      allowCustomAmount,
      minAmountCents: allowCustomAmount ? minAmountCents : undefined,
      maxAmountCents: allowCustomAmount ? maxAmountCents : undefined,
      validityDays: validityDays || undefined,
      isActive,
    })
    resetForm()
    onOpenChange(false)
  }

  const resetForm = () => {
    setName('')
    setDescription('')
    setDenominations([2500, 5000, 10000])
    setNewDenomination('')
    setAllowCustomAmount(false)
    setMinAmountCents(500)
    setMaxAmountCents(50000)
    setValidityDays(365)
    setIsActive(true)
  }

  const handleClose = () => {
    resetForm()
    onOpenChange(false)
  }

  const addDenomination = () => {
    const cents = parseEuroToCents(newDenomination)
    if (cents > 0 && !denominations.includes(cents)) {
      setDenominations([...denominations, cents].sort((a, b) => a - b))
      setNewDenomination('')
    }
  }

  const removeDenomination = (amount: number) => {
    setDenominations(denominations.filter((d) => d !== amount))
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Template</DialogTitle>
          <DialogDescription>
            Define a new gift card template with pre-configured settings.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input
              placeholder="Birthday Gift Card"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description (Optional)</Label>
            <Textarea
              placeholder="A perfect gift for any occasion..."
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Denominations */}
          <div className="space-y-2">
            <Label>Denominations *</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {denominations.map((amount) => (
                <div
                  key={amount}
                  className="flex items-center gap-1 bg-muted px-2 py-1 rounded-none"
                >
                  <span className="font-mono text-sm">{formatCurrency(amount, 'EUR')}</span>
                  <button
                    type="button"
                    onClick={() => removeDenomination(amount)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.01"
                placeholder="Add amount..."
                value={newDenomination}
                onChange={(e) => setNewDenomination(e.target.value)}
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={addDenomination}>
                Add
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Pre-defined amounts customers can choose from.
            </p>
          </div>

          {/* Allow Custom Amount */}
          <div className="flex items-center justify-between rounded-md border p-4">
            <div className="space-y-0.5">
              <Label>Allow Custom Amount</Label>
              <p className="text-xs text-muted-foreground">
                Let customers enter their own amount.
              </p>
            </div>
            <Switch checked={allowCustomAmount} onCheckedChange={setAllowCustomAmount} />
          </div>

          {/* Min/Max Amount (if custom allowed) */}
          {allowCustomAmount && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formatCentsToEuroInput(minAmountCents)}
                  onChange={(e) => setMinAmountCents(parseEuroToCents(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formatCentsToEuroInput(maxAmountCents)}
                  onChange={(e) => setMaxAmountCents(parseEuroToCents(e.target.value))}
                />
              </div>
            </div>
          )}

          {/* Validity Days */}
          <div className="space-y-2">
            <Label>Validity Period (days)</Label>
            <Input
              type="number"
              placeholder="365"
              value={validityDays || ''}
              onChange={(e) => {
                const value = e.target.value
                setValidityDays(value ? parseInt(value, 10) : null)
              }}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty for no expiration.
            </p>
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between rounded-md border p-4">
            <div className="space-y-0.5">
              <Label>Active</Label>
              <p className="text-xs text-muted-foreground">
                Inactive templates cannot be used to issue new cards.
              </p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || !name.trim() || denominations.length === 0}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Template'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
