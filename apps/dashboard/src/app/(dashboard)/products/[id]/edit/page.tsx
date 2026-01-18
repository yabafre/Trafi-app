'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ProductForm } from '../../_components/ProductForm'
import { useProduct, useUpdateProduct } from '../../_hooks'
import type { CreateProductInput, UpdateProductInput } from '@trafi/validators'

interface EditProductPageProps {
  params: Promise<{ id: string }>
}

/**
 * Edit Product Page
 *
 * Form for editing an existing product.
 *
 * @see Story 3.1 - Product Model and Basic CRUD
 */
export default function EditProductPage({ params }: EditProductPageProps) {
  const { id } = use(params)
  const { data: product, isLoading, error } = useProduct(id)
  const { mutate: updateProduct, isPending } = useUpdateProduct()

  const handleSubmit = (data: CreateProductInput | UpdateProductInput) => {
    updateProduct({ id, data: data as UpdateProductInput })
  }

  if (isLoading) {
    return <EditProductSkeleton />
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/products/${id}`}>
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="font-mono text-2xl uppercase tracking-wider">
            MODIFIER LE PRODUIT
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{product.name}</p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl border border-border p-6">
        <ProductForm
          product={product}
          mode="edit"
          onSubmit={handleSubmit}
          isPending={isPending}
        />
      </div>
    </div>
  )
}

/**
 * Edit Product Skeleton
 */
function EditProductSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Skeleton className="size-10" />
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-32" />
        </div>
      </div>
      <div className="max-w-2xl border border-border p-6 space-y-6">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
