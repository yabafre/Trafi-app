'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPathLabel } from '@/config/navigation';

interface BreadcrumbProps {
  className?: string;
  storeName?: string;
}

interface BreadcrumbSegment {
  label: string;
  href: string;
  isLast: boolean;
}

/**
 * Hook to generate breadcrumb segments from current pathname
 */
export function useBreadcrumb(storeName?: string): BreadcrumbSegment[] {
  const pathname = usePathname();

  return useMemo(() => {
    // Remove leading slash and split into segments
    const segments = pathname.split('/').filter(Boolean);

    // Build breadcrumb items
    const breadcrumbs: BreadcrumbSegment[] = [];

    // Always start with Dashboard as root (if we're in dashboard context)
    if (segments[0] === 'dashboard' || segments.length === 0) {
      breadcrumbs.push({
        label: storeName || 'Dashboard',
        href: '/dashboard',
        isLast: segments.length <= 1,
      });
    }

    // Add remaining segments
    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;

      // Skip 'dashboard' as we've already added it as root
      if (segment === 'dashboard') return;

      const isLast = index === segments.length - 1;

      breadcrumbs.push({
        label: getPathLabel(segment),
        href: currentPath,
        isLast,
      });
    });

    return breadcrumbs;
  }, [pathname, storeName]);
}

/**
 * Breadcrumb Component
 * Displays navigation path with clickable segments
 * Styled with Digital Brutalism: font-mono uppercase text-xs
 */
export function Breadcrumb({ className, storeName }: BreadcrumbProps) {
  const breadcrumbs = useBreadcrumb(storeName);

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center gap-1', className)}
    >
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.href} className="flex items-center gap-1">
          {index > 0 && (
            <ChevronRight
              size={12}
              className="text-muted-foreground flex-shrink-0"
            />
          )}
          {crumb.isLast ? (
            <span
              className="font-mono text-xs uppercase tracking-wide text-foreground"
              aria-current="page"
            >
              {crumb.label}
            </span>
          ) : (
            <Link
              href={crumb.href}
              className={cn(
                'font-mono text-xs uppercase tracking-wide',
                'text-muted-foreground hover:text-foreground',
                'transition-colors duration-100'
              )}
            >
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
