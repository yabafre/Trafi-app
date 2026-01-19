'use client'

/**
 * Inventory Section Component
 *
 * Inventory management for a single product variant.
 * Supports stock tracking, adjustments, settings, and history.
 * Digital Brutalism v2 design pattern with Green/Amber/Red status indicators.
 *
 * @see Story 3.7 - Inventory Tracking
 */

import { useState, useEffect } from 'react'
import {
  Package,
  Plus,
  Minus,
  Settings2,
  History,
  AlertTriangle,
  PackageX,
  PackageCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useAdjustInventory,
  useSetInventory,
  useUpdateInventorySettings,
  useVariantInventory,
  useInventoryHistory,
} from '../../_hooks'
import type { VariantResponse } from '@trafi/validators'
import type { InventoryAdjustmentReason } from '@trafi/validators'

interface InventorySectionProps {
  variant: VariantResponse
  productId: string
  canEdit: boolean
}

/**
 * Stock status indicator colors
 */
type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock'

function getStockStatus(
  quantity: number,
  threshold: number,
  trackInventory: boolean
): StockStatus {
  if (!trackInventory) return 'in_stock' // Always "in stock" when not tracking
  if (quantity <= 0) return 'out_of_stock'
  if (quantity <= threshold) return 'low_stock'
  return 'in_stock'
}

function getStockStatusColor(status: StockStatus): string {
  switch (status) {
    case 'in_stock':
      return 'bg-green-500'
    case 'low_stock':
      return 'bg-amber-500'
    case 'out_of_stock':
      return 'bg-red-500'
  }
}

function getStockStatusText(status: StockStatus): string {
  switch (status) {
    case 'in_stock':
      return 'IN STOCK'
    case 'low_stock':
      return 'LOW STOCK'
    case 'out_of_stock':
      return 'OUT OF STOCK'
  }
}

function getStockStatusIcon(status: StockStatus) {
  switch (status) {
    case 'in_stock':
      return PackageCheck
    case 'low_stock':
      return AlertTriangle
    case 'out_of_stock':
      return PackageX
  }
}

/**
 * Human-readable labels for adjustment reasons
 */
const ADJUSTMENT_REASON_LABELS: Record<InventoryAdjustmentReason, string> = {
  MANUAL_ADJUSTMENT: 'Manual Adjustment',
  ORDER_PLACED: 'Order Placed',
  ORDER_CANCELLED: 'Order Cancelled',
  ORDER_REFUNDED: 'Order Refunded',
  RECEIVED_STOCK: 'Received Stock',
  DAMAGED: 'Damaged',
  RETURNED: 'Returned',
  CORRECTION: 'Correction',
}

/**
 * Manual adjustment reasons (subset available for UI)
 */
const MANUAL_ADJUSTMENT_REASONS: InventoryAdjustmentReason[] = [
  'MANUAL_ADJUSTMENT',
  'RECEIVED_STOCK',
  'DAMAGED',
  'RETURNED',
  'CORRECTION',
]

