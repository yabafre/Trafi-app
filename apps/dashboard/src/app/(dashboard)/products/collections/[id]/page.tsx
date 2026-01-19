'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Pencil, Trash2, Plus, Eye, EyeOff, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCollectionWithProducts } from '../_hooks'
import { CollectionFormDialog, DeleteCollectionDialog, InlineCollectionEdit } from '../_components'
import Link from 'next/link'
import Image from 'next/image'

/**
 * Collection Detail Page
 *
 * Displays a single collection with its products.
 * Allows editing collection metadata and managing products.
 *
 * @see Story 3.5 - Collections Management
 */
export default function CollectionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const collectionId = params.id as string

  const { data: collection, isLoading, error } = useCollectionWithProducts(collectionId)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-destructive">Failed to load collection</p>
          <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
          <Button onClick={() => router.back()} className="mt-4" variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  if (!collection) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Collection not found</p>
          <Button onClick={() => router.push('/products/collections')} className="mt-4" variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Collections
          </Button>
        </div>
      </div>
    )
  }

  // Convert collection to the format expected by CollectionFormDialog
  const collectionForDialog = {
    id: collection.id,
    name: collection.name,
    slug: collection.slug,
    description: collection.description,
    imageUrl: collection.imageUrl,
    isVisible: collection.isVisible,
    isFeatured: collection.isFeatured,
    createdAt: collection.createdAt,
    updatedAt: collection.updatedAt,
    productCount: collection.products.length,
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/products/collections')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold text-zinc-100">
              <InlineCollectionEdit
                collectionId={collection.id}
                initialValue={collection.name}
                field="name"
              />
            </h1>
          </div>
          <div className="flex items-center gap-2 ml-10">
            <span className="text-zinc-400">/{collection.slug}</span>
            <div className="flex gap-1.5">
              {!collection.isVisible && (
                <Badge variant="secondary" className="gap-1">
                  <EyeOff className="h-3 w-3" />
                  Hidden
                </Badge>
              )}
              {collection.isFeatured && (
                <Badge variant="default" className="gap-1">
                  <Star className="h-3 w-3" />
                  Featured
                </Badge>
              )}
            </div>
          </div>
          {collection.description && (
            <p className="text-zinc-400 mt-2 ml-10">{collection.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsDeleteOpen(true)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Products Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Products ({collection.products.length})
          </h2>
          {/* TODO: Add "Add Products" button with product picker dialog */}
        </div>

        {collection.products.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed rounded-none">            <h3 className="text-lg font-semibold">No products in this collection</h3>
            <p className="text-muted-foreground mt-1">
              Add products to this collection to display them here.
            </p>
            {/* TODO: Add "Add Products" button */}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {collection.products.map((cp) => (
              <Card key={cp.productId} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {cp.product.media?.[0] && (
                      <div className="relative h-16 w-16 flex-shrink-0 rounded overflow-hidden bg-muted">
                        <Image
                          src={cp.product.media[0].url}
                          alt={cp.product.media[0].alt || cp.product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/products/${cp.product.id}`}
                        className="font-medium hover:underline truncate block"
                      >
                        {cp.product.name}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        ${(cp.product.priceInCents / 100).toFixed(2)}
                      </p>
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {cp.product.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <CollectionFormDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        collection={collectionForDialog}
      />

      {/* Delete Dialog */}
      <DeleteCollectionDialog
        open={isDeleteOpen}
        onOpenChange={(open) => {
          setIsDeleteOpen(open)
          if (!open) {
            // Navigate back after successful deletion
            // The dialog handles the deletion itself
          }
        }}
        collectionId={collection.id}
        collectionName={collection.name}
      />
    </div>
  )
}
