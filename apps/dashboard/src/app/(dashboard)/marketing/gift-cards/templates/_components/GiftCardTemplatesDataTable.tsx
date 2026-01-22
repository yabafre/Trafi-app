'use client'

import { useState } from 'react'
import { Plus, MoreHorizontal, Edit, Trash, Power, PowerOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { CreateTemplateDialog } from './CreateTemplateDialog'
import { EditTemplateDialog } from './EditTemplateDialog'
import {
  useGiftCardTemplateList,
  useDeleteGiftCardTemplate,
  useActivateGiftCardTemplate,
  useDeactivateGiftCardTemplate,
} from '../../_hooks'
import { formatCurrency } from '@/lib/utils'

interface TemplateItem {
  id: string
  name: string
  description: string | null
  denominations: number[]
  allowCustomAmount: boolean
  minAmountCents: number | null
  maxAmountCents: number | null
  validityDays: number | null
  isActive: boolean
  createdAt: Date
}

/**
 * Gift Card Templates Data Table Component
 *
 * Main component for displaying and managing gift card templates.
 * Shows table with name, denominations, validity, and status.
 *
 * @see Story 3.10 - Gift Cards (AC1, AC6)
 */
export function GiftCardTemplatesDataTable() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  const [search, setSearch] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<TemplateItem | null>(null)
  const [deletingTemplate, setDeletingTemplate] = useState<TemplateItem | null>(null)

  const { data, isLoading, error } = useGiftCardTemplateList({
    page,
    limit: 20,
    isActive: statusFilter === 'ALL' ? undefined : statusFilter === 'ACTIVE',
    search: search || undefined,
  })

  const deleteMutation = useDeleteGiftCardTemplate()
  const activateMutation = useActivateGiftCardTemplate()
  const deactivateMutation = useDeactivateGiftCardTemplate()

  const handleDelete = async () => {
    if (!deletingTemplate) return
    await deleteMutation.mutateAsync({ id: deletingTemplate.id })
    setDeletingTemplate(null)
  }

  const handleActivate = async (template: TemplateItem) => {
    await activateMutation.mutateAsync({ id: template.id })
  }

  const handleDeactivate = async (template: TemplateItem) => {
    await deactivateMutation.mutateAsync({ id: template.id })
  }

  const formatDenominations = (denominations: number[]) => {
    if (!denominations.length) return '-'
    const formatted = denominations.slice(0, 3).map((d) => formatCurrency(d, 'EUR'))
    if (denominations.length > 3) {
      return `${formatted.join(', ')} +${denominations.length - 3} more`
    }
    return formatted.join(', ')
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load templates</p>
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
              setStatusFilter(value as 'ALL' | 'ACTIVE' | 'INACTIVE')
              setPage(1)
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Search templates..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-[200px]"
          />
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Template
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
          <h3 className="text-lg font-semibold">No templates found</h3>
          <p className="text-muted-foreground mt-1">
            {statusFilter === 'ALL' && !search
              ? 'Create your first template to define gift card configurations.'
              : 'No templates match your filters.'}
          </p>
          <Button onClick={() => setShowCreateDialog(true)} className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        </div>
      ) : (
        <>
          <div className="border rounded-none">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Denominations</TableHead>
                  <TableHead>Custom Amount</TableHead>
                  <TableHead>Validity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{template.name}</div>
                        {template.description && (
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {template.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatDenominations(template.denominations)}
                    </TableCell>
                    <TableCell>
                      {template.allowCustomAmount ? (
                        <div className="text-sm">
                          <span className="text-green-600">Yes</span>
                          {template.minAmountCents && template.maxAmountCents && (
                            <div className="text-xs text-muted-foreground">
                              {formatCurrency(template.minAmountCents, 'EUR')} -{' '}
                              {formatCurrency(template.maxAmountCents, 'EUR')}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">No</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {template.validityDays ? (
                        <span className="text-sm">{template.validityDays} days</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">No expiry</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={template.isActive ? 'default' : 'secondary'}
                        className="font-mono text-xs uppercase"
                      >
                        {template.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingTemplate(template)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {template.isActive ? (
                            <DropdownMenuItem
                              onClick={() => handleDeactivate(template)}
                              disabled={deactivateMutation.isPending}
                            >
                              <PowerOff className="mr-2 h-4 w-4" />
                              Deactivate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => handleActivate(template)}
                              disabled={activateMutation.isPending}
                            >
                              <Power className="mr-2 h-4 w-4" />
                              Activate
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeletingTemplate(template)}
                            className="text-destructive"
                          >
                            <Trash className="mr-2 h-4 w-4" />
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

      {/* Create Template Dialog */}
      <CreateTemplateDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />

      {/* Edit Template Dialog */}
      {editingTemplate && (
        <EditTemplateDialog
          open={!!editingTemplate}
          onOpenChange={(open) => !open && setEditingTemplate(null)}
          template={editingTemplate}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingTemplate} onOpenChange={(open) => !open && setDeletingTemplate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the template &quot;{deletingTemplate?.name}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
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
