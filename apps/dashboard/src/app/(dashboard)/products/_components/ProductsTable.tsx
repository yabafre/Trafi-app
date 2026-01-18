'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MoreHorizontal, Pencil, Trash2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ProductStatusBadge } from './ProductStatusBadge'
import { ProductsTableSkeleton } from './ProductsTableSkeleton'
import { useProducts } from '../_hooks'
import { usePermissions } from '@/lib/hooks'
import type { ProductResponse, ProductStatus } from '@trafi/validators'

interface ProductsTableProps {
  onDelete: (product: ProductResponse) => void
}

/**
 * Format price from cents to display string
 */
function formatPrice(cents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100)
}

/**
 * Format date for display
 */
function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

/**
 * Products Table Component
 *
 * Displays paginated list of products with actions.
 * Digital Brutalism design pattern.
 *
 * @see Story 3.1 - Product Model and Basic CRUD
 */
export function ProductsTable({ onDelete }: ProductsTableProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProductStatus | ''>('')
  const [page, setPage] = useState(1)

  const { data, isLoading, error } = useProducts({
    page,
    limit: 20,
    sortOrder: 'desc',
    ...(search && { search }),
    ...(statusFilter && { status: statusFilter }),
  })

  const { hasPermission } = usePermissions()
  const canEdit = hasPermission('products:update')
  const canDelete = hasPermission('products:delete')

  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <FilterBar
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />
        <ProductsTableSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="border border-destructive p-8 text-center">
        <p className="font-mono text-destructive text-sm">
          ERREUR: {error.message}
        </p>
      </div>
    )
  }

  const products = data?.items ?? []

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <FilterBar
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {products.length === 0 ? (
        <div className="border border-border p-8 text-center">
          <p className="font-mono text-muted-foreground text-sm">
            AUCUN PRODUIT TROUVÉ
          </p>
          {(search || statusFilter) && (
            <Button
              variant="link"
              className="mt-2"
              onClick={() => {
                setSearch('')
                setStatusFilter('')
              }}
            >
              Effacer les filtres
            </Button>
          )}
        </div>
      ) : (
        <div className="border border-border">
          {/* Header */}
          <div className="flex border-b border-border bg-secondary/30">
            <div className="flex-1 px-4 py-3">
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                NOM
              </span>
            </div>
            <div className="w-32 px-4 py-3">
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                PRIX
              </span>
            </div>
            <div className="w-32 px-4 py-3">
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                STATUT
              </span>
            </div>
            <div className="w-40 px-4 py-3">
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                DATE
              </span>
            </div>
            <div className="w-24 px-4 py-3">
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                ACTIONS
              </span>
            </div>
          </div>

          {/* Rows */}
          {products.map((product) => (
            <div
              key={product.id}
              className="flex border-b border-border last:border-b-0 hover:bg-secondary/20 transition-colors"
            >
              <div className="flex-1 px-4 py-4">
                <Link
                  href={`/products/${product.id}`}
                  className="font-mono text-sm text-foreground hover:text-accent transition-colors"
                >
                  {product.name}
                </Link>
                {product.vendor && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {product.vendor}
                  </p>
                )}
              </div>
              <div className="w-32 px-4 py-4">
                <span className="font-mono text-sm text-foreground">
                  {formatPrice(product.priceInCents)}
                </span>
              </div>
              <div className="w-32 px-4 py-4">
                <ProductStatusBadge status={product.status} />
              </div>
              <div className="w-40 px-4 py-4">
                <span className="font-mono text-xs text-muted-foreground">
                  {formatDate(product.createdAt)}
                </span>
              </div>
              <div className="w-24 px-4 py-4 relative">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() =>
                    setOpenDropdown(openDropdown === product.id ? null : product.id)
                  }
                  data-testid={`product-actions-${product.id}`}
                >
                  <MoreHorizontal className="size-4" />
                </Button>

                {openDropdown === product.id && (
                  <div
                    className="absolute right-4 top-12 z-10 w-48 border border-border bg-background shadow-lg"
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    <Link
                      href={`/products/${product.id}`}
                      className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm hover:bg-secondary transition-colors"
                      onClick={() => setOpenDropdown(null)}
                    >
                      <Eye className="size-4" />
                      <span>Voir</span>
                    </Link>
                    {canEdit && (
                      <Link
                        href={`/products/${product.id}/edit`}
                        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm hover:bg-secondary transition-colors"
                        onClick={() => setOpenDropdown(null)}
                      >
                        <Pencil className="size-4" />
                        <span>Modifier</span>
                      </Link>
                    )}
                    {canDelete && (
                      <button
                        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-destructive hover:bg-destructive/10 transition-colors"
                        onClick={() => {
                          onDelete(product)
                          setOpenDropdown(null)
                        }}
                      >
                        <Trash2 className="size-4" />
                        <span>Supprimer</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Footer - Pagination */}
          {data && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3 bg-secondary/30">
              <span className="font-mono text-xs text-muted-foreground">
                {data.total} produit{data.total > 1 ? 's' : ''}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Précédent
                </Button>
                <span className="font-mono text-xs text-muted-foreground">
                  {data.page}/{data.totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= data.totalPages}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Filter Bar Component
 */
function FilterBar({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
}: {
  search: string
  setSearch: (value: string) => void
  statusFilter: ProductStatus | ''
  setStatusFilter: (value: ProductStatus | '') => void
}) {
  return (
    <div className="flex gap-4">
      <Input
        placeholder="Rechercher..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value as ProductStatus | '')}
        className="h-10 border border-border bg-background px-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent"
      >
        <option value="">Tous les statuts</option>
        <option value="draft">Brouillon</option>
        <option value="active">Actif</option>
        <option value="archived">Archivé</option>
      </select>
    </div>
  )
}
