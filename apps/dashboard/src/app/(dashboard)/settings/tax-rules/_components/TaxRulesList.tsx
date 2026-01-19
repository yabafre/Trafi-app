'use client'

import { useState } from 'react'
import { Plus, Star, Truck, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal } from 'lucide-react'
import { TaxRuleFormDialog } from './TaxRuleFormDialog'
import { DeleteTaxRuleDialog } from './DeleteTaxRuleDialog'
import { useTaxRuleList, useSetDefaultTaxRule } from '../_hooks'
import type { TaxRuleResponse } from '@trafi/types'

/**
 * Tax Rules List Component
 *
 * Main component for displaying and managing tax rules.
 * Shows table with name, rate, country, default/shipping badges.
 *
 * @see Story 3.6 - Product Pricing and Tax Rules
 */
export function TaxRulesList() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingTaxRule, setEditingTaxRule] = useState<TaxRuleResponse | null>(null)
  const [deletingTaxRule, setDeletingTaxRule] = useState<TaxRuleResponse | null>(null)
  const [page, setPage] = useState(1)

  const { data, isLoading, error } = useTaxRuleList({ page, limit: 50 })
  const setDefaultMutation = useSetDefaultTaxRule()

  const handleSetDefault = async (taxRule: TaxRuleResponse) => {
    if (taxRule.isDefault) return
    await setDefaultMutation.mutateAsync({ id: taxRule.id })
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load tax rules</p>
        <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Tax Rules</h2>
          <p className="text-sm text-muted-foreground">
            Manage tax rates for your products
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Tax Rule
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : !data?.items.length ? (
        <div className="text-center py-12 border-2 border-dashed rounded-none">
          <h3 className="text-lg font-semibold">No tax rules yet</h3>
          <p className="text-muted-foreground mt-1">
            Create your first tax rule to apply taxes to products.
          </p>
          <Button onClick={() => setIsCreateOpen(true)} className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Create Tax Rule
          </Button>
        </div>
      ) : (
        <>
                      <div className="border rounded-none">            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((taxRule) => (
                  <TableRow key={taxRule.id}>
                    <TableCell className="font-medium">{taxRule.name}</TableCell>
                    <TableCell className="text-right font-mono">
                      {taxRule.rate.toFixed(2)}%
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{taxRule.countryIso2}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {taxRule.isDefault && (
                          <Badge variant="secondary" className="gap-1">
                            <Star className="h-3 w-3" />
                            Default
                          </Badge>
                        )}
                        {taxRule.appliesToShipping && (
                          <Badge variant="outline" className="gap-1">
                            <Truck className="h-3 w-3" />
                            Shipping
                          </Badge>
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
                          <DropdownMenuItem onClick={() => setEditingTaxRule(taxRule)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          {!taxRule.isDefault && (
                            <DropdownMenuItem
                              onClick={() => handleSetDefault(taxRule)}
                              disabled={setDefaultMutation.isPending}
                            >
                              <Star className="mr-2 h-4 w-4" />
                              Set as Default
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => setDeletingTaxRule(taxRule)}
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
          {data.hasMore && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">Page {data.page}</span>
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

      {/* Create/Edit Dialog */}
      <TaxRuleFormDialog
        open={isCreateOpen || !!editingTaxRule}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false)
            setEditingTaxRule(null)
          }
        }}
        taxRule={editingTaxRule}
      />

      {/* Delete Dialog */}
      <DeleteTaxRuleDialog
        open={!!deletingTaxRule}
        onOpenChange={(open) => !open && setDeletingTaxRule(null)}
        taxRule={deletingTaxRule}
      />
    </div>
  )
}
