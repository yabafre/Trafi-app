'use client';

import { Store, PanelLeftClose, PanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui-store';

interface SidebarHeaderProps {
  storeName?: string;
  className?: string;
  showCollapseButton?: boolean;
}

/**
 * SidebarHeader Component
 * Displays the store name at the top of the sidebar
 * Updates in real-time when store settings change
 * Includes optional collapse button
 */
export function SidebarHeader({
  storeName,
  className,
  showCollapseButton = true,
}: SidebarHeaderProps) {
  const { sidebarCollapsed, toggleSidebarCollapsed } = useUIStore();

  return (
    <div
      className={cn(
        'h-16 flex items-center justify-between px-4 border-b border-border bg-muted/30',
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-8 w-8 bg-foreground flex items-center justify-center flex-shrink-0">
          <Store size={16} className="text-background" />
        </div>
        <span className="font-bold text-sm uppercase tracking-wide text-foreground truncate">
          {storeName || 'My Store'}
        </span>
      </div>

      {showCollapseButton && (
        <button
          onClick={toggleSidebarCollapsed}
          className={cn(
            'p-2 -mr-2',
            'text-muted-foreground hover:text-foreground hover:bg-muted',
            'transition-colors duration-100'
          )}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? (
            <PanelLeft size={18} />
          ) : (
            <PanelLeftClose size={18} />
          )}
        </button>
      )}
    </div>
  );
}
