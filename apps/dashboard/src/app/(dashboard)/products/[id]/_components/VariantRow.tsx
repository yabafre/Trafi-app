'use client'

/**
 * Variant Row Component
 *
 * Displays a single variant with inline editing support for price, SKU, and quantity.
 * Digital Brutalism v2 design pattern.
 *
 * @see Story 3.2 - Product Variants Management
 */

import { useState, useRef, useEffect } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'
import { VariantOptionChip } from './VariantOptionChip'
import { useUpdateVariant } from '../_hooks'
import type { VariantOption, VariantResponse } from '@trafi/validators'

interface VariantRowProps {
  variant: VariantResponse
  productId: string
  onDelete: (variant: VariantResponse) => void
  canEdit: boolean
  canDelete: boolean
}

/**
 * Inline Editable Cell
 */
function EditableCell({
  value,
  type,
  onSave,
  disabled,
  className = '',
}: {
  value: string | number
  type: 'text' | 'number' | 'price'
  onSave: (value: string | number) => void
  disabled?: boolean
  className?: string
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(String(value))
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = () => {
    setIsEditing(false)
    let newValue: string | number = editValue

    if (type === 'number') {
      newValue = parseInt(editValue, 10) || 0
    } else if (type === 'price') {
      // Convert from euros to cents
      const euros = parseFloat(editValue.replace(',', '.')) || 0
      newValue = Math.round(euros * 100)
    }

    if (newValue !== value) {
      onSave(newValue)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
      setEditValue(String(value))
    }
  }

  if (disabled) {
    return (
      <span className={`font-mono text-sm ${className}`}>
        {type === 'price' ? formatPrice(value as number) : value}
      </span>
    )
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type={type === 'number' || type === 'price' ? 'number' : 'text'}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={`h-8 w-full border border-accent bg-background px-2 font-mono text-sm focus:outline-none ${className}`}
        step={type === 'price' ? '0.01' : '1'}
        min={type === 'number' || type === 'price' ? '0' : undefined}
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => {
        if (type === 'price') {
          // Convert cents to euros for editing
          setEditValue(((value as number) / 100).toFixed(2))
        } else {
          setEditValue(String(value))
        }
        setIsEditing(true)
      }}
      className={`cursor-pointer font-mono text-sm hover:border-b hover:border-accent ${className}`}
    >
      {type === 'price' ? formatPrice(value as number) : value}
    </button>
  )
}

export function VariantRow({ variant, productId, onDelete, canEdit, canDelete }: VariantRowProps) {
  const { mutate: updateVariant, isPending } = useUpdateVariant({ productId })

  const options = variant.options as VariantOption[]

  const handleUpdatePrice = (value: string | number) => {
    updateVariant({
      id: variant.id,
      productId,
      priceInCents: value as number,
    })
  }

  const handleUpdateSku = (value: string | number) => {
    updateVariant({
      id: variant.id,
      productId,
      sku: value as string,
    })
  }

  const handleUpdateQuantity = (value: string | number) => {
    updateVariant({
      id: variant.id,
      productId,
      quantity: value as number,
    })
  }

  const isLowStock = variant.trackInventory && variant.quantity <= 5
  const isOutOfStock = variant.trackInventory && variant.quantity === 0

  return (
    <div
      className={`flex border-b border-border last:border-b-0 hover:bg-secondary/20 ${isPending ? 'opacity-50' : ''}`}
    >
      {/* Options */}
      <div className="flex-1 px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {options.map((opt, i) => (
            <VariantOptionChip key={i} option={opt} />
          ))}
        </div>
      </div>

      {/* SKU */}
      <div className="w-32 px-4 py-3">
        <EditableCell
          value={variant.sku || '-'}
          type="text"
          onSave={handleUpdateSku}
          disabled={!canEdit}
          className="text-muted-foreground"
        />
      </div>

      {/* Price */}
      <div className="w-28 px-4 py-3">
        <EditableCell
          value={variant.priceInCents}
          type="price"
          onSave={handleUpdatePrice}
          disabled={!canEdit}
        />
      </div>

      {/* Quantity */}
      <div className="w-24 px-4 py-3">
        <div className="flex items-center gap-2">
          <EditableCell
            value={variant.quantity}
            type="number"
            onSave={handleUpdateQuantity}
            disabled={!canEdit || !variant.trackInventory}
          />
          {isOutOfStock && (
            <span className="bg-destructive px-1.5 py-0.5 text-xs font-mono text-destructive-foreground">
              RUPTURE
            </span>
          )}
          {isLowStock && !isOutOfStock && (
            <span className="bg-amber-500 px-1.5 py-0.5 text-xs font-mono text-black">BAS</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="w-16 px-4 py-3 flex items-center justify-center">
        {canDelete && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onDelete(variant)}
            disabled={isPending}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
