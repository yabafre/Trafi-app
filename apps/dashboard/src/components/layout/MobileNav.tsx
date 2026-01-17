'use client';

import Link from 'next/link';
import { Home, Package, ShoppingCart, Users, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui-store';
import { useNavigation } from '@/config/navigation';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { SidebarHeader } from './SidebarHeader';
import { SidebarNav } from './SidebarNav';

interface MobileNavProps {
  storeName?: string;
}

// Bottom navigation items (main 5 sections)
const bottomNavItems = [
  { id: 'dashboard', label: 'Home', href: '/dashboard', icon: Home },
  { id: 'products', label: 'Products', href: '/products', icon: Package },
  { id: 'orders', label: 'Orders', href: '/orders', icon: ShoppingCart },
  { id: 'customers', label: 'Customers', href: '/customers', icon: Users },
  { id: 'settings', label: 'Settings', href: '/settings', icon: Settings },
];

/**
 * MobileNav Component
 * Bottom navigation bar for mobile + full-height drawer menu
 *
 * Visibility:
 * - Bottom nav: visible on mobile (< 768px), hidden on tablet+
 * - Drawer: triggered by hamburger in header or by sidebarOpen state
 */
export function MobileNav({ storeName }: MobileNavProps) {
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const navigation = useNavigation();

  const handleNavigate = () => {
    setSidebarOpen(false);
  };

  return (
    <>
      {/* Bottom Navigation Bar - Mobile only */}
      <nav
        className={cn(
          'fixed bottom-0 left-0 right-0 z-40',
          'bg-background border-t border-border',
          'md:hidden', // Hide on tablet and up
          'safe-area-bottom'
        )}
      >
        <div className="flex items-center justify-around h-16">
          {bottomNavItems.map((item) => {
            const navItem = navigation.find((n) => n.id === item.id);
            const isActive = navItem?.isActive || navItem?.isChildActive;
            const Icon = item.icon;

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 flex-1 h-full',
                  'transition-colors duration-100',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground active:text-foreground'
                )}
              >
                <Icon size={20} />
                <span className="text-[10px] font-bold uppercase tracking-wide">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile Drawer - Full navigation menu */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent
          side="left"
          className="p-0 w-72 border-r border-border rounded-none"
        >
          <SheetHeader className="p-0 border-b border-border">
            <SheetTitle asChild>
              <SidebarHeader storeName={storeName} className="border-none" />
            </SheetTitle>
          </SheetHeader>

          <SidebarNav onNavigate={handleNavigate} />
        </SheetContent>
      </Sheet>
    </>
  );
}
