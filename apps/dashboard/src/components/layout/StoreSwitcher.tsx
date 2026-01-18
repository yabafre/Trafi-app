'use client'

import { Store, ChevronDown, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMyStores, useSwitchStore } from '@/lib/hooks'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface StoreSwitcherProps {
  /** Whether the sidebar is in collapsed state */
  collapsed?: boolean
  /** Additional class names */
  className?: string
}

/**
 * StoreSwitcher Component
 *
 * Displays current store and allows switching between stores.
 * Follows Digital Brutalism v2 design system.
 *
 * - Collapsed mode: Icon button with tooltip
 * - Expanded mode: Full dropdown with store name
 * - Single store: No dropdown, just display
 *
 * @see Story 2-R2 - Store Switching UI
 */
export function StoreSwitcher({ collapsed = false, className }: StoreSwitcherProps) {
  const { stores, currentStore, hasMultipleStores, isLoading: isLoadingStores } = useMyStores()
  const { switchStore, isLoading: isSwitching, error } = useSwitchStore()

  const handleStoreSelect = async (storeId: string) => {
    if (storeId === currentStore?.id) return // Already on this store

    try {
      await switchStore(storeId)
    } catch {
      // Error is handled by useSwitchStore hook
    }
  }

  // Loading state
  if (isLoadingStores) {
    return (
      <div
        className={cn(
          'flex items-center gap-3',
          collapsed ? 'justify-center' : 'px-4',
          className
        )}
      >
        <div className="h-8 w-8 bg-muted flex items-center justify-center">
          <Loader2 size={16} className="animate-spin text-muted-foreground" />
        </div>
        {!collapsed && (
          <span className="text-xs text-muted-foreground uppercase tracking-widest">
            Loading...
          </span>
        )}
      </div>
    )
  }

  // Collapsed mode with tooltip
  if (collapsed) {
    // Single store - just show icon with tooltip
    if (!hasMultipleStores) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'h-10 w-full flex items-center justify-center',
                'text-muted-foreground',
                className
              )}
            >
              <Store size={18} />
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="rounded-none">
            <span className="font-mono text-xs uppercase">
              {currentStore?.name ?? 'No Store'} ({currentStore?.role})
            </span>
          </TooltipContent>
        </Tooltip>
      )
    }

    // Multiple stores - show popover trigger
    return (
      <Popover>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  'h-10 w-full flex items-center justify-center',
                  'text-muted-foreground hover:text-foreground hover:bg-muted',
                  'transition-colors duration-100',
                  isSwitching && 'opacity-50 cursor-not-allowed',
                  className
                )}
                disabled={isSwitching}
              >
                {isSwitching ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Store size={18} />
                )}
              </button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="right" className="rounded-none">
            <span className="font-mono text-xs uppercase">Switch Store</span>
          </TooltipContent>
        </Tooltip>
        <PopoverContent
          side="right"
          align="start"
          className="w-64 p-0 rounded-none border-border bg-popover"
        >
          <StoreList
            stores={stores}
            currentStoreId={currentStore?.id ?? null}
            onSelect={handleStoreSelect}
            isSwitching={isSwitching}
          />
        </PopoverContent>
      </Popover>
    )
  }

  // Expanded mode - single store (no dropdown)
  if (!hasMultipleStores) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-3',
          className
        )}
      >
        <div className="h-8 w-8 bg-foreground flex items-center justify-center flex-shrink-0">
          <Store size={16} className="text-background" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-bold uppercase tracking-widest text-foreground truncate block">
            {currentStore?.name ?? 'No Store'}
          </span>
          <span className="text-[10px] text-muted-foreground font-mono uppercase">
            {currentStore?.role}
          </span>
        </div>
      </div>
    )
  }

  // Expanded mode - multiple stores (dropdown)
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'w-full flex items-center gap-3 px-4 py-3',
            'hover:bg-muted transition-colors duration-100',
            isSwitching && 'opacity-50 cursor-not-allowed',
            className
          )}
          disabled={isSwitching}
        >
          <div className="h-8 w-8 bg-foreground flex items-center justify-center flex-shrink-0">
            {isSwitching ? (
              <Loader2 size={16} className="text-background animate-spin" />
            ) : (
              <Store size={16} className="text-background" />
            )}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <span className="text-xs font-bold uppercase tracking-widest text-foreground truncate block">
              {currentStore?.name ?? 'Select Store'}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono uppercase">
              {currentStore?.role}
            </span>
          </div>
          <ChevronDown
            size={14}
            className="text-muted-foreground flex-shrink-0"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-0 rounded-none border-border bg-popover"
      >
        <StoreList
          stores={stores}
          currentStoreId={currentStore?.id ?? null}
          onSelect={handleStoreSelect}
          isSwitching={isSwitching}
        />
      </PopoverContent>
    </Popover>
  )
}

/**
 * Store list dropdown content
 */
interface StoreListProps {
  stores: Array<{
    id: string
    name: string
    slug: string
    role: string
    isCurrent: boolean
  }>
  currentStoreId: string | null
  onSelect: (storeId: string) => void
  isSwitching: boolean
}

function StoreList({ stores, currentStoreId, onSelect, isSwitching }: StoreListProps) {
  return (
    <div className="py-1">
      {/* Header */}
      <div className="px-4 py-2 border-b border-border">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          Your Stores
        </span>
      </div>

      {/* Store items */}
      <div className="py-1">
        {stores.map((store) => {
          const isActive = store.id === currentStoreId

          return (
            <button
              key={store.id}
              onClick={() => onSelect(store.id)}
              disabled={isSwitching || isActive}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2',
                'transition-colors duration-100',
                isActive
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                (isSwitching || isActive) && 'cursor-default'
              )}
            >
              {/* Check indicator */}
              <div className="w-4 flex items-center justify-center flex-shrink-0">
                {isActive && <Check size={14} className="text-primary" />}
              </div>

              {/* Store info */}
              <div className="flex-1 min-w-0 text-left">
                <span className="text-xs font-bold uppercase tracking-widest truncate block">
                  {store.name}
                </span>
              </div>

              {/* Role badge */}
              <span className="text-[10px] font-mono text-muted-foreground uppercase flex-shrink-0">
                {store.role}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
