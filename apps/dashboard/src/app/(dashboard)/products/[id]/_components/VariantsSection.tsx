'use client'

/**
 * Variants Section Component
 *
 * Main variants manager for the product detail page.
 * Displays variants table with inline editing, and provides actions for
 * creating, bulk generating, and deleting variants.
 * Digital Brutalism v2 design pattern.
 *
 * @see Story 3.2 - Product Variants Management
 */

import { useState } from 'react'
import { Plus, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useVariants } from '../_hooks'
import { usePermissions } from '@/lib/hooks'
import { VariantRow } from './VariantRow'
import { CreateVariantDialog } from './CreateVariantDialog'
import { BulkVariantGenerator } from './BulkVariantGenerator'
import { DeleteVariantDialog } from './DeleteVariantDialog'
import type { VariantResponse } from '@trafi/validators'

interface VariantsSectionProps {
  productId: string
}

export function VariantsSection({ productId }: VariantsSectionProps) {
  const { data: variants, isLoading, error } = useVariants({ productId })
  const { hasPermission } = usePermissions()

  const canEdit = hasPermission('products:update')
  const canDelete = hasPermission('products:update') // Deletion requires update permission

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showBulkGenerator, setShowBulkGenerator] = useState(false)
  const [variantToDelete, setVariantToDelete] = useState<VariantResponse | null>(null)

  if (isLoading) {
    return <VariantsSectionSkeleton />
  }

  if (error) {
    return (
      <div className="border border-destructive p-8 text-center">
        <p className="font-mono text-destructive text-sm">ERREUR: {error.message}</p>
      </div>
    )
  }

  const variantsList = variants ?? []
  const isLastVariant = variantsList.length <= 1

  return (
    <div className="border border-border">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-secondary/30">
        <div>
          <h3 className="font-mono text-sm uppercase tracking-wider">VARIANTES</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {variantsList.length} variante{variantsList.length > 1 ? 's' : ''}
          </p>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowBulkGenerator(true)}>
              <Layers className="mr-2 size-4" />
              Generer
            </Button>
            <Button size="sm" onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 size-4" />
              Ajouter
            </Button>
          </div>
        )}
      </div>

      {variantsList.length === 0 ? (
        <div className="p-8 text-center">
          <p className="font-mono text-muted-foreground text-sm">AUCUNE VARIANTE</p>
          {canEdit && (
            <div className="mt-4 flex justify-center gap-2">
              <Button variant="outline" onClick={() => setShowBulkGenerator(true)}>
                <Layers className="mr-2 size-4" />
                Generer des variantes
              </Button>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 size-4" />
                Ajouter une variante
              </Button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Table Header */}
          <div className="flex border-b border-border bg-secondary/20">
            <div className="flex-1 px-4 py-2">
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                OPTIONS
              </span>
            </div>
            <div className="w-32 px-4 py-2">
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                SKU
              </span>
            </div>
            <div className="w-28 px-4 py-2">
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                PRIX
              </span>
            </div>
            <div className="w-24 px-4 py-2">
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                STOCK
              </span>
            </div>
            <div className="w-16 px-4 py-2"></div>
          </div>

          {/* Table Body */}
          {variantsList.map((variant) => (
            <VariantRow
              key={variant.id}
              variant={variant}
              productId={productId}
              onDelete={setVariantToDelete}
              canEdit={canEdit}
              canDelete={canDelete}
            />
          ))}
        </>
      )}

      {/* Dialogs */}
      <CreateVariantDialog
        productId={productId}
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      <BulkVariantGenerator
        productId={productId}
        open={showBulkGenerator}
        onOpenChange={setShowBulkGenerator}
      />

      <DeleteVariantDialog
        variant={variantToDelete}
        productId={productId}
        open={!!variantToDelete}
        onOpenChange={(open) => !open && setVariantToDelete(null)}
        isLastVariant={isLastVariant}
      />
    </div>
  )
}

function VariantsSectionSkeleton() {
  return (
    <div className="border border-border">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16 mt-1" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
      <div className="space-y-0">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex border-b border-border last:border-b-0 px-4 py-3">
            <div className="flex-1">
              <Skeleton className="h-6 w-32" />
            </div>
            <div className="w-32">
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="w-28">
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="w-24">
              <Skeleton className="h-4 w-12" />
            </div>
            <div className="w-16">
              <Skeleton className="h-6 w-6" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
