'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Play, Pause, Archive, MoreHorizontal, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { PromotionStatusBadge } from './PromotionStatusBadge'
import { PromotionTypeBadge } from './PromotionTypeBadge'
import {
  usePromotionList,
  useDeletePromotion,
  useActivatePromotion,
  usePausePromotion,
  useArchivePromotion,
} from '../_hooks'
import { format } from 'date-fns'

type PromotionStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'ARCHIVED'

interface PromotionItem {
  id: string
  name: string
  description: string | null
  type: 'PERCENT' | 'FIXED' | 'FREE_SHIPPING' | 'BUY_X_GET_Y'
  discountValue: number | null
  status: PromotionStatus
  usageCount: number
  usageLimit: number | null
  startsAt: Date
  endsAt: Date | null
  createdAt: Date
}

/**
 * Promotions Data Table Component
 *
 * Main component for displaying and managing promotions.
 * Shows table with name, type, status, usage, dates.
 *
 * @see Story 3.9 - Promotions & Discounts Foundation
 */
export function PromotionsDataTable() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<PromotionStatus | 'ALL'>('ALL')
  const [deletingPromotion, setDeletingPromotion] = useState<PromotionItem | null>(null)

  const { data, isLoading, error } = usePromotionList({
    page,
    limit: 20,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
  })

  const deleteMutation = useDeletePromotion()
  const activateMutation = useActivatePromotion()
  const pauseMutation = usePausePromotion()
  const archiveMutation = useArchivePromotion()

  const handleDelete = async () => {
    if (!deletingPromotion) return
    await deleteMutation.mutateAsync({ id: deletingPromotion.id })
    setDeletingPromotion(null)
  }

  const handleActivate = async (promotion: PromotionItem) => {
    await activateMutation.mutateAsync({ id: promotion.id })
  }

  const handlePause = async (promotion: PromotionItem) => {
    await pauseMutation.mutateAsync({ id: promotion.id })
  }

  const handleArchive = async (promotion: PromotionItem) => {
    await archiveMutation.mutateAsync({ id: promotion.id })
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load promotions</p>
        <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with filter and create button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value as PromotionStatus | 'ALL')
              setPage(1)
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="PAUSED">Paused</SelectItem>
              <SelectItem value="EXPIRED">Expired</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => router.push('/marketing/promotions/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Promotion
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : !data?.items.length ? (
        <div className="text-center py-12 border-2 border-dashed rounded-none">
          <h3 className="text-lg font-semibold">No promotions found</h3>
          <p className="text-muted-foreground mt-1">
            {statusFilter === 'ALL'
              ? 'Create your first promotion to start offering discounts.'
              : `No promotions with status "${statusFilter}".`}
          </p>
          <Button onClick={() => router.push('/marketing/promotions/new')} className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Create Promotion
          </Button>
        </div>
      ) : (
        <>
          <div className="border rounded-none">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Usage</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((promotion) => (
                  <TableRow key={promotion.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell
                      className="font-medium"
                      onClick={() => router.push(`/marketing/promotions/${promotion.id}`)}
                    >
                      <div>
                        <div>{promotion.name}</div>
                        {promotion.description && (
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {promotion.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell onClick={() => router.push(`/marketing/promotions/${promotion.id}`)}>
                      <PromotionTypeBadge
                        type={promotion.type}
                        discountValue={promotion.discountValue}
                      />
                    </TableCell>
                    <TableCell onClick={() => router.push(`/marketing/promotions/${promotion.id}`)}>
                      <PromotionStatusBadge status={promotion.status} />
                    </TableCell>
                    <TableCell
                      className="text-right font-mono"
                      onClick={() => router.push(`/marketing/promotions/${promotion.id}`)}
                    >
                      {promotion.usageCount}
                      {promotion.usageLimit && (
                        <span className="text-muted-foreground">/{promotion.usageLimit}</span>
                      )}
                    </TableCell>
                    <TableCell
                      className="text-sm"
                      onClick={() => router.push(`/marketing/promotions/${promotion.id}`)}
                    >
                      <div className="text-xs">
                        <div>
                          Start: {format(new Date(promotion.startsAt), 'MMM d, yyyy')}
                        </div>
                        {promotion.endsAt && (
                          <div className="text-muted-foreground">
                            End: {format(new Date(promotion.endsAt), 'MMM d, yyyy')}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => router.push(`/marketing/promotions/${promotion.id}`)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => router.push(`/marketing/promotions/${promotion.id}`)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {/* Status actions */}
                          {(promotion.status === 'DRAFT' || promotion.status === 'PAUSED') && (
                            <DropdownMenuItem
                              onClick={() => handleActivate(promotion)}
                              disabled={activateMutation.isPending}
                            >
                              <Play className="mr-2 h-4 w-4" />
                              Activate
                            </DropdownMenuItem>
                          )}
                          {promotion.status === 'ACTIVE' && (
                            <DropdownMenuItem
                              onClick={() => handlePause(promotion)}
                              disabled={pauseMutation.isPending}
                            >
                              <Pause className="mr-2 h-4 w-4" />
                              Pause
                            </DropdownMenuItem>
                          )}
                          {promotion.status !== 'ARCHIVED' && (
                            <DropdownMenuItem
                              onClick={() => handleArchive(promotion)}
                              disabled={archiveMutation.isPending}
                            >
                              <Archive className="mr-2 h-4 w-4" />
                              Archive
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeletingPromotion(promotion)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {(data.hasMore || page > 1) && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {data.page} of {Math.ceil(data.total / 20)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={!data.hasMore}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingPromotion} onOpenChange={(open) => !open && setDeletingPromotion(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Promotion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingPromotion?.name}&quot;? This action
              cannot be undone. All associated coupons will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
