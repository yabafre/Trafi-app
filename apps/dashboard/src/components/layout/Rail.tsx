'use client';

import Link from 'next/link';
import { PanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigation, type NavItemWithActive } from '@/config/navigation';
import { useUIStore } from '@/stores/ui-store';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface RailProps {
  className?: string;
}

/**
 * Rail Component
 * 64px fixed-width vertical bar with icon-only navigation
 * Shows active state with left border accent (#CCFF00)
 * Includes collapse/expand toggle at bottom
 */
export function Rail({ className }: RailProps) {
  const navigation = useNavigation();
  const { sidebarCollapsed, toggleSidebarCollapsed } = useUIStore();

  return (
    <TooltipProvider delayDuration={100}>
      <aside
        className={cn(
          'hidden lg:flex w-16 h-screen sticky top-0 flex-col bg-background border-r border-border',
          className
        )}
      >
        {/* Expand Toggle - At top for easy access */}
        <div className="border-b border-border p-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleSidebarCollapsed}
                className={cn(
                  'w-full h-12 flex items-center justify-center',
                  'text-primary hover:text-foreground hover:bg-primary/20',
                  'border border-primary/50 hover:border-primary',
                  'transition-colors duration-100'
                )}
                aria-label="Expand sidebar"
              >
                <PanelLeft size={20} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="rounded-none">
              <span className="font-mono text-xs uppercase">Expand</span>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Navigation Icons */}
        <nav className="flex-1 flex flex-col py-4">
          {navigation.map((item) => (
            <RailItem key={item.id} item={item} />
          ))}
        </nav>
      </aside>
    </TooltipProvider>
  );
}

interface RailItemProps {
  item: NavItemWithActive;
}

function RailItem({ item }: RailItemProps) {
  const Icon = item.icon;
  const isActive = item.isActive || item.isChildActive;

  // If item has children, show a popover with child navigation
  if (item.children && item.children.length > 0) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button
            className={cn(
              'relative h-12 w-full flex items-center justify-center',
              'transition-colors duration-100',
              isActive
                ? 'text-primary border-l-2 border-primary bg-muted/50'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
            aria-label={item.label}
          >
            <Icon size={20} />
          </button>
        </PopoverTrigger>
        <PopoverContent
          side="right"
          align="start"
          className="rounded-none w-48 p-0 border-border"
        >
          <div className="py-2">
            <Link
              href={item.href}
              className={cn(
                'block px-4 py-2 font-mono text-xs uppercase',
                'transition-colors duration-100',
                item.isActive
                  ? 'text-primary bg-muted/50'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {item.label}
            </Link>
            <div className="border-t border-border my-1" />
            {item.children.map((child) => {
              const ChildIcon = child.icon;
              return (
                <Link
                  key={child.id}
                  href={child.href}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 font-mono text-xs uppercase',
                    'transition-colors duration-100',
                    child.isActive
                      ? 'text-primary bg-muted/50'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  <ChildIcon size={14} />
                  {child.label}
                </Link>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={item.href}
          className={cn(
            'relative h-12 flex items-center justify-center',
            'transition-colors duration-100',
            isActive
              ? 'text-primary border-l-2 border-primary bg-muted/50'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
          aria-current={isActive ? 'page' : undefined}
        >
          <Icon size={20} />
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right" className="rounded-none">
        <span className="font-mono text-xs uppercase">{item.label}</span>
      </TooltipContent>
    </Tooltip>
  );
}
