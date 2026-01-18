'use client'

import { useState } from 'react'
import { MoreHorizontal, Pencil, Trash2, Eye, EyeOff, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { CollectionFormDialog } from './CollectionFormDialog'
import { DeleteCollectionDialog } from './DeleteCollectionDialog'
import type { CollectionListItem } from '@trafi/validators'
import Link from 'next/link'

interface CollectionCardProps {
  collection: CollectionListItem
}

/**
 * Collection Card Component
 *
 * Displays a single collection in a card format.
 * Shows name, description, product count, and visibility/featured status.
 *
 * @see Story 3.5 - Collections Management
 */
export function CollectionCard({ collection }: CollectionCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  return (
    <>
      <Card className="group relative transition-shadow hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate">
                <Link
                  href={`/products/collections/${collection.id}`}
                  className="hover:underline"
                >
                  {collection.name}
                </Link>
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                /{collection.slug}
              </CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setIsDeleteOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          {collection.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {collection.description}
            </p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {collection.productCount}{' '}
              {collection.productCount === 1 ? 'product' : 'products'}
            </span>
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
        </CardContent>
      </Card>

      <CollectionFormDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        collection={collection}
      />

      <DeleteCollectionDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        collectionId={collection.id}
        collectionName={collection.name}
      />
    </>
  )
}
