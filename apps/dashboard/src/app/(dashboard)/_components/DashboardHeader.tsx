'use client';

import { Menu, Bell, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useUIStore } from '@/stores/ui-store';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { SearchCommand } from '@/components/layout/SearchCommand';
import { useStoreSettings } from '../settings/store/_hooks/useStoreSettings';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function DashboardHeader() {
  const { toggleSidebar } = useUIStore();
  const { theme, setTheme } = useTheme();
  const { data: storeSettings } = useStoreSettings();

  const storeName = storeSettings?.name;

  return (
    <TooltipProvider delayDuration={100}>
      <header className="h-16 border-b border-border bg-background sticky top-0 z-30">
        <div className="h-full flex items-center justify-between px-4 lg:px-6">
          {/* Left side: Hamburger (mobile) + Store name / Breadcrumb */}
          <div className="flex items-center gap-4">
            {/* Mobile hamburger menu */}
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 -ml-2 text-foreground hover:bg-muted transition-colors duration-100"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>

            {/* Store name + Breadcrumb */}
            <div className="flex items-center gap-2">
              {storeName && (
                <>
                  <span className="font-bold text-sm uppercase tracking-wide text-foreground hidden md:inline">
                    {storeName}
                  </span>
                  <span className="text-muted-foreground hidden md:inline">/</span>
                </>
              )}
              <Breadcrumb className="hidden md:flex" />
            </div>
          </div>

          {/* Center: Search - Component ready but disabled pending future story */}
          {/* TODO: Enable SearchCommand in future search feature story */}
          <div className="flex-1 max-w-md mx-4 hidden md:block">
            {/* SearchCommand component is ready at @/components/layout/SearchCommand */}
          </div>

          {/* Right side: Notifications & Theme */}
          <div className="flex items-center gap-2 lg:gap-3">
            {/* Theme Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-100"
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="rounded-none">
                <span className="font-mono text-xs uppercase">
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </span>
              </TooltipContent>
            </Tooltip>

            {/* Notifications */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-100"
                  aria-label="Notifications"
                >
                  <Bell size={18} />
                  {/* Notification badge - show when there are unread notifications */}
                  {/* <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" /> */}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="rounded-none">
                <span className="font-mono text-xs uppercase">Notifications</span>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
}
