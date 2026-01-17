'use client';

import { cn } from '@/lib/utils';
import { AppSidebar } from './AppSidebar';
import { MobileNav } from './MobileNav';

interface DashboardShellProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  storeName?: string;
  className?: string;
}

/**
 * DashboardShell Component
 * Main layout wrapper that composes AppSidebar + Main content areas
 *
 * RETRO-5: Uses composition pattern for wrappable components
 * - sidebar: Custom AppSidebar component (defaults to AppSidebar)
 *
 * Layout Behavior:
 * - Desktop Expanded: Sidebar (240px with icons + labels) + Main
 * - Desktop Collapsed: Rail (64px with icons only) + Main
 * - Tablet (md): Main only + Hamburger in header
 * - Mobile (sm): Main + Bottom nav + Drawer
 *
 * The AppSidebar handles both collapsed and expanded states with smooth transitions
 */
export function DashboardShell({
  children,
  sidebar,
  storeName,
  className,
}: DashboardShellProps) {
  return (
    <div className={cn('flex min-h-screen bg-background', className)}>
      {/* Unified Sidebar - handles both collapsed and expanded states */}
      {sidebar ?? <AppSidebar storeName={storeName} />}

      {/* Main content area */}
      <main className="flex-1 flex flex-col min-w-0">{children}</main>

      {/* Mobile Navigation - Bottom nav + Drawer (hidden on desktop) */}
      <MobileNav storeName={storeName} />
    </div>
  );
}
