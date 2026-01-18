'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatPrice, formatDate } from '@/lib/utils'
import { ProductStatusBadge, DeleteProductDialog } from '../_components'
import { VariantsSection, MediaSection, CategoriesSection } from './_components'
import { useProduct } from '../_hooks'
import { usePermissions } from '@/lib/hooks'

interface ProductDetailPageProps {
  params: Promise<{ id: string }>
}

/**
 * Product Detail Page
 *
 * Displays full product information with edit/delete actions.
 *
 * @see Story 3.1 - Product Model and Basic CRUD
 */
export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = use(params)
  const { data: product, isLoading, error } = useProduct(id)
  const { hasPermission } = usePermissions()

  const canEdit = hasPermission('products:update')
  const canDelete = hasPermission('products:delete')

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  if (isLoading) {
    return <ProductDetailSkeleton />
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/products">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <h1 className="font-mono text-2xl uppercase tracking-wider">ERREUR</h1>
        </div>
        <div className="border border-destructive p-8 text-center">
          <p className="font-mono text-destructive text-sm">{error.message}</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/products">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <h1 className="font-mono text-2xl uppercase tracking-wider">
            PRODUIT NON TROUVÉ
          </h1>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/products">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="font-mono text-2xl uppercase tracking-wider">
              {product.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {product.slug}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button asChild>
              <Link href={`/products/${id}/edit`}>
                <Pencil className="mr-2 size-4" />
                Modifier
              </Link>
            </Button>
          )}
          {canDelete && (
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="mr-2 size-4" />
              Supprimer
            </Button>
          )}
        </div>
      </div>

      {/* Product Details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Main Info */}
        <div className="border border-border p-6">
          <h2 className="font-mono text-sm uppercase tracking-wider text-muted-foreground mb-4">
            INFORMATIONS
          </h2>
          <dl className="space-y-4">
            <div>
              <dt className="font-mono text-xs uppercase text-muted-foreground">
                Prix
              </dt>
              <dd className="font-mono text-xl">{formatPrice(product.priceInCents)}</dd>
            </div>
            <div>
              <dt className="font-mono text-xs uppercase text-muted-foreground">
                Statut
              </dt>
              <dd className="mt-1">
                <ProductStatusBadge status={product.status} />
              </dd>
            </div>
            {product.productType && (
              <div>
                <dt className="font-mono text-xs uppercase text-muted-foreground">
                  Type
                </dt>
                <dd className="text-sm">{product.productType}</dd>
              </div>
            )}
            {product.vendor && (
              <div>
                <dt className="font-mono text-xs uppercase text-muted-foreground">
                  Vendeur
                </dt>
                <dd className="text-sm">{product.vendor}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Description & Tags */}
        <div className="border border-border p-6">
          <h2 className="font-mono text-sm uppercase tracking-wider text-muted-foreground mb-4">
            DESCRIPTION
          </h2>
          <p className="text-sm whitespace-pre-wrap">
            {product.description || 'Aucune description'}
          </p>

          {product.tags && product.tags.length > 0 && (
            <div className="mt-6">
              <h3 className="font-mono text-xs uppercase text-muted-foreground mb-2">
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="border border-border px-2 py-1 font-mono text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="border border-border p-6 md:col-span-2">
          <h2 className="font-mono text-sm uppercase tracking-wider text-muted-foreground mb-4">
            MÉTADONNÉES
          </h2>
          <dl className="grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="font-mono text-xs uppercase text-muted-foreground">
                ID
              </dt>
              <dd className="font-mono text-xs">{product.id}</dd>
            </div>
            <div>
              <dt className="font-mono text-xs uppercase text-muted-foreground">
                Créé le
              </dt>
              <dd className="font-mono text-xs">{formatDate(product.createdAt)}</dd>
            </div>
            <div>
              <dt className="font-mono text-xs uppercase text-muted-foreground">
                Mis à jour le
              </dt>
              <dd className="font-mono text-xs">{formatDate(product.updatedAt)}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Categories Section - Story 3.4 */}
      <CategoriesSection productId={id} />

      {/* Media Section - Story 3.3 */}
      <MediaSection productId={id} />

      {/* Variants Section - Story 3.2 */}
      <VariantsSection productId={id} />

      {/* Delete Dialog */}
      <DeleteProductDialog
        product={product}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      />
    </div>
  )
}

/**
 * Product Detail Skeleton
 */
function ProductDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Skeleton className="size-10" />
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-32" />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  )
}
