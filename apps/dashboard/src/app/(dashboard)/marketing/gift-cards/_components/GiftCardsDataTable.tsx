'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, MoreHorizontal, Eye, Ban, CheckCircle, DollarSign, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { GiftCardStatusBadge } from './GiftCardStatusBadge'
import { IssueGiftCardDialog } from './IssueGiftCardDialog'
import {
  useGiftCardList,
  useDisableGiftCard,
  useEnableGiftCard,
} from '../_hooks'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/utils'

type GiftCardStatus = 'PENDING' | 'ACTIVE' | 'DISABLED' | 'EXPIRED' | 'DEPLETED'

interface GiftCardItem {
  id: string
  codeLast4: string
  initialBalanceCents: number
  currentBalanceCents: number
  currencyCode: string
  status: GiftCardStatus
  recipientEmail: string | null
  recipientName: string | null
  expiresAt: Date | null
  createdAt: Date
  templateName?: string
}

/**
 * Gift Cards Data Table Component
 *
 * Main component for displaying and managing gift cards.
 * Shows table with code, balance, status, recipient, expiration.
 *
 * @see Story 3.10 - Gift Cards
 */
export function GiftCardsDataTable() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<GiftCardStatus | 'ALL'>('ALL')
  const [search, setSearch] = useState('')
  const [showIssueDialog, setShowIssueDialog] = useState(false)
  const [disablingCard, setDisablingCard] = useState<GiftCardItem | null>(null)
  const [disableReason, setDisableReason] = useState('')

  const { data, isLoading, error } = useGiftCardList({
    page,
    limit: 20,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    search: search || undefined,
  })

  const disableMutation = useDisableGiftCard()
  const enableMutation = useEnableGiftCard()

  const handleDisable = async () => {
    if (!disablingCard || !disableReason.trim()) return
    await disableMutation.mutateAsync({
      giftCardId: disablingCard.id,
      reason: disableReason.trim(),
    })
    setDisablingCard(null)
    setDisableReason('')
  }

  const handleEnable = async (card: GiftCardItem) => {
    await enableMutation.mutateAsync({ giftCardId: card.id })
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load gift cards</p>
        <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with filter, search, and create button */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value as GiftCardStatus | 'ALL')
              setPage(1)
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="DISABLED">Disabled</SelectItem>
              <SelectItem value="EXPIRED">Expired</SelectItem>
              <SelectItem value="DEPLETED">Depleted</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Search by code (last 4)..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-[200px]"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/marketing/gift-cards/templates">
              <Settings className="mr-2 h-4 w-4" />
              Templates
            </Link>
          </Button>
          <Button onClick={() => setShowIssueDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Issue Gift Card
          </Button>
        </div>
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
          <h3 className="text-lg font-semibold">No gift cards found</h3>
          <p className="text-muted-foreground mt-1">
            {statusFilter === 'ALL' && !search
              ? 'Issue your first gift card to start selling.'
              : 'No gift cards match your filters.'}
          </p>
          <Button onClick={() => setShowIssueDialog(true)} className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Issue Gift Card
          </Button>
        </div>
      ) : (
        <>
          <div className="border rounded-none">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((card) => (
                  <TableRow key={card.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell
                      className="font-mono"
                      onClick={() => router.push(`/marketing/gift-cards/${card.id}`)}
                    >
                      ****-{card.codeLast4}
                    </TableCell>
                    <TableCell
                      onClick={() => router.push(`/marketing/gift-cards/${card.id}`)}
                    >
                      {card.templateName || '-'}
                    </TableCell>
                    <TableCell
                      className="text-right font-mono"
                      onClick={() => router.push(`/marketing/gift-cards/${card.id}`)}
                    >
                      <div>
                        <div>{formatCurrency(card.currentBalanceCents, card.currencyCode)}</div>
                        {card.currentBalanceCents !== card.initialBalanceCents && (
                          <div className="text-xs text-muted-foreground">
                            of {formatCurrency(card.initialBalanceCents, card.currencyCode)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell onClick={() => router.push(`/marketing/gift-cards/${card.id}`)}>
                      <GiftCardStatusBadge status={card.status} />
                    </TableCell>
                    <TableCell onClick={() => router.push(`/marketing/gift-cards/${card.id}`)}>
                      <div className="text-sm">
                        {card.recipientName || card.recipientEmail || '-'}
                        {card.recipientName && card.recipientEmail && (
                          <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {card.recipientEmail}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell onClick={() => router.push(`/marketing/gift-cards/${card.id}`)}>
                      {card.expiresAt
                        ? format(new Date(card.expiresAt), 'MMM d, yyyy')
                        : 'Never'}
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
                            onClick={() => router.push(`/marketing/gift-cards/${card.id}`)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => router.push(`/marketing/gift-cards/${card.id}?adjust=true`)}
                          >
                            <DollarSign className="mr-2 h-4 w-4" />
                            Adjust Balance
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {card.status === 'DISABLED' ? (
                            <DropdownMenuItem
                              onClick={() => handleEnable(card)}
                              disabled={enableMutation.isPending}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Enable
                            </DropdownMenuItem>
                          ) : card.status === 'ACTIVE' ? (
                            <DropdownMenuItem
                              onClick={() => setDisablingCard(card)}
                              className="text-destructive"
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              Disable
                            </DropdownMenuItem>
                          ) : null}
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

      {/* Issue Gift Card Dialog */}
      <IssueGiftCardDialog open={showIssueDialog} onOpenChange={setShowIssueDialog} />

      {/* Disable Confirmation Dialog */}
      <AlertDialog open={!!disablingCard} onOpenChange={(open) => !open && setDisablingCard(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Gift Card</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disable gift card ending in &quot;{disablingCard?.codeLast4}&quot;?
              The card will no longer be usable until re-enabled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              placeholder="Reason for disabling..."
              value={disableReason}
              onChange={(e) => setDisableReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDisableReason('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisable}
              disabled={!disableReason.trim() || disableMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {disableMutation.isPending ? 'Disabling...' : 'Disable'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
