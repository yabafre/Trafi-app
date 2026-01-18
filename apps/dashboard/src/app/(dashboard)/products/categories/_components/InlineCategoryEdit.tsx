'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface InlineCategoryEditProps {
  value: string
  onSave: (newValue: string) => void
  onCancel: () => void
  isLoading?: boolean
  className?: string
}

/**
 * Inline Category Edit Component
 *
 * Inline text input for quick category name editing.
 * Enter to save, Escape to cancel.
 * Auto-focuses on mount.
 *
 * @see Story 3.4 - Categories Management (AC10)
 */
export function InlineCategoryEdit({
  value,
  onSave,
  onCancel,
  isLoading = false,
  className,
}: InlineCategoryEditProps) {
  const [editValue, setEditValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus and select all text on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        const trimmed = editValue.trim()
        if (trimmed && trimmed !== value) {
          onSave(trimmed)
        } else {
          onCancel()
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onCancel()
      }
    },
    [editValue, value, onSave, onCancel]
  )

  const handleBlur = useCallback(() => {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== value) {
      onSave(trimmed)
    } else {
      onCancel()
    }
  }, [editValue, value, onSave, onCancel])

  return (
    <input
      ref={inputRef}
      type="text"
      value={editValue}
      onChange={(e) => setEditValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      disabled={isLoading}
      className={cn(
        'flex-1 bg-transparent border-b-2 border-[#CCFF00] outline-none',
        'font-medium text-zinc-100 px-1 py-0.5',
        'disabled:opacity-50',
        className
      )}
      aria-label="Edit category name"
    />
  )
}
