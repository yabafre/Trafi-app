'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Ban, CheckCircle, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
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
import { Input } from '@/components/ui/input'
import { GiftCardStatusBadge } from '../../_components/GiftCardStatusBadge'
import { AdjustBalanceDialog } from './AdjustBalanceDialog'
import { TransactionsTable } from './TransactionsTable'
import { useGiftCard, useDisableGiftCard, useEnableGiftCard } from '../../_hooks'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/utils'

interface GiftCardDetailViewProps {
  giftCardId: string
  showAdjustDialog?: boolean
}

/**
 * Gift Card Detail View Component
 *
 * Shows full details of a gift card including:
 * - Balance (current vs initial)
 * - Status with actions (enable/disable)
 * - Recipient information
 * - Expiration
 * - Transaction history
 *
 * @see Story 3.10 - Gift Cards (AC3, AC4)
 */
export function GiftCardDetailView({ giftCardId, showAdjustDialog = false }: GiftCardDetailViewProps) {
  const router = useRouter()
  const [showAdjust, setShowAdjust] = useState(showAdjustDialog)
  const [showDisable, setShowDisable] = useState(false)
  const [disableReason, setDisableReason] = useState('')

  const { data: giftCard, isLoading, error } = useGiftCard(giftCardId)
  const disableMutation = useDisableGiftCard()
  const enableMutation = useEnableGiftCard()

  const handleDisable = async () => {
    if (!disableReason.trim()) return
    await disableMutation.mutateAsync({
      giftCardId,
      reason: disableReason.trim(),
    })
    setShowDisable(false)
    setDisableReason('')
  }

  const handleEnable = async () => {
    await enableMutation.mutateAsync({ giftCardId })
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load gift card</p>
        <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
        <Button onClick={() => router.push('/marketing/gift-cards')} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Gift Cards
        </Button>
      </div>
    )
  }

  if (isLoading || !giftCard) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  const usedAmount = giftCard.initialBalanceCents - giftCard.currentBalanceCents
  const usedPercent = giftCard.initialBalanceCents > 0
    ? Math.round((usedAmount / giftCard.initialBalanceCents) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/marketing/gift-cards')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-mono text-2xl uppercase tracking-wider">
              ****-{giftCard.codeLast4}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <GiftCardStatusBadge status={giftCard.status as 'PENDING' | 'ACTIVE' | 'DISABLED' | 'EXPIRED' | 'DEPLETED'} />
              {giftCard.templateName && (
                <span className="text-sm text-muted-foreground">
                  Template: {giftCard.templateName}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowAdjust(true)}>
            <DollarSign className="mr-2 h-4 w-4" />
            Adjust Balance
          </Button>
          {giftCard.status === 'DISABLED' ? (
            <Button
              onClick={handleEnable}
              disabled={enableMutation.isPending}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {enableMutation.isPending ? 'Enabling...' : 'Enable'}
            </Button>
          ) : giftCard.status === 'ACTIVE' ? (
            <Button
              variant="destructive"
              onClick={() => setShowDisable(true)}
            >
              <Ban className="mr-2 h-4 w-4" />
              Disable
            </Button>
          ) : null}
        </div>
      </div>

      {/* Details Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Balance Card */}
        <Card>
          <CardHeader>
            <CardTitle>Balance</CardTitle>
            <CardDescription>Current and initial balance information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-3xl font-mono font-bold">
                {formatCurrency(giftCard.currentBalanceCents, giftCard.currencyCode)}
              </div>
              <div className="text-sm text-muted-foreground">
                of {formatCurrency(giftCard.initialBalanceCents, giftCard.currencyCode)} initial
              </div>
            </div>
            <div className="w-full bg-muted rounded-none h-2">
              <div
                className="bg-primary h-2 rounded-none"
                style={{ width: `${100 - usedPercent}%` }}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {formatCurrency(usedAmount, giftCard.currencyCode)} used ({usedPercent}%)
            </div>
          </CardContent>
        </Card>

        {/* Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Information</CardTitle>
            <CardDescription>Gift card details and recipient info</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Created</dt>
                <dd className="font-mono">{format(new Date(giftCard.createdAt), 'MMM d, yyyy HH:mm')}</dd>
              </div>
              {giftCard.activatedAt && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Activated</dt>
                  <dd className="font-mono">{format(new Date(giftCard.activatedAt), 'MMM d, yyyy HH:mm')}</dd>
                </div>
              )}
              {giftCard.lastUsedAt && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Last Used</dt>
                  <dd className="font-mono">{format(new Date(giftCard.lastUsedAt), 'MMM d, yyyy HH:mm')}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Expires</dt>
                <dd className="font-mono">
                  {giftCard.expiresAt
                    ? format(new Date(giftCard.expiresAt), 'MMM d, yyyy')
                    : 'Never'}
                </dd>
              </div>
              {(giftCard.recipientName || giftCard.recipientEmail) && (
                <>
                  <hr className="my-2" />
                  {giftCard.recipientName && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Recipient</dt>
                      <dd>{giftCard.recipientName}</dd>
                    </div>
                  )}
                  {giftCard.recipientEmail && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Email</dt>
                      <dd className="truncate max-w-[200px]">{giftCard.recipientEmail}</dd>
                    </div>
                  )}
                </>
              )}
              {giftCard.senderName && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">From</dt>
                  <dd>{giftCard.senderName}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* Gift Message */}
      {giftCard.giftMessage && (
        <Card>
          <CardHeader>
            <CardTitle>Gift Message</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{giftCard.giftMessage}</p>
          </CardContent>
        </Card>
      )}

      {/* Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>All balance changes for this gift card</CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionsTable giftCardId={giftCardId} currencyCode={giftCard.currencyCode} />
        </CardContent>
      </Card>

      {/* Adjust Balance Dialog */}
      <AdjustBalanceDialog
        open={showAdjust}
        onOpenChange={setShowAdjust}
        giftCardId={giftCardId}
        currentBalanceCents={giftCard.currentBalanceCents}
        currencyCode={giftCard.currencyCode}
      />

      {/* Disable Confirmation Dialog */}
      <AlertDialog open={showDisable} onOpenChange={setShowDisable}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Gift Card</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disable this gift card?
              It will no longer be usable until re-enabled.
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
