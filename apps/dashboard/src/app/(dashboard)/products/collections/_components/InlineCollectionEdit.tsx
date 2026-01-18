'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Check, X } from 'lucide-react'
import { useUpdateCollection } from '../_hooks'
import { cn } from '@/lib/utils'

interface InlineCollectionEditProps {
  collectionId: string
  initialValue: string
  field: 'name'
  className?: string
}

/**
 * Inline Collection Edit Component
 *
 * Allows inline editing of collection name directly in the UI.
 * Click to edit, Enter to save, Escape to cancel.
 *
 * @see Story 3.5 - Collections Management (AC10)
 */
export function InlineCollectionEdit({
  collectionId,
  initialValue,
  field,
  className,
}: InlineCollectionEditProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(initialValue)
  const inputRef = useRef<HTMLInputElement>(null)
  const { mutate: updateCollection, isPending } = useUpdateCollection()

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  // Sync with external value changes
  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  const handleSave = () => {
    const trimmedValue = value.trim()
    if (!trimmedValue || trimmedValue === initialValue) {
      handleCancel()
      return
    }

    updateCollection(
      { id: collectionId, [field]: trimmedValue },
      {
        onSuccess: () => setIsEditing(false),
        onError: () => setValue(initialValue),
      }
    )
  }

  const handleCancel = () => {
    setValue(initialValue)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  if (!isEditing) {
    return (
      <span
        onClick={() => setIsEditing(true)}
        className={cn(
          'cursor-pointer hover:bg-muted/50 px-1 -mx-1 rounded transition-colors',
          className
        )}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setIsEditing(true)
          }
        }}
        title="Click to edit"
      >
        {value}
      </span>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          // Small delay to allow button clicks
          setTimeout(() => {
            if (document.activeElement?.tagName !== 'BUTTON') {
              handleCancel()
            }
          }, 150)
        }}
        disabled={isPending}
        className={cn('h-8 text-base', className)}
      />
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8"
        onClick={handleSave}
        disabled={isPending}
      >
        <Check className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8"
        onClick={handleCancel}
        disabled={isPending}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
