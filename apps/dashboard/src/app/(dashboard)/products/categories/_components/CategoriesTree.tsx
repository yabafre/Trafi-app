'use client'

import { useState, useCallback } from 'react'
import { FolderTree, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCategoryTree, useReorderCategory, useUpdateCategory } from '../_hooks'
import { CategoryTreeItem } from './CategoryTreeItem'
import { CategoryFormDialog } from './CategoryFormDialog'
import { DeleteCategoryDialog } from './DeleteCategoryDialog'
import type { CategoryTreeNode } from '@trafi/validators'

/**
 * Categories Tree Component
 *
 * Main component for displaying and managing the category hierarchy.
 * Features:
 * - Nested tree structure with expand/collapse
 * - Drag-and-drop reordering (native HTML5)
 * - Add/Edit/Delete actions
 * - Empty state
 *
 * Digital Brutalism design pattern.
 *
 * @see Story 3.4 - Categories Management
 */
export function CategoriesTree() {
  const { data: categories, isLoading, error } = useCategoryTree()
  const { mutate: reorderCategory, isPending: isReordering } = useReorderCategory()
  const { mutate: updateCategory, isPending: isUpdating } = useUpdateCategory()

  // Dialog states
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<CategoryTreeNode | null>(null)
  const [parentIdForNew, setParentIdForNew] = useState<string | null>(null)

  // Drag-and-drop states
  const [draggingCategory, setDraggingCategory] = useState<CategoryTreeNode | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  const handleEdit = useCallback((category: CategoryTreeNode) => {
    setSelectedCategory(category)
    setParentIdForNew(null)
    setFormDialogOpen(true)
  }, [])

  const handleDelete = useCallback((category: CategoryTreeNode) => {
    setSelectedCategory(category)
    setDeleteDialogOpen(true)
  }, [])

  const handleAddChild = useCallback((parentId: string) => {
    setSelectedCategory(null)
    setParentIdForNew(parentId)
    setFormDialogOpen(true)
  }, [])

  const handleAddRoot = useCallback(() => {
    setSelectedCategory(null)
    setParentIdForNew(null)
    setFormDialogOpen(true)
  }, [])

  const handleInlineEdit = useCallback((categoryId: string, newName: string) => {
    updateCategory({ id: categoryId, name: newName })
  }, [updateCategory])

  const handleDragStart = useCallback((e: React.DragEvent, category: CategoryTreeNode) => {
    setDraggingCategory(category)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', category.id)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, targetCategory: CategoryTreeNode) => {
    e.preventDefault()
    setDragOverId(null)

    if (!draggingCategory || draggingCategory.id === targetCategory.id) {
      setDraggingCategory(null)
      return
    }

    // Prevent dropping a parent onto its own descendant
    const isDescendant = (parent: CategoryTreeNode, potentialChild: CategoryTreeNode): boolean => {
      for (const child of parent.children || []) {
        if (child.id === potentialChild.id || isDescendant(child, potentialChild)) {
          return true
        }
      }
      return false
    }

    if (isDescendant(draggingCategory, targetCategory)) {
      setDraggingCategory(null)
      return
    }

    // Calculate new position (after target)
    const newParentId = targetCategory.parentId
    const newPosition = targetCategory.position + 1

    // Check if moving would exceed max depth
    const draggingMaxChildDepth = getMaxChildDepth(draggingCategory)
    const targetParentDepth = newParentId ? getDepthById(categories || [], newParentId) : -1
    if (targetParentDepth + 1 + draggingMaxChildDepth > 2) {
      setDraggingCategory(null)
      return
    }

    reorderCategory({
      categoryId: draggingCategory.id,
      parentId: newParentId,
      position: newPosition,
    })

    setDraggingCategory(null)
  }, [draggingCategory, categories, reorderCategory])

  const handleDragEnter = useCallback((categoryId: string) => {
    setDragOverId(categoryId)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOverId(null)
  }, [])

  if (isLoading) {
    return <CategoriesTreeSkeleton />
  }

  if (error) {
    return (
      <div className="p-8 text-center text-destructive">
        Failed to load categories. Please try again.
      </div>
    )
  }

  const isEmpty = !categories || categories.length === 0

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-100">Categories</h2>
        <Button onClick={handleAddRoot} size="sm">
          <Plus className="size-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Tree or Empty State */}
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-zinc-700 rounded-lg">
          <FolderTree className="size-12 text-zinc-500 mb-4" />
          <h3 className="text-lg font-medium text-zinc-300 mb-2">No categories yet</h3>
          <p className="text-sm text-zinc-500 mb-4 text-center">
            Create your first category to organize your products.
          </p>
          <Button onClick={handleAddRoot}>
            <Plus className="size-4 mr-2" />
            Create your first category
          </Button>
        </div>
      ) : (
        <div
          className="p-2 rounded-lg bg-zinc-900/50 border border-zinc-800"
          onDragLeave={handleDragLeave}
        >
          {categories.map((category) => (
            <div
              key={category.id}
              onDragEnter={() => handleDragEnter(category.id)}
            >
              <CategoryTreeItem
                category={category}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAddChild={handleAddChild}
                onInlineEdit={handleInlineEdit}
                isInlineEditPending={isUpdating}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                isDragging={draggingCategory?.id === category.id}
                dragOverId={dragOverId}
              />
            </div>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <CategoryFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        category={selectedCategory}
        parentId={parentIdForNew}
      />

      {/* Delete Dialog */}
      <DeleteCategoryDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        category={selectedCategory}
      />
    </div>
  )
}

/**
 * Skeleton for loading state
 */
function CategoriesTreeSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-6 w-32 bg-zinc-800 rounded animate-pulse" />
        <div className="h-9 w-32 bg-zinc-800 rounded animate-pulse" />
      </div>
      <div className="p-2 rounded-lg bg-zinc-900/50 border border-zinc-800 space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2 px-3 py-2">
            <div className="h-4 w-4 bg-zinc-800 rounded animate-pulse" />
            <div className="h-4 w-4 bg-zinc-800 rounded animate-pulse" />
            <div className="h-4 flex-1 bg-zinc-800 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Get the maximum depth of children in a subtree
 */
function getMaxChildDepth(category: CategoryTreeNode): number {
  if (!category.children || category.children.length === 0) {
    return 0
  }
  return 1 + Math.max(...category.children.map(getMaxChildDepth))
}

/**
 * Get the depth of a category by ID
 */
function getDepthById(categories: CategoryTreeNode[], id: string): number {
  for (const cat of categories) {
    if (cat.id === id) {
      return cat.depth
    }
    const childDepth = getDepthById(cat.children || [], id)
    if (childDepth >= 0) {
      return childDepth
    }
  }
  return -1
}
