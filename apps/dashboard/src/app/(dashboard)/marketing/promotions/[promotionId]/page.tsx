'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Play, Pause, Archive, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { usePermissions } from '@/lib/hooks'
import { PromotionStatusBadge, PromotionTypeBadge } from '../_components'
import { EditPromotionForm, CouponsTab } from './_components'
import {
  usePromotion,
  useDeletePromotion,
  useActivatePromotion,
  usePausePromotion,
  useArchivePromotion,
} from '../_hooks'
import { useState } from 'react'

interface PromotionDetailPageProps {
  params: Promise<{ promotionId: string }>
}

/**
 * Promotion Detail/Edit Page
 *
 * Shows promotion details with tabs for editing and managing coupons.
 * Status action buttons for activate/pause/archive.
 *
 * @see Story 3.9 - Promotions & Discounts Foundation
 */
export default function PromotionDetailPage({ params }: PromotionDetailPageProps) {
  const { promotionId } = use(params)
  const router = useRouter()
  const { hasPermission } = usePermissions()
  const canRead = hasPermission('settings:read')
  const canUpdate = hasPermission('settings:update')

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const { data: promotion, isLoading, error } = usePromotion(promotionId)

  const deleteMutation = useDeletePromotion()
  const activateMutation = useActivatePromotion()
  const pauseMutation = usePausePromotion()
  const archiveMutation = useArchivePromotion()

  const handleDelete = async () => {
    await deleteMutation.mutateAsync({ id: promotionId })
    router.push('/marketing/promotions')
  }

  const handleActivate = async () => {
    await activateMutation.mutateAsync({ id: promotionId })
  }

  const handlePause = async () => {
    await pauseMutation.mutateAsync({ id: promotionId })
  }

  const handleArchive = async () => {
    await archiveMutation.mutateAsync({ id: promotionId })
  }

  // Permission check
  if (!canRead) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h1 className="font-mono text-2xl uppercase tracking-wider text-destructive">
          ACCESS DENIED
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have the necessary permissions to view this page.
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    )
  }

  if (error || !promotion) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h1 className="font-mono text-2xl uppercase tracking-wider text-destructive">
          PROMOTION NOT FOUND
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error?.message || 'The promotion you are looking for does not exist.'}
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push('/marketing/promotions')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Promotions
        </Button>
      </div>
    )
  }

  const isPending =
    deleteMutation.isPending ||
    activateMutation.isPending ||
    pauseMutation.isPending ||
    archiveMutation.isPending

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-mono text-2xl uppercase tracking-wider">
                {promotion.name}
              </h1>
              <PromotionStatusBadge status={promotion.status} />
              <PromotionTypeBadge
                type={promotion.type}
                discountValue={promotion.discountValue}
              />
            </div>
            {promotion.description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {promotion.description}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {canUpdate && (
          <div className="flex items-center gap-2">
            {/* Status actions based on current status */}
            {(promotion.status === 'DRAFT' || promotion.status === 'PAUSED') && (
              <Button
                variant="outline"
                onClick={handleActivate}
                disabled={isPending}
              >
                <Play className="mr-2 h-4 w-4" />
                Activate
              </Button>
            )}
            {promotion.status === 'ACTIVE' && (
              <Button
                variant="outline"
                onClick={handlePause}
                disabled={isPending}
              >
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </Button>
            )}
            {promotion.status !== 'ARCHIVED' && (
              <Button
                variant="outline"
                onClick={handleArchive}
                disabled={isPending}
              >
                <Archive className="mr-2 h-4 w-4" />
                Archive
              </Button>
            )}
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Read-only indicator for viewers */}
      {!canUpdate && (
        <div className="border border-yellow-500/50 bg-yellow-500/10 px-4 py-3">
          <p className="font-mono text-xs uppercase tracking-wider text-yellow-500">
            READ-ONLY MODE - Contact an administrator to modify this promotion.
          </p>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="coupons">Coupons</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <EditPromotionForm promotion={promotion} canUpdate={canUpdate} />
        </TabsContent>

        <TabsContent value="coupons">
          <CouponsTab promotionId={promotionId} canUpdate={canUpdate} />
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Promotion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{promotion.name}&quot;? This action
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
