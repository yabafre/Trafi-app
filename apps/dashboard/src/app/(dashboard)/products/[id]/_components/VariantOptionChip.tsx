'use client'

/**
 * Variant Option Chip Component
 *
 * Displays a variant option (name:value) as a styled chip.
 * Digital Brutalism v2 design pattern.
 *
 * @see Story 3.2 - Product Variants Management
 */

import type { VariantOption } from '@trafi/validators'

interface VariantOptionChipProps {
  option: VariantOption
  size?: 'sm' | 'md'
}

export function VariantOptionChip({ option, size = 'sm' }: VariantOptionChipProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  }

  return (
    <span
      className={`inline-block bg-[#333333] text-white font-mono border border-[#444444] ${sizeClasses[size]}`}
    >
      {option.name}: {option.value}
    </span>
  )
}
