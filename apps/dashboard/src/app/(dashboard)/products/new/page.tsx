'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductForm } from '../_components/ProductForm'
import { useCreateProduct } from '../_hooks'
import type { CreateProductInput, UpdateProductInput } from '@trafi/validators'

/**
 * New Product Page
 *
 * Form for creating a new product.
 *
 * @see Story 3.1 - Product Model and Basic CRUD
 */
export default function NewProductPage() {
  const { mutate: createProduct, isPending } = useCreateProduct()

  const handleSubmit = (data: CreateProductInput | UpdateProductInput) => {
    createProduct(data as CreateProductInput)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/products">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="font-mono text-2xl uppercase tracking-wider">
            NOUVEAU PRODUIT
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Créez un nouveau produit pour votre catalogue.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl border border-border p-6">
        <ProductForm
          mode="create"
          onSubmit={handleSubmit}
          isPending={isPending}
        />
      </div>
    </div>
  )
}
