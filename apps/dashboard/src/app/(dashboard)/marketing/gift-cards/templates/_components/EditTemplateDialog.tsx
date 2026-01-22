'use client'

import { useState, useEffect } from 'react'
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
import { useUpdateGiftCardTemplate } from '../../_hooks'
import { formatCurrency, parseEuroToCents, formatCentsToEuroInput } from '@/lib/utils'

interface TemplateItem {
  id: string
  name: string
  description: string | null
  denominations: number[]
  allowCustomAmount: boolean
  minAmountCents: number | null
  maxAmountCents: number | null
  validityDays: number | null
  isActive: boolean
}

interface EditTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: TemplateItem
}

/**
 * Dialog for editing an existing gift card template
 *
 * @see Story 3.10 - Gift Cards (AC1, AC6)
 */
export function EditTemplateDialog({ open, onOpenChange, template }: EditTemplateDialogProps) {
  const [name, setName] = useState(template.name)
  const [description, setDescription] = useState(template.description || '')
  const [denominations, setDenominations] = useState<number[]>(template.denominations)
  const [newDenomination, setNewDenomination] = useState('')
  const [allowCustomAmount, setAllowCustomAmount] = useState(template.allowCustomAmount)
  const [minAmountCents, setMinAmountCents] = useState(template.minAmountCents || 500)
  const [maxAmountCents, setMaxAmountCents] = useState(template.maxAmountCents || 50000)
  const [validityDays, setValidityDays] = useState<number | null>(template.validityDays)
  const [isActive, setIsActive] = useState(template.isActive)

  const updateMutation = useUpdateGiftCardTemplate()

  // Reset form when template changes
  useEffect(() => {
    setName(template.name)
    setDescription(template.description || '')
    setDenominations(template.denominations)
    setNewDenomination('')
    setAllowCustomAmount(template.allowCustomAmount)
    setMinAmountCents(template.minAmountCents || 500)
    setMaxAmountCents(template.maxAmountCents || 50000)
    setValidityDays(template.validityDays)
    setIsActive(template.isActive)
  }, [template])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || denominations.length === 0) return

    await updateMutation.mutateAsync({
      id: template.id,
      name: name.trim(),
      description: description.trim() || null,
      denominations,
      allowCustomAmount,
      minAmountCents: allowCustomAmount ? minAmountCents : null,
      maxAmountCents: allowCustomAmount ? maxAmountCents : null,
      validityDays: validityDays || null,
      isActive,
    })
    onOpenChange(false)
  }

  const handleClose = () => {
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
          <DialogTitle>Edit Template</DialogTitle>
          <DialogDescription>
            Update the gift card template settings.
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
              disabled={updateMutation.isPending || !name.trim() || denominations.length === 0}
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
