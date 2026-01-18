'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ProductsTable, DeleteProductDialog } from './_components'
import { usePermissions } from '@/lib/hooks'
import type { ProductResponse } from '@trafi/validators'

/**
 * Products List Page
 *
 * Displays paginated list of products with filtering and search.
 * Uses Digital Brutalism design pattern.
 *
 * @see Story 3.1 - Product Model and Basic CRUD
 */
export default function ProductsPage() {
  const { hasPermission } = usePermissions()
  const canCreate = hasPermission('products:create')

  // Dialog state
  const [deleteProduct, setDeleteProduct] = useState<ProductResponse | null>(null)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-2xl uppercase tracking-wider">
            PRODUITS
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gérez votre catalogue de produits.
          </p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/products/new">
              <Plus className="mr-2 size-4" />
              Nouveau produit
            </Link>
          </Button>
        )}
      </div>

      {/* Products Table */}
      <ProductsTable onDelete={(product) => setDeleteProduct(product)} />

      {/* Delete Confirmation Dialog */}
      <DeleteProductDialog
        product={deleteProduct}
        open={!!deleteProduct}
        onOpenChange={(open) => !open && setDeleteProduct(null)}
      />
    </div>
  )
}
