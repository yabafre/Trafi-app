'use client'

import { useState } from 'react'
import { Plus, Copy, Trash2, MoreHorizontal, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  useCouponList,
  useCreateCoupon,
  useGenerateCoupons,
  useDeactivateCoupon,
  useDeleteCoupon,
} from '../../_hooks'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface CouponsTabProps {
  promotionId: string
  canUpdate: boolean
}

interface CouponItem {
  id: string
  code: string
  usageLimit: number | null
  usageCount: number
  expiresAt: Date | null
  isActive: boolean
  createdAt: Date
}

/**
 * Coupons Tab Component
 *
 * Manages coupons associated with a promotion.
 * Supports creating single coupons and bulk generation.
 *
 * @see Story 3.9 - Promotions & Discounts Foundation
 */
export function CouponsTab({ promotionId, canUpdate }: CouponsTabProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isGenerateOpen, setIsGenerateOpen] = useState(false)
  const [deletingCoupon, setDeletingCoupon] = useState<CouponItem | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  // Create form state
  const [createCode, setCreateCode] = useState('')
  const [createUsageLimit, setCreateUsageLimit] = useState('')
  const [createExpiresAt, setCreateExpiresAt] = useState('')

  // Generate form state
  const [generateCount, setGenerateCount] = useState('10')
  const [generatePrefix, setGeneratePrefix] = useState('')
  const [generateUsageLimit, setGenerateUsageLimit] = useState('')
  const [generateExpiresAt, setGenerateExpiresAt] = useState('')

  const { data, isLoading, error } = useCouponList({
    promotionId,
    page,
    limit: 20,
  })

  const createMutation = useCreateCoupon()
  const generateMutation = useGenerateCoupons()
  const deactivateMutation = useDeactivateCoupon()
  const deleteMutation = useDeleteCoupon()

  const handleCopyCode = async (code: string) => {
    await navigator.clipboard.writeText(code)
    setCopiedCode(code)
    toast.success('Code copied to clipboard')
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(
      {
        promotionId,
        code: createCode.toUpperCase(),
        usageLimit: createUsageLimit ? parseInt(createUsageLimit, 10) : undefined,
        expiresAt: createExpiresAt ? new Date(createExpiresAt) : undefined,
      },
      {
        onSuccess: () => {
          setIsCreateOpen(false)
          setCreateCode('')
          setCreateUsageLimit('')
          setCreateExpiresAt('')
        },
      }
    )
  }

  const handleGenerateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    generateMutation.mutate(
      {
        promotionId,
        count: parseInt(generateCount, 10),
        prefix: generatePrefix || undefined,
        usageLimit: generateUsageLimit ? parseInt(generateUsageLimit, 10) : undefined,
        expiresAt: generateExpiresAt ? new Date(generateExpiresAt) : undefined,
      },
      {
        onSuccess: () => {
          setIsGenerateOpen(false)
          setGenerateCount('10')
          setGeneratePrefix('')
          setGenerateUsageLimit('')
          setGenerateExpiresAt('')
        },
      }
    )
  }

  const handleDeactivate = async (coupon: CouponItem) => {
    await deactivateMutation.mutateAsync({ id: coupon.id })
  }

  const handleDelete = async () => {
    if (!deletingCoupon) return
    await deleteMutation.mutateAsync({ id: deletingCoupon.id })
    setDeletingCoupon(null)
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-destructive">Failed to load coupons</p>
          <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Coupon Codes</h3>
          <p className="text-sm text-muted-foreground">
            {data?.total ?? 0} coupon{(data?.total ?? 0) !== 1 ? 's' : ''} total
          </p>
        </div>
        {canUpdate && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsGenerateOpen(true)}>
              Generate Bulk
            </Button>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Code
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : !data?.items.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-semibold">No coupons yet</h3>
            <p className="text-muted-foreground mt-1">
              Create coupon codes for customers to apply this promotion.
            </p>
            {canUpdate && (
              <div className="flex gap-2 justify-center mt-4">
                <Button variant="outline" onClick={() => setIsGenerateOpen(true)}>
                  Generate Bulk
                </Button>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Code
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="border rounded-none">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Usage</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                          {coupon.code}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleCopyCode(coupon.code)}
                        >
                          {copiedCode === coupon.code ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={coupon.isActive ? 'default' : 'secondary'}
                        className={coupon.isActive ? 'bg-green-600' : ''}
                      >
                        {coupon.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {coupon.usageCount}
                      {coupon.usageLimit && (
                        <span className="text-muted-foreground">
                          /{coupon.usageLimit}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {coupon.expiresAt
                        ? format(new Date(coupon.expiresAt), 'MMM d, yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(coupon.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      {canUpdate && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleCopyCode(coupon.code)}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Copy Code
                            </DropdownMenuItem>
                            {coupon.isActive && (
                              <DropdownMenuItem
                                onClick={() => handleDeactivate(coupon)}
                                disabled={deactivateMutation.isPending}
                              >
                                Deactivate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => setDeletingCoupon(coupon)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
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
                Page {data.page}
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

      {/* Create Single Coupon Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <form onSubmit={handleCreateSubmit}>
            <DialogHeader>
              <DialogTitle>Create Coupon Code</DialogTitle>
              <DialogDescription>
                Create a single coupon code for this promotion.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={createCode}
                  onChange={(e) => setCreateCode(e.target.value.toUpperCase())}
                  placeholder="e.g., SUMMER2026"
                  disabled={createMutation.isPending}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="usageLimit">Usage Limit</Label>
                <Input
                  id="usageLimit"
                  type="number"
                  min="1"
                  value={createUsageLimit}
                  onChange={(e) => setCreateUsageLimit(e.target.value)}
                  placeholder="Unlimited"
                  disabled={createMutation.isPending}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expiresAt">Expires At</Label>
                <Input
                  id="expiresAt"
                  type="datetime-local"
                  value={createExpiresAt}
                  onChange={(e) => setCreateExpiresAt(e.target.value)}
                  disabled={createMutation.isPending}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsCreateOpen(false)}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || !createCode}>
                {createMutation.isPending ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Generate Bulk Coupons Dialog */}
      <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
        <DialogContent>
          <form onSubmit={handleGenerateSubmit}>
            <DialogHeader>
              <DialogTitle>Generate Bulk Coupons</DialogTitle>
              <DialogDescription>
                Generate multiple unique coupon codes at once.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="count">Number of Codes *</Label>
                <Input
                  id="count"
                  type="number"
                  min="1"
                  max="1000"
                  value={generateCount}
                  onChange={(e) => setGenerateCount(e.target.value)}
                  disabled={generateMutation.isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum 1000 codes per batch
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="prefix">Code Prefix</Label>
                <Input
                  id="prefix"
                  value={generatePrefix}
                  onChange={(e) => setGeneratePrefix(e.target.value.toUpperCase())}
                  placeholder="e.g., PROMO"
                  disabled={generateMutation.isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Generated codes will be: PREFIX-XXXXXX
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bulkUsageLimit">Usage Limit (per code)</Label>
                <Input
                  id="bulkUsageLimit"
                  type="number"
                  min="1"
                  value={generateUsageLimit}
                  onChange={(e) => setGenerateUsageLimit(e.target.value)}
                  placeholder="Unlimited"
                  disabled={generateMutation.isPending}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bulkExpiresAt">Expires At</Label>
                <Input
                  id="bulkExpiresAt"
                  type="datetime-local"
                  value={generateExpiresAt}
                  onChange={(e) => setGenerateExpiresAt(e.target.value)}
                  disabled={generateMutation.isPending}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsGenerateOpen(false)}
                disabled={generateMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={generateMutation.isPending}>
                {generateMutation.isPending ? 'Generating...' : 'Generate'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingCoupon}
        onOpenChange={(open) => !open && setDeletingCoupon(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Coupon</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete coupon code &quot;{deletingCoupon?.code}&quot;?
              This action cannot be undone.
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
