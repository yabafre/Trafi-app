'use client';

import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui-store';
import { SidebarHeader } from './SidebarHeader';
import { SidebarNav } from './SidebarNav';

interface SidebarProps {
  className?: string;
  children?: React.ReactNode;
  header?: React.ReactNode;
  storeName?: string;
  onNavigate?: () => void;
}

/**
 * Sidebar Component
 * 240px collapsible sidebar with text labels and sub-navigation
 *
 * RETRO-4: Accepts customization props for @trafi/core consumers
 * - header: Custom header component (defaults to SidebarHeader)
 * - children: Custom navigation (defaults to SidebarNav)
 */
export function Sidebar({
  className,
  children,
  header,
  storeName,
  onNavigate,
}: SidebarProps) {
  const { sidebarCollapsed } = useUIStore();

  return (
    <aside
      className={cn(
        'hidden lg:flex h-screen sticky top-0 flex-col bg-background border-r border-border',
        'transition-[width] duration-200 ease-out overflow-hidden',
        sidebarCollapsed ? 'w-0' : 'w-60',
        className
      )}
    >
      <div className="flex flex-col h-full min-w-[240px]">
        {/* Header - Store name */}
        {header ?? <SidebarHeader storeName={storeName} />}

        {/* Navigation */}
        {children ?? <SidebarNav onNavigate={onNavigate} />}
      </div>
    </aside>
  );
}
