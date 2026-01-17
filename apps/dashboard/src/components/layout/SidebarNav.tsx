'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigation, type NavItemWithActive } from '@/config/navigation';

interface SidebarNavProps {
  className?: string;
  onNavigate?: () => void;
}

/**
 * SidebarNav Component
 * Navigation items with text labels and expandable sub-navigation
 */
export function SidebarNav({ className, onNavigate }: SidebarNavProps) {
  const navigation = useNavigation();

  return (
    <nav className={cn('flex-1 py-2', className)}>
      {navigation.map((item) => (
        <SidebarNavItem key={item.id} item={item} onNavigate={onNavigate} />
      ))}
    </nav>
  );
}

interface SidebarNavItemProps {
  item: NavItemWithActive;
  onNavigate?: () => void;
}

function SidebarNavItem({ item, onNavigate }: SidebarNavItemProps) {
  const [isExpanded, setIsExpanded] = useState(
    item.isActive || item.isChildActive
  );
  const Icon = item.icon;
  const hasChildren = item.children && item.children.length > 0;
  const isActive = item.isActive;
  const isChildActive = item.isChildActive;

  const handleClick = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    } else {
      onNavigate?.();
    }
  };

  // For items with children, we render a button that toggles expansion
  // For items without children, we render a link
  if (hasChildren) {
    return (
      <div className="border-b border-border">
        <button
          onClick={handleClick}
          className={cn(
            'w-full flex items-center justify-between px-6 py-4',
            'text-xs font-bold uppercase tracking-widest',
            'transition-colors duration-100',
            isActive || isChildActive
              ? 'bg-muted text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <div className="flex items-center gap-4">
            <Icon size={18} />
            <span>{item.label}</span>
          </div>
          {isExpanded ? (
            <ChevronDown size={14} />
          ) : (
            <ChevronRight size={14} />
          )}
        </button>

        {/* Sub-navigation */}
        {isExpanded && item.children && (
          <div className="bg-background/50">
            {item.children.map((child) => (
              <SidebarNavChildItem
                key={child.id}
                item={child}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-4 px-6 py-4 border-b border-border',
        'text-xs font-bold uppercase tracking-widest',
        'transition-colors duration-100',
        isActive
          ? 'bg-muted text-primary border-l-2 border-l-primary'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      <Icon size={18} />
      <span>{item.label}</span>
    </Link>
  );
}

interface SidebarNavChildItemProps {
  item: NavItemWithActive;
  onNavigate?: () => void;
}

function SidebarNavChildItem({ item, onNavigate }: SidebarNavChildItemProps) {
  const Icon = item.icon;
  const isActive = item.isActive;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-4 pl-14 pr-6 py-3',
        'text-xs font-bold uppercase tracking-widest',
        'transition-colors duration-100',
        isActive
          ? 'text-primary bg-muted/50 border-l-2 border-l-primary'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
      )}
    >
      <Icon size={16} />
      <span>{item.label}</span>
    </Link>
  );
}
