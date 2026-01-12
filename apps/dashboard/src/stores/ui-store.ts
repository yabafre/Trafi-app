// UI Store - Zustand store for UI state only
// Install zustand when needed: pnpm add zustand
//
// Example usage:
// import { create } from 'zustand'
//
// interface UIState {
//   sidebarOpen: boolean
//   toggleSidebar: () => void
// }
//
// export const useUIStore = create<UIState>((set) => ({
//   sidebarOpen: true,
//   toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
// }))
//
// IMPORTANT: Never store server data in Zustand - use React Query (via Zsa) instead
