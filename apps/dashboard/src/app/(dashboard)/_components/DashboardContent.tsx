'use client';

import { cn } from '@/lib/utils';

interface DashboardContentProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * DashboardContent Component
 * Wrapper for main content area with proper padding and mobile bottom nav spacing
 */
export function DashboardContent({ children, className }: DashboardContentProps) {
  return (
    <div
      className={cn(
        'flex-1 overflow-auto',
        // Add padding for mobile bottom navigation and standard page padding
        'pb-20 md:pb-0 p-8',
        className
      )}
    >
      {children}
    </div>
  );
}
