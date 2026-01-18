'use client'

/**
 * Create Variant Dialog
 *
 * Modal for creating a single variant with options.
 * Digital Brutalism v2 design pattern.
 *
 * @see Story 3.2 - Product Variants Management
 */

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCreateVariant } from '../_hooks'
import type { VariantOption } from '@trafi/validators'

interface CreateVariantDialogProps {
  productId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface OptionInput {
  name: string
  value: string
}

export function CreateVariantDialog({ productId, open, onOpenChange }: CreateVariantDialogProps) {
  const [options, setOptions] = useState<OptionInput[]>([{ name: '', value: '' }])
  const [sku, setSku] = useState('')
  const [priceEuros, setPriceEuros] = useState('')
  const [quantity, setQuantity] = useState('0')
  const [trackInventory, setTrackInventory] = useState(true)

  const { mutate, isPending } = useCreateVariant({
    productId,
    onSuccess: () => {
      resetForm()
      onOpenChange(false)
    },
  })

  const resetForm = () => {
    setOptions([{ name: '', value: '' }])
    setSku('')
    setPriceEuros('')
    setQuantity('0')
    setTrackInventory(true)
  }

  const addOption = () => {
    if (options.length < 3) {
      setOptions([...options, { name: '', value: '' }])
    }
  }

  const removeOption = (index: number) => {
    if (options.length > 1) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const updateOption = (index: number, field: 'name' | 'value', value: string) => {
    const newOptions = [...options]
    newOptions[index][field] = value
    setOptions(newOptions)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const validOptions: VariantOption[] = options
      .filter((opt) => opt.name.trim() && opt.value.trim())
      .map((opt) => ({ name: opt.name.trim(), value: opt.value.trim() }))

    if (validOptions.length === 0) {
      return
    }

    const priceInCents = Math.round(parseFloat(priceEuros.replace(',', '.')) * 100)

    if (isNaN(priceInCents) || priceInCents <= 0) {
      return
    }

    mutate({
      productId,
      options: validOptions,
      priceInCents,
      sku: sku.trim() || undefined,
      quantity: parseInt(quantity, 10) || 0,
      trackInventory,
    })
  }

  const isValid =
    options.some((opt) => opt.name.trim() && opt.value.trim()) &&
    priceEuros &&
    parseFloat(priceEuros.replace(',', '.')) > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter une variante</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Options */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-mono text-xs uppercase">Options *</Label>
              {options.length < 3 && (
                <Button type="button" variant="ghost" size="sm" onClick={addOption}>
                  <Plus className="mr-1 size-3" />
                  Ajouter
                </Button>
              )}
            </div>

            {options.map((option, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="Nom (ex: Taille)"
                  value={option.name}
                  onChange={(e) => updateOption(index, 'name', e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Valeur (ex: M)"
                  value={option.value}
                  onChange={(e) => updateOption(index, 'value', e.target.value)}
                  className="flex-1"
                />
                {options.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOption(index)}
                  >
                    <X className="size-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Price */}
          <div className="space-y-1">
            <Label htmlFor="price" className="font-mono text-xs uppercase">
              Prix (EUR) *
            </Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={priceEuros}
              onChange={(e) => setPriceEuros(e.target.value)}
            />
          </div>

          {/* SKU */}
          <div className="space-y-1">
            <Label htmlFor="sku" className="font-mono text-xs uppercase">
              SKU (optionnel)
            </Label>
            <Input
              id="sku"
              placeholder="Auto-genere si vide"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Inventory */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="trackInventory"
                checked={trackInventory}
                onChange={(e) => setTrackInventory(e.target.checked)}
                className="size-4"
              />
              <Label htmlFor="trackInventory" className="font-mono text-xs">
                Suivre le stock
              </Label>
            </div>

            {trackInventory && (
              <div className="space-y-1">
                <Label htmlFor="quantity" className="font-mono text-xs uppercase">
                  Quantite
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
            )}
          </div>
        </form>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => {
              resetForm()
              onOpenChange(false)
            }}
            disabled={isPending}
          >
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isPending}>
            {isPending ? 'Creation...' : 'Creer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
