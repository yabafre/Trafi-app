'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ProductResponse, CreateProductInput, UpdateProductInput, ProductStatus } from '@trafi/validators'

interface ProductFormProps {
  /** Existing product data for editing (null for create mode) */
  product?: ProductResponse | null
  /** Form submission handler */
  onSubmit: (data: CreateProductInput | UpdateProductInput) => void
  /** Whether submission is pending */
  isPending: boolean
  /** Form mode */
  mode: 'create' | 'edit'
}

interface FormData {
  name: string
  slug: string
  description: string
  priceInCents: string
  status: ProductStatus
  productType: string
  vendor: string
  tags: string
}

interface FormErrors {
  name?: string
  slug?: string
  priceInCents?: string
}

/**
 * Product Form Component
 *
 * Reusable form for creating and editing products.
 * Digital Brutalism design pattern.
 *
 * @see Story 3.1 - Product Model and Basic CRUD
 */
export function ProductForm({ product, onSubmit, isPending, mode }: ProductFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    slug: '',
    description: '',
    priceInCents: '',
    status: 'draft',
    productType: '',
    vendor: '',
    tags: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isDirty, setIsDirty] = useState(false)

  // Sync form with product data for edit mode
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        slug: product.slug || '',
        description: product.description || '',
        priceInCents: product.priceInCents?.toString() || '',
        status: product.status || 'draft',
        productType: product.productType || '',
        vendor: product.vendor || '',
        tags: product.tags?.join(', ') || '',
      })
      setIsDirty(false)
    }
  }, [product])

  const validateSlug = (value: string): string | undefined => {
    if (!value) return undefined // Optional field
    const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/
    if (!slugRegex.test(value)) {
      return 'Le slug doit contenir uniquement des lettres minuscules, chiffres et tirets'
    }
    return undefined
  }

  const validatePrice = (value: string): string | undefined => {
    if (!value && mode === 'create') return 'Le prix est obligatoire'
    if (value && (isNaN(Number(value)) || Number(value) < 0)) {
      return 'Le prix doit être un nombre positif'
    }
    return undefined
  }

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setIsDirty(true)

    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSlugBlur = () => {
    const error = validateSlug(formData.slug)
    if (error) {
      setErrors((prev) => ({ ...prev, slug: error }))
    }
  }

  const handlePriceBlur = () => {
    const error = validatePrice(formData.priceInCents)
    if (error) {
      setErrors((prev) => ({ ...prev, priceInCents: error }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate
    const slugError = validateSlug(formData.slug)
    const priceError = validatePrice(formData.priceInCents)

    if (slugError || priceError) {
      setErrors({ slug: slugError, priceInCents: priceError })
      return
    }

    if (mode === 'create' && !formData.name) {
      setErrors({ name: 'Le nom est obligatoire' })
      return
    }

    // Parse tags from comma-separated string
    const tags = formData.tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)

    // Build payload
    const data: CreateProductInput | UpdateProductInput = {
      ...(formData.name && { name: formData.name }),
      ...(formData.slug && { slug: formData.slug }),
      ...(formData.description && { description: formData.description }),
      ...(formData.priceInCents && { priceInCents: parseInt(formData.priceInCents, 10) }),
      status: formData.status,
      ...(formData.productType && { productType: formData.productType }),
      ...(formData.vendor && { vendor: formData.vendor }),
      tags,
    }

    onSubmit(data)
  }

  const isValid = !errors.slug && !errors.priceInCents && !errors.name

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Product Name */}
      <div className="grid gap-2">
        <Label htmlFor="name" className="font-mono text-xs uppercase tracking-wider">
          NOM DU PRODUIT *
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Ex: T-Shirt Premium"
          disabled={isPending}
          className="border-border bg-transparent rounded-none focus:border-primary focus:ring-primary"
          data-testid="product-name-input"
        />
        {errors.name && (
          <span className="font-mono text-xs text-destructive">{errors.name}</span>
        )}
      </div>

      {/* Slug */}
      <div className="grid gap-2">
        <Label htmlFor="slug" className="font-mono text-xs uppercase tracking-wider">
          SLUG (URL)
        </Label>
        <Input
          id="slug"
          value={formData.slug}
          onChange={(e) => handleChange('slug', e.target.value.toLowerCase())}
          onBlur={handleSlugBlur}
          placeholder="t-shirt-premium (auto-généré si vide)"
          disabled={isPending}
          className="border-border bg-transparent rounded-none focus:border-primary focus:ring-primary"
          data-testid="product-slug-input"
        />
        {errors.slug && (
          <span className="font-mono text-xs text-destructive">{errors.slug}</span>
        )}
      </div>

      {/* Description */}
      <div className="grid gap-2">
        <Label htmlFor="description" className="font-mono text-xs uppercase tracking-wider">
          DESCRIPTION
        </Label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Description du produit..."
          disabled={isPending}
          rows={4}
          className="flex w-full border border-border bg-transparent px-3 py-2 text-sm font-mono rounded-none focus:border-primary focus:ring-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          data-testid="product-description-input"
        />
      </div>

      {/* Price */}
      <div className="grid gap-2">
        <Label htmlFor="price" className="font-mono text-xs uppercase tracking-wider">
          PRIX (EN CENTIMES) *
        </Label>
        <Input
          id="price"
          type="number"
          value={formData.priceInCents}
          onChange={(e) => handleChange('priceInCents', e.target.value)}
          onBlur={handlePriceBlur}
          placeholder="1999 = 19,99 €"
          disabled={isPending}
          min={0}
          className="border-border bg-transparent rounded-none focus:border-primary focus:ring-primary"
          data-testid="product-price-input"
        />
        {errors.priceInCents && (
          <span className="font-mono text-xs text-destructive">{errors.priceInCents}</span>
        )}
        <span className="font-mono text-xs text-muted-foreground">
          Entrez le prix en centimes. Ex: 1999 = 19,99 €
        </span>
      </div>

      {/* Status */}
      <div className="grid gap-2">
        <Label htmlFor="status" className="font-mono text-xs uppercase tracking-wider">
          STATUT
        </Label>
        <select
          id="status"
          value={formData.status}
          onChange={(e) => handleChange('status', e.target.value)}
          disabled={isPending}
          className="h-10 border border-border bg-background px-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          data-testid="product-status-select"
        >
          <option value="draft">Brouillon</option>
          <option value="active">Actif</option>
          <option value="archived">Archivé</option>
        </select>
      </div>

      {/* Product Type */}
      <div className="grid gap-2">
        <Label htmlFor="productType" className="font-mono text-xs uppercase tracking-wider">
          TYPE DE PRODUIT
        </Label>
        <Input
          id="productType"
          value={formData.productType}
          onChange={(e) => handleChange('productType', e.target.value)}
          placeholder="Ex: Physical, Digital, Service"
          disabled={isPending}
          className="border-border bg-transparent rounded-none focus:border-primary focus:ring-primary"
          data-testid="product-type-input"
        />
      </div>

      {/* Vendor */}
      <div className="grid gap-2">
        <Label htmlFor="vendor" className="font-mono text-xs uppercase tracking-wider">
          VENDEUR / MARQUE
        </Label>
        <Input
          id="vendor"
          value={formData.vendor}
          onChange={(e) => handleChange('vendor', e.target.value)}
          placeholder="Ex: Trafi Apparel"
          disabled={isPending}
          className="border-border bg-transparent rounded-none focus:border-primary focus:ring-primary"
          data-testid="product-vendor-input"
        />
      </div>

      {/* Tags */}
      <div className="grid gap-2">
        <Label htmlFor="tags" className="font-mono text-xs uppercase tracking-wider">
          TAGS
        </Label>
        <Input
          id="tags"
          value={formData.tags}
          onChange={(e) => handleChange('tags', e.target.value)}
          placeholder="clothing, summer, featured (séparés par des virgules)"
          disabled={isPending}
          className="border-border bg-transparent rounded-none focus:border-primary focus:ring-primary"
          data-testid="product-tags-input"
        />
        <span className="font-mono text-xs text-muted-foreground">
          Séparez les tags par des virgules
        </span>
      </div>

      {/* Submit Button */}
      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={isPending || !isDirty || !isValid}
          className="bg-primary text-primary-foreground hover:bg-primary/90 font-mono uppercase rounded-none"
          data-testid="product-save-button"
        >
          {isPending
            ? mode === 'create'
              ? 'CRÉATION...'
              : 'ENREGISTREMENT...'
            : mode === 'create'
              ? 'CRÉER LE PRODUIT'
              : 'ENREGISTRER'}
        </Button>
      </div>
    </form>
  )
}
