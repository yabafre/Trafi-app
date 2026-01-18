'use client'

import { useState, useCallback } from 'react'
import { ChevronRight, ChevronDown, GripVertical, Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { CategoryTreeNode } from '@trafi/validators'
import { InlineCategoryEdit } from './InlineCategoryEdit'

interface CategoryTreeItemProps {
  category: CategoryTreeNode
  onEdit: (category: CategoryTreeNode) => void
  onDelete: (category: CategoryTreeNode) => void
  onAddChild: (parentId: string) => void
  onInlineEdit?: (categoryId: string, newName: string) => void
  isInlineEditPending?: boolean
  onDragStart: (e: React.DragEvent, category: CategoryTreeNode) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, targetCategory: CategoryTreeNode) => void
  isDragging: boolean
  dragOverId: string | null
}

/**
 * Category Tree Item Component
 *
 * Renders a single category in the tree with:
 * - Expand/collapse for children
 * - Drag handle for reordering
 * - Product count badge
 * - Edit/delete actions menu
 * - Add child button
 * - Double-click for inline name editing (AC10)
 *
 * Digital Brutalism design pattern.
 *
 * @see Story 3.4 - Categories Management
 */
export function CategoryTreeItem({
  category,
  onEdit,
  onDelete,
  onAddChild,
  onInlineEdit,
  isInlineEditPending = false,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging,
  dragOverId,
}: CategoryTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const hasChildren = category.children && category.children.length > 0
  const indent = category.depth * 24

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onInlineEdit) {
      setIsEditing(true)
    }
  }, [onInlineEdit])

  const handleInlineSave = useCallback((newName: string) => {
    if (onInlineEdit && newName !== category.name) {
      onInlineEdit(category.id, newName)
    }
    setIsEditing(false)
  }, [onInlineEdit, category.id, category.name])

  const handleInlineCancel = useCallback(() => {
    setIsEditing(false)
  }, [])

  return (
    <div className="select-none">
      <div
        draggable={!isEditing}
        onDragStart={(e) => !isEditing && onDragStart(e, category)}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, category)}
        className={cn(
          'group flex items-center gap-2 px-3 py-2 rounded-md transition-colors',
          'hover:bg-zinc-800',
          isDragging && 'opacity-50',
          dragOverId === category.id && 'bg-zinc-800 ring-2 ring-[#CCFF00]',
          isEditing && 'bg-zinc-800',
        )}
        style={{ marginLeft: `${indent}px` }}
      >
        {/* Drag handle */}
        <div className={cn(
          'cursor-grab opacity-0 group-hover:opacity-100 transition-opacity',
          isEditing && 'invisible'
        )}>
          <GripVertical className="size-4 text-zinc-500" />
        </div>

        {/* Expand/collapse button */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'p-0.5 rounded hover:bg-zinc-700 transition-colors',
            !hasChildren && 'invisible',
          )}
        >
          {isExpanded ? (
            <ChevronDown className="size-4 text-zinc-400" />
          ) : (
            <ChevronRight className="size-4 text-zinc-400" />
          )}
        </button>

        {/* Category name - inline editable on double-click */}
        {isEditing ? (
          <InlineCategoryEdit
            value={category.name}
            onSave={handleInlineSave}
            onCancel={handleInlineCancel}
            isLoading={isInlineEditPending}
          />
        ) : (
          <span
            className="flex-1 font-medium text-zinc-100 truncate cursor-text"
            onDoubleClick={handleDoubleClick}
            title="Double-click to edit"
          >
            {category.name}
          </span>
        )}

        {/* Product count badge */}
        {!isEditing && category.productCount !== undefined && category.productCount > 0 && (
          <span className="px-1.5 py-0.5 text-xs font-mono bg-zinc-700 text-zinc-300 rounded">
            {category.productCount}
          </span>
        )}

        {/* Add child button */}
        {!isEditing && category.depth < 2 && (
          <Button
            variant="ghost"
            size="icon"
            className="size-7 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onAddChild(category.id)}
          >
            <Plus className="size-4" />
          </Button>
        )}

        {/* Actions menu */}
        {!isEditing && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(category)}>
                <Pencil className="size-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(category)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="size-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Children (recursive) */}
      {hasChildren && isExpanded && (
        <div>
          {category.children.map((child) => (
            <CategoryTreeItem
              key={child.id}
              category={child}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              onInlineEdit={onInlineEdit}
              isInlineEditPending={isInlineEditPending}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              isDragging={isDragging}
              dragOverId={dragOverId}
            />
          ))}
        </div>
      )}
    </div>
  )
}