export function InventorySection({ variant, productId, canEdit }: InventorySectionProps) {
  // Fetch current inventory data
  const { data: inventory, isLoading: inventoryLoading } = useVariantInventory(variant.id)

  // History pagination state
  const [historyLimit, setHistoryLimit] = useState(5)
  const { data: historyData, isLoading: historyLoading } = useInventoryHistory(variant.id, 1, historyLimit)

  // Mutations
  const { mutate: adjustInventory, isPending: isAdjusting } = useAdjustInventory()
  const { mutate: setInventory, isPending: isSetting } = useSetInventory()
  const { mutate: updateSettings, isPending: isUpdatingSettings } = useUpdateInventorySettings()

  // Local state for adjustment form
  const [adjustmentMode, setAdjustmentMode] = useState<'adjust' | 'set'>('adjust')
  const [quantityInput, setQuantityInput] = useState('')
  const [adjustmentReason, setAdjustmentReason] =
    useState<InventoryAdjustmentReason>('MANUAL_ADJUSTMENT')
  const [adjustmentNote, setAdjustmentNote] = useState('')

  // Local state for settings
  const [trackInventory, setTrackInventory] = useState(variant.trackInventory)
  const [lowStockThreshold, setLowStockThreshold] = useState(String(variant.lowStockThreshold ?? 5))
  const [allowOversell, setAllowOversell] = useState(variant.allowOversell ?? false)
  const [settingsChanged, setSettingsChanged] = useState(false)

  // Sync settings with variant data
  useEffect(() => {
    if (inventory) {
      setTrackInventory(inventory.trackInventory)
      setLowStockThreshold(String(inventory.lowStockThreshold))
      setAllowOversell(inventory.allowOversell)
      setSettingsChanged(false)
    }
  }, [inventory])

  // Track settings changes
  useEffect(() => {
    if (inventory) {
      const hasChanges =
        trackInventory !== inventory.trackInventory ||
        Number(lowStockThreshold) !== inventory.lowStockThreshold ||
        allowOversell !== inventory.allowOversell
      setSettingsChanged(hasChanges)
    }
  }, [trackInventory, lowStockThreshold, allowOversell, inventory])

  const handleAdjustInventory = () => {
    const change = parseInt(quantityInput, 10)
    if (isNaN(change) || change === 0) return

    if (adjustmentMode === 'adjust') {
      adjustInventory(
        {
          variantId: variant.id,
          quantityChange: change,
          reason: adjustmentReason,
          note: adjustmentNote || undefined,
        },
        {
          onSuccess: () => {
            setQuantityInput('')
            setAdjustmentNote('')
          },
        }
      )
    } else {
      if (change < 0) return // Can't set negative quantity
      setInventory(
        {
          variantId: variant.id,
          quantity: change,
          reason: adjustmentReason,
          note: adjustmentNote || undefined,
        },
        {
          onSuccess: () => {
            setQuantityInput('')
            setAdjustmentNote('')
          },
        }
      )
    }
  }

  const handleSaveSettings = () => {
    updateSettings({
      variantId: variant.id,
      trackInventory,
      lowStockThreshold: Number(lowStockThreshold),
      allowOversell,
    })
  }

  const handleResetSettings = () => {
    if (inventory) {
      setTrackInventory(inventory.trackInventory)
      setLowStockThreshold(String(inventory.lowStockThreshold))
      setAllowOversell(inventory.allowOversell)
    }
  }

  // Calculate stock status
  const currentQuantity = inventory?.quantity ?? variant.quantity
  const currentThreshold = inventory?.lowStockThreshold ?? variant.lowStockThreshold ?? 5
  const isTracking = inventory?.trackInventory ?? variant.trackInventory
  const stockStatus = getStockStatus(currentQuantity, currentThreshold, isTracking)
  const StatusIcon = getStockStatusIcon(stockStatus)

  const isPending = isAdjusting || isSetting || isUpdatingSettings

  return (
    <div className="border border-border">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-secondary/30">
        <div className="flex items-center gap-3">
          <Package className="size-5" />
          <div>
            <h3 className="font-mono text-sm uppercase tracking-wider">INVENTORY</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Stock levels and tracking</p>
          </div>
        </div>
        {/* Stock Status Badge */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 ${getStockStatusColor(stockStatus)} text-white`}
        >
          <StatusIcon className="size-4" />
          <span className="font-mono text-xs uppercase tracking-wider">
            {getStockStatusText(stockStatus)}
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Current Stock & Adjustment */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Stock Display */}
            <div className="p-4 bg-secondary/20 border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Current Stock
                  </p>
                  {inventoryLoading ? (
                    <Skeleton className="h-10 w-24 mt-1" />
                  ) : (
                    <p className="font-mono text-4xl font-bold">{currentQuantity}</p>
                  )}
                  {isTracking && currentThreshold > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Low stock alert at {currentThreshold} units
                    </p>
                  )}
                </div>
                {!isTracking && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Inventory tracking</p>
                    <p className="font-mono text-sm text-amber-500">DISABLED</p>
                  </div>
                )}
              </div>
            </div>

            {/* Adjustment Form */}
            {canEdit && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h4 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Adjust Stock
                  </h4>
                  {/* Mode Toggle */}
                  <div className="flex border border-border">
                    <button
                      type="button"
                      onClick={() => setAdjustmentMode('adjust')}
                      className={`px-3 py-1 text-xs font-mono uppercase ${
                        adjustmentMode === 'adjust'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary/30 hover:bg-secondary/50'
                      }`}
                    >
                      +/- Adjust
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustmentMode('set')}
                      className={`px-3 py-1 text-xs font-mono uppercase border-l border-border ${
                        adjustmentMode === 'set'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary/30 hover:bg-secondary/50'
                      }`}
                    >
                      Set
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Quantity Input */}
                  <div className="space-y-2">
                    <Label htmlFor="quantity" className="flex items-center gap-2">
                      {adjustmentMode === 'adjust' ? (
                        <>
                          <Plus className="size-4" />
                          <Minus className="size-4" />
                          Quantity Change
                        </>
                      ) : (
                        <>
                          <Package className="size-4" />
                          New Quantity
                        </>
                      )}
                    </Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={quantityInput}
                      onChange={(e) => setQuantityInput(e.target.value)}
                      disabled={isPending}
                      placeholder={adjustmentMode === 'adjust' ? '+10 or -5' : '100'}
                      className="font-mono"
                    />
                    {adjustmentMode === 'adjust' && quantityInput && (
                      <p className="text-xs text-muted-foreground">
                        New quantity:{' '}
                        <span className="font-mono font-bold">
                          {currentQuantity + (parseInt(quantityInput, 10) || 0)}
                        </span>
                      </p>
                    )}
                    {adjustmentMode === 'set' && parseInt(quantityInput, 10) < 0 && (
                      <p className="text-xs text-destructive">
                        Quantity must be 0 or greater
                      </p>
                    )}
                  </div>

                  {/* Reason Select */}
                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason</Label>
                    <Select
                      value={adjustmentReason}
                      onValueChange={(val) =>
                        setAdjustmentReason(val as InventoryAdjustmentReason)
                      }
                      disabled={isPending}
                    >
                      <SelectTrigger id="reason">
                        <SelectValue placeholder="Select reason" />
                      </SelectTrigger>
                      <SelectContent>
                        {MANUAL_ADJUSTMENT_REASONS.map((reason) => (
                          <SelectItem key={reason} value={reason}>
                            {ADJUSTMENT_REASON_LABELS[reason]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Note */}
                <div className="space-y-2">
                  <Label htmlFor="note">Note (optional)</Label>
                  <Textarea
                    id="note"
                    value={adjustmentNote}
                    onChange={(e) => setAdjustmentNote(e.target.value)}
                    disabled={isPending}
                    placeholder="Add a note about this adjustment..."
                    rows={2}
                    maxLength={500}
                  />
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleAdjustInventory}
                  disabled={
                    isPending ||
                    !quantityInput ||
                    (adjustmentMode === 'adjust' && parseInt(quantityInput, 10) === 0) ||
                    (adjustmentMode === 'set' && parseInt(quantityInput, 10) < 0)
                  }
                >
                  {isPending
                    ? 'Saving...'
                    : adjustmentMode === 'adjust'
                      ? 'Apply Adjustment'
                      : 'Set Quantity'}
                </Button>
              </div>
            )}
          </div>

          {/* Right Column: Settings & History */}
          <div className="space-y-6">
            {/* Settings */}
            <div className="border border-border">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-secondary/30">
                <div className="flex items-center gap-2">
                  <Settings2 className="size-4" />
                  <span className="font-mono text-xs uppercase tracking-wider">Settings</span>
                </div>
                {canEdit && settingsChanged && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={handleResetSettings}
                      disabled={isUpdatingSettings}
                    >
                      Reset
                    </Button>
                    <Button
                      size="sm"
                      className="h-6 text-xs"
                      onClick={handleSaveSettings}
                      disabled={isUpdatingSettings}
                    >
                      Save
                    </Button>
                  </div>
                )}
              </div>
              <div className="p-3 space-y-3">
                {/* Track Inventory */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="trackInventory" className="text-xs">
                    Track Inventory
                  </Label>
                  <Switch
                    id="trackInventory"
                    checked={trackInventory}
                    onCheckedChange={setTrackInventory}
                    disabled={!canEdit || isUpdatingSettings}
                  />
                </div>

                {/* Low Stock Threshold */}
                <div className="space-y-1">
                  <Label htmlFor="threshold" className="text-xs">
                    Low Stock Threshold
                  </Label>
                  <Input
                    id="threshold"
                    type="number"
                    min="0"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(e.target.value)}
                    disabled={!canEdit || isUpdatingSettings || !trackInventory}
                    className="h-8 text-sm font-mono"
                  />
                </div>

                {/* Allow Oversell */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="allowOversell" className="text-xs">
                      Allow Oversell
                    </Label>
                    <p className="text-[10px] text-muted-foreground">Sell when out of stock</p>
                  </div>
                  <Switch
                    id="allowOversell"
                    checked={allowOversell}
                    onCheckedChange={setAllowOversell}
                    disabled={!canEdit || isUpdatingSettings || !trackInventory}
                  />
                </div>
              </div>
            </div>

            {/* History */}
            <div className="border border-border">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-secondary/30">
                <History className="size-4" />
                <span className="font-mono text-xs uppercase tracking-wider">Recent History</span>
              </div>
              <div className="p-2">
                {historyLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12" />
                    ))}
                  </div>
                ) : historyData?.items && historyData.items.length > 0 ? (
                  <div className="space-y-1">
                    {historyData.items.map((item) => (
                      <div
                        key={item.id}
                        className="p-2 text-xs border-b border-border last:border-0"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-mono font-bold ${
                              item.quantityChange > 0 ? 'text-green-500' : 'text-red-500'
                            }`}
                          >
                            {item.quantityChange > 0 ? '+' : ''}
                            {item.quantityChange}
                          </span>
                          <span className="text-muted-foreground text-[10px]">
                            {new Date(item.createdAt).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-muted-foreground truncate">
                          {ADJUSTMENT_REASON_LABELS[item.reason as InventoryAdjustmentReason] ||
                            item.reason}
                        </p>
                        {item.note && (
                          <p className="text-muted-foreground/70 truncate italic">{item.note}</p>
                        )}
                      </div>
                    ))}
                    {/* Load more button */}
                    {historyData.hasMore && (
                      <button
                        type="button"
                        onClick={() => setHistoryLimit((prev) => prev + 5)}
                        className="w-full py-2 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-secondary/30 border-t border-border"
                      >
                        Load more ({historyData.total - historyData.items.length} remaining)
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-xs text-muted-foreground">No history yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function InventorySectionSkeleton() {
  return (
    <div className="border border-border">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Skeleton className="size-5" />
          <div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32 mt-1" />
          </div>
        </div>
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-28" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-32" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </div>
              <Skeleton className="h-16" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    </div>
  )
}
