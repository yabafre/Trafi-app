'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * UI Store - Zustand store for UI state only
 *
 * IMPORTANT: Never store server data in Zustand - use React Query (via Zsa) instead
 *
 * State:
 * - sidebarOpen: Mobile drawer state (Sheet overlay)
 * - sidebarCollapsed: Desktop collapsed state (Rail only mode)
 *
 * Persistence: Only sidebarCollapsed is persisted to localStorage
 */

interface UIState {
  // Mobile drawer state (not persisted - closed by default)
  sidebarOpen: boolean;
  // Desktop collapsed state (persisted - user preference)
  sidebarCollapsed: boolean;

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: false,
      sidebarCollapsed: false,

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebarCollapsed: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    }),
    {
      name: 'trafi-ui-store',
      // Only persist the collapsed state (user preference)
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
    }
  )
);
