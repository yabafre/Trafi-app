'use client';

import {
  Home,
  Package,
  ShoppingCart,
  Users,
  Settings,
  Store,
  Key,
  UserCog,
  ArrowLeftRight,
  type LucideIcon,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

/**
 * Navigation Item Type
 * Represents a single navigation item with optional children for sub-navigation
 */
export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  children?: NavItem[];
}

/**
 * Main navigation configuration
 * Defines the structure of the dashboard navigation
 */
export const navigationConfig: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    id: 'products',
    label: 'Products',
    href: '/products',
    icon: Package,
  },
  {
    id: 'orders',
    label: 'Orders',
    href: '/orders',
    icon: ShoppingCart,
  },
  {
    id: 'customers',
    label: 'Customers',
    href: '/customers',
    icon: Users,
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    children: [
      {
        id: 'settings-store',
        label: 'Store',
        href: '/settings/store',
        icon: Store,
      },
      {
        id: 'settings-users',
        label: 'Users',
        href: '/settings/users',
        icon: UserCog,
      },
      {
        id: 'settings-api-keys',
        label: 'API Keys',
        href: '/settings/api-keys',
        icon: Key,
      },
      {
        id: 'settings-ownership',
        label: 'Ownership',
        href: '/settings/ownership',
        icon: ArrowLeftRight,
      },
    ],
  },
];

/**
 * Navigation item with active state
 */
export interface NavItemWithActive extends NavItem {
  isActive: boolean;
  isChildActive: boolean;
  children?: NavItemWithActive[];
}

/**
 * Hook to get navigation config with active states based on current pathname
 * @returns Navigation items with isActive and isChildActive flags
 */
export function useNavigation(): NavItemWithActive[] {
  const pathname = usePathname();

  return useMemo(() => {
    const processItem = (item: NavItem): NavItemWithActive => {
      // Check if this item's href matches the current pathname
      const isActive =
        pathname === item.href || pathname.startsWith(`${item.href}/`);

      // Process children if they exist
      const children = item.children?.map(processItem);

      // Check if any child is active
      const isChildActive = children?.some((child) => child.isActive) ?? false;

      return {
        ...item,
        isActive: isActive && !isChildActive, // Only mark parent active if no child is active
        isChildActive,
        children,
      };
    };

    return navigationConfig.map(processItem);
  }, [pathname]);
}

/**
 * Get breadcrumb label for a path segment
 * Maps URL slugs to human-readable labels
 */
export function getPathLabel(segment: string): string {
  const labels: Record<string, string> = {
    dashboard: 'Dashboard',
    products: 'Products',
    orders: 'Orders',
    customers: 'Customers',
    settings: 'Settings',
    store: 'Store',
    users: 'Users',
    'api-keys': 'API Keys',
    ownership: 'Ownership',
  };

  return labels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
}
