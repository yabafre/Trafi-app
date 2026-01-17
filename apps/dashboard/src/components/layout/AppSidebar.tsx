'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Settings as SettingsIcon,
  PanelLeftClose,
  PanelLeft,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigation, type NavItemWithActive } from '@/config/navigation';
import { useUIStore } from '@/stores/ui-store';
import { useAuth } from '@/lib/hooks/useAuth';
import { useStoreSettings } from '@/app/(dashboard)/settings/store/_hooks/useStoreSettings';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AppSidebarProps {
  className?: string;
  storeName?: string; // Optional override, defaults to store settings
}

/**
 * AppSidebar Component
 * Unified sidebar that handles both collapsed (64px) and expanded (240px) states
 * with smooth width transitions
 */
// ... imports

// Sub-component for the Toggle Button
function SidebarToggle({ collapsed, onClick }: { collapsed: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
    </button>
  );
}

export function AppSidebar({
  className,
  storeName: storeNameProp,
}: AppSidebarProps) {
  const navigation = useNavigation();
  const { sidebarCollapsed, toggleSidebarCollapsed } = useUIStore();
  const { user, logout, isLoading } = useAuth();
  const { data: storeSettings } = useStoreSettings();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Use prop override or fetch from store settings, fallback to default
  const storeName = storeNameProp ?? storeSettings?.name ?? 'My Store';

  // Derive user display info from auth
  const userName = user?.email?.split('@')[0] ?? 'User';
  const userInitials = user?.email?.[0]?.toUpperCase() ?? 'U';

  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const isExpanded = (id: string) => expandedItems.includes(id);

  return (
    <TooltipProvider delayDuration={100}>
      <aside
        className={cn(
          'hidden lg:flex h-screen sticky top-0 flex-col bg-sidebar border-r border-border',
          'transition-[width] duration-200 ease-out overflow-hidden',
          sidebarCollapsed ? 'w-16' : 'w-64',
          className
        )}
      >
        {/* Inner container to prevent content squishing */}
        <div
          className={cn(
            'flex flex-col h-full',
            sidebarCollapsed ? 'min-w-[64px]' : 'min-w-[256px]'
          )}
        >
          {/* Header - Logo + Collapse Button */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-border bg-sidebar">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="h-8 w-8 bg-foreground flex items-center justify-center flex-shrink-0">
                <span className="text-background font-bold text-lg">T</span>
              </div>
              {!sidebarCollapsed && (
                <span className="font-bold text-xl tracking-tighter text-foreground uppercase">
                  TRAFI
                </span>
              )}
            </div>
            {/* Collapse Button */}
            {!sidebarCollapsed && (
              <SidebarToggle collapsed={sidebarCollapsed} onClick={toggleSidebarCollapsed} />
            )}
          </div>
          
          {/* Collapsed Toggle (Centered when collapsed) */}
          {sidebarCollapsed && (
            <div className="flex justify-center py-4 border-b border-border">
               <SidebarToggle collapsed={sidebarCollapsed} onClick={toggleSidebarCollapsed} />
            </div>
          )}

          {/* ... Rest of the component ... */}

          {/* Navigation Section */}
          <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar">
            {/* Section Label */}
            {!sidebarCollapsed && (
              <div className="px-6 py-4 border-b border-border bg-sidebar-accent/5">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                  Navigation
                </span>
              </div>
            )}

            {/* Navigation Items */}
            <nav className="flex-1 px-0">
              {navigation.map((item) => (
                <NavItem
                  key={item.id}
                  item={item}
                  collapsed={sidebarCollapsed}
                  expanded={isExpanded(item.id)}
                  onToggleExpand={() => toggleExpanded(item.id)}
                />
              ))}
            </nav>

            {/* Status Widget (Only visible when expanded) */}
            {!sidebarCollapsed && (
              <div className="mt-auto border-t border-border">
                <div className="p-6 bg-sidebar-accent/5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-2 w-2 bg-success animate-pulse" />
                    <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">
                      Network Status
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-mono leading-relaxed uppercase">
                    SYNC ACTIVE
                    <br />
                    NODE: {storeName.toUpperCase().replace(/\s+/g, '-')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* User Section at Bottom */}
          <div className="border-t border-border bg-sidebar">
            <div
              className={cn(
                'flex items-center gap-3 p-4 hover:bg-sidebar-accent/5 transition-colors cursor-pointer',
                sidebarCollapsed ? 'justify-center p-2' : ''
              )}
            >
              {/* Avatar/Icon */}
              <div className="h-8 w-8 bg-muted flex items-center justify-center flex-shrink-0 text-xs font-bold text-foreground border border-border">
                {userInitials}
              </div>
              
              {/* User Details */}
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground uppercase tracking-wider truncate">
                    {userName}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono truncate">
                    {storeName}
                  </p>
                </div>
              )}
              
              {/* Settings Icon */}
              {!sidebarCollapsed && (
                <Link href="/settings">
                   <SettingsIcon size={16} className="text-muted-foreground hover:text-foreground transition-colors" />
                </Link>
              )}
            </div>

            {/* Sign Out (Collapsed: Icon only, Expanded: Full button at very bottom) */}
            {user && (
              <div className={cn("border-t border-border", sidebarCollapsed ? 'p-2' : '')}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={logout}
                      disabled={isLoading}
                      className={cn(
                        'w-full flex items-center gap-3 text-xs uppercase font-bold tracking-widest transition-colors duration-100',
                        sidebarCollapsed 
                          ? 'justify-center p-2 text-muted-foreground hover:text-destructive' 
                          : 'px-6 py-4 text-muted-foreground hover:bg-destructive hover:text-white justify-start',
                        isLoading && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <LogOut size={16} />
                      {!sidebarCollapsed && (
                        <span>
                          {isLoading ? '...' : 'Sign Out'}
                        </span>
                      )}
                    </button>
                  </TooltipTrigger>
                  {sidebarCollapsed && (
                    <TooltipContent side="right" className="rounded-none">
                      <span className="font-mono text-xs uppercase">Sign Out</span>
                    </TooltipContent>
                  )}
                </Tooltip>
              </div>
            )}
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}

interface NavItemProps {
  item: NavItemWithActive;
  collapsed: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
}

function NavItem({ item, collapsed, expanded, onToggleExpand }: NavItemProps) {
  const Icon = item.icon;
  const isActive = item.isActive || item.isChildActive;
  const hasChildren = item.children && item.children.length > 0;

  // Auto-expand if a child is active
  const shouldExpand = expanded || item.isChildActive;

  // Active styles: Invert colors (Bg Accent / Text Accent Foreground)
  const activeStyles = 'bg-sidebar-accent text-sidebar-accent-foreground';
  const inactiveStyles = 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground';

  if (collapsed) {
    // Collapsed mode - icon only with tooltip
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={item.href}
            className={cn(
              'relative h-10 w-full flex items-center justify-center',
              'transition-colors duration-100',
              isActive ? activeStyles : inactiveStyles
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon size={18} />
            {item.isChildActive && (
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary rounded-full" />
            )}
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" className="rounded-none">
          <span className="font-mono text-xs uppercase">{item.label}</span>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Expanded mode
  if (hasChildren) {
    return (
      <div className="border-b border-border last:border-0">
        <button
          onClick={onToggleExpand}
          className={cn(
            'w-full flex items-center justify-between px-6 py-3', // Reduced padding
            'transition-colors duration-100 text-xs font-bold uppercase tracking-widest',
            isActive ? activeStyles : inactiveStyles
          )}
        >
          <div className="flex items-center gap-4">
            <Icon size={18} />
            <span>{item.label}</span>
          </div>
          {shouldExpand ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {/* Children */}
        {shouldExpand && (
          <div className="bg-background">
            {item.children?.map((child) => {
              const ChildIcon = child.icon;
              return (
                <Link
                  key={child.id}
                  href={child.href}
                  className={cn(
                    'flex items-center gap-3 px-6 py-2 pl-12', // Indented
                    'transition-colors duration-100 text-[10px] font-bold uppercase tracking-widest',
                    child.isActive 
                      ? 'text-primary' // Active child text color
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  aria-current={child.isActive ? 'page' : undefined}
                >
                  <ChildIcon size={14} />
                  <span>{child.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        'w-full flex items-center gap-4 px-6 py-3 border-b border-border', // Reduced padding
        'transition-colors duration-100 text-xs font-bold uppercase tracking-widest',
        isActive ? activeStyles : inactiveStyles
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon size={18} />
      <span>{item.label}</span>
    </Link>
  );
}
