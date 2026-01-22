'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useGiftCardTransactions } from '../../_hooks'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/utils'
import type { GiftCardTransactionType } from '@trafi/types'

interface TransactionsTableProps {
  giftCardId: string
  currencyCode: string
}

/**
 * Transactions table for gift card detail view
 *
 * Shows all balance changes with type, amount, balance after, and reason.
 *
 * @see Story 3.10 - Gift Cards (AC3)
 */
export function TransactionsTable({ giftCardId, currencyCode }: TransactionsTableProps) {
  const { data, isLoading, error } = useGiftCardTransactions(giftCardId, { limit: 50 })

  const getTypeBadge = (type: GiftCardTransactionType) => {
    const styles: Record<GiftCardTransactionType, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      CREDIT: { variant: 'default', label: 'Credit' },
      DEBIT: { variant: 'secondary', label: 'Debit' },
      REFUND: { variant: 'outline', label: 'Refund' },
      ADJUSTMENT: { variant: 'outline', label: 'Adjustment' },
      EXPIRATION: { variant: 'destructive', label: 'Expired' },
    }
    const { variant, label } = styles[type] || { variant: 'outline', label: type }
    return (
      <Badge variant={variant} className="font-mono text-xs uppercase">
        {label}
      </Badge>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Failed to load transactions</p>
        <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
    )
  }

  if (!data?.items.length) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No transactions yet</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="text-right">Balance After</TableHead>
          <TableHead>Reason / Order</TableHead>
          <TableHead>By</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.items.map((tx) => (
          <TableRow key={tx.id}>
            <TableCell className="text-sm">
              {format(new Date(tx.createdAt), 'MMM d, yyyy HH:mm')}
            </TableCell>
            <TableCell>{getTypeBadge(tx.type as GiftCardTransactionType)}</TableCell>
            <TableCell className={`text-right font-mono ${tx.amountCents >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {tx.amountCents >= 0 ? '+' : ''}
              {formatCurrency(tx.amountCents, currencyCode)}
            </TableCell>
            <TableCell className="text-right font-mono">
              {formatCurrency(tx.balanceAfterCents, currencyCode)}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]">
              {tx.reason || (tx.orderId ? `Order: ${tx.orderId}` : '-')}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {tx.performedByName || '-'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
