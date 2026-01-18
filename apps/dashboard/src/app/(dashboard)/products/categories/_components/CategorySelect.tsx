'use client'

import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCategoryList } from '../_hooks'

interface CategorySelectProps {
  /** Currently selected category ID (single selection) */
  value: string | null
  /** Callback when selection changes */
  onChange: (value: string | null) => void
  /** Placeholder text */
  placeholder?: string
  /** Whether the select is disabled */
  disabled?: boolean
  /** Whether to show "None" option */
  allowNone?: boolean
}

/**
 * Category Select Component
 *
 * Simple select for choosing a single category.
 * Used in product forms for category assignment.
 *
 * @see Story 3.4 - Categories Management
 */
export function CategorySelect({
  value,
  onChange,
  placeholder = 'Select category...',
  disabled = false,
  allowNone = true,
}: CategorySelectProps) {
  const { data: categories, isLoading } = useCategoryList()

  return (
    <Select
      value={value || 'none'}
      onValueChange={(val) => onChange(val === 'none' ? null : val)}
      disabled={disabled || isLoading}
    >
      <SelectTrigger className={cn(!value && 'text-muted-foreground')}>
        <SelectValue placeholder={isLoading ? 'Loading...' : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowNone && (
          <SelectItem value="none">None</SelectItem>
        )}
        {(categories || []).map((category) => (
          <SelectItem key={category.id} value={category.id}>
            {'\u00A0'.repeat(category.depth * 2)}
            {category.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

interface CategoryMultiSelectProps {
  /** Currently selected category IDs */
  value: string[]
  /** Callback when selection changes */
  onChange: (value: string[]) => void
  /** Placeholder text */
  placeholder?: string
  /** Whether the select is disabled */
  disabled?: boolean
}

/**
 * Category Multi-Select Component
 *
 * Checkbox list for selecting multiple categories.
 * Used in product forms for multi-category assignment.
 *
 * @see Story 3.4 - Categories Management
 */
export function CategoryMultiSelect({
  value,
  onChange,
  placeholder = 'Select categories...',
  disabled = false,
}: CategoryMultiSelectProps) {
  const { data: categories, isLoading } = useCategoryList()

  const toggleCategory = (categoryId: string) => {
    if (value.includes(categoryId)) {
      onChange(value.filter((id) => id !== categoryId))
    } else {
      onChange([...value, categoryId])
    }
  }

  const selectedNames = (categories || [])
    .filter((cat) => value.includes(cat.id))
    .map((cat) => cat.name)
    .join(', ')

  return (
    <div className="space-y-2">
      <div
        className={cn(
          'flex min-h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <span className={cn(!selectedNames && 'text-muted-foreground')}>
          {isLoading
            ? 'Loading...'
            : selectedNames || placeholder}
        </span>
      </div>

      {!disabled && !isLoading && (
        <div className="border rounded-md p-2 max-h-48 overflow-y-auto space-y-1">
          {(categories || []).map((category) => (
            <label
              key={category.id}
              className="flex items-center gap-2 px-2 py-1 hover:bg-zinc-800 rounded cursor-pointer"
            >
              <input
                type="checkbox"
                checked={value.includes(category.id)}
                onChange={() => toggleCategory(category.id)}
                className="rounded border-zinc-600"
              />
              <span style={{ paddingLeft: `${category.depth * 12}px` }}>
                {category.name}
              </span>
            </label>
          ))}
          {(!categories || categories.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-2">
              No categories available
            </p>
          )}
        </div>
      )}
    </div>
  )
}
