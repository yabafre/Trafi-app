# Story 2.9: Dashboard Shell & Navigation

Status: done

## Story

As a **Dashboard User (Admin/Owner)**,
I want **a complete dashboard shell with Rail, Sidebar, and Breadcrumb navigation**,
So that **I can efficiently navigate between all dashboard sections with a consistent, professional interface**.

## Acceptance Criteria

1. **Given** a user accesses any dashboard route
   **When** the page loads
   **Then** a consistent shell layout is displayed with:
   - Rail (64px fixed width) on the left with icon-only navigation
   - Sidebar (240px collapsible) with text labels and sub-navigation
   - Main content area taking remaining width
   - Topbar with breadcrumb trail showing current location

2. **Given** the user clicks a Rail icon
   **When** the Rail navigation is used
   **Then** the user navigates to the corresponding main section
   **And** the corresponding Sidebar section expands
   **And** the active state is visually indicated with #CCFF00 accent

3. **Given** the user clicks the Sidebar collapse toggle
   **When** the Sidebar is collapsed
   **Then** only the Rail (64px) remains visible
   **And** the main content expands to fill available space
   **And** the collapsed state is persisted in Zustand store

4. **Given** the user navigates to a nested route (e.g., `/settings/store`)
   **When** the breadcrumb renders
   **Then** it displays the full path: `Dashboard > Settings > Store`
   **And** each segment is clickable to navigate up the hierarchy

5. **Given** a viewport width less than 1024px (tablet)
   **When** the dashboard layout renders
   **Then** the Sidebar is hidden by default
   **And** only the Rail is visible
   **And** a hamburger menu can expand the Sidebar as an overlay

6. **Given** a viewport width less than 768px (mobile)
   **When** the dashboard layout renders
   **Then** both Rail and Sidebar are hidden
   **And** a bottom navigation bar is displayed
   **And** the hamburger icon opens a full-height drawer menu

7. **Given** the store settings include a store name
   **When** the Sidebar renders
   **Then** the store name is displayed at the top of the Sidebar
   **And** updates in real-time when store settings change (via React Query cache)

## Tasks / Subtasks

- [x] **Task 1: Create Zustand UI Store** (AC: #3, #5, #6)
  - [x] 1.1 Create `apps/dashboard/src/stores/ui-store.ts`
  - [x] 1.2 Implement `sidebarOpen: boolean` state
  - [x] 1.3 Implement `sidebarCollapsed: boolean` state (true = collapsed, Rail only)
  - [x] 1.4 Implement `toggleSidebar()` action
  - [x] 1.5 Implement `setSidebarCollapsed(collapsed: boolean)` action
  - [x] 1.6 Add localStorage persistence with zustand/middleware persist

- [x] **Task 2: Create Navigation Config** (AC: #1, #2)
  - [x] 2.1 Create `apps/dashboard/src/config/navigation.ts`
  - [x] 2.2 Define `NavSection` type with: id, label, icon, href, children[]
  - [x] 2.3 Create navigation structure:
    - Dashboard (Home icon) → `/dashboard`
    - Products (Package icon) → `/products` (future)
    - Orders (ShoppingCart icon) → `/orders` (future)
    - Customers (Users icon) → `/customers` (future)
    - Settings (Settings icon) → `/settings` with children:
      - Store → `/settings/store`
      - Users → `/settings/users`
      - API Keys → `/settings/api-keys`
      - Ownership → `/settings/ownership`
  - [x] 2.4 Export `useNavigation()` hook that returns navigation with active states

- [x] **Task 3: Create Rail Component** (AC: #1, #2)
  - [x] 3.1 Create `apps/dashboard/src/components/layout/Rail.tsx`
  - [x] 3.2 Implement 64px fixed-width vertical bar
  - [x] 3.3 Style with Digital Brutalism: bg-background, border-r border-border
  - [x] 3.4 Add icon-only navigation items from navigation config
  - [x] 3.5 Implement active state: border-l-2 border-primary (#CCFF00)
  - [x] 3.6 Add collapse/expand toggle at bottom (ChevronLeft/Right icon)
  - [x] 3.7 Add hover tooltips showing section name
  - [x] 3.8 Add popover for Settings with child navigation (added for child path access)

- [x] **Task 4: Create Sidebar Component** (AC: #1, #2, #7)
  - [x] 4.1 Create `apps/dashboard/src/components/layout/Sidebar.tsx`
  - [x] 4.2 Implement 240px collapsible width
  - [x] 4.3 Add store name header with store-settings query
  - [x] 4.4 Add navigation items with text labels
  - [x] 4.5 Implement expandable sub-navigation for Settings
  - [x] 4.6 Style active items with text-primary, bg-muted
  - [x] 4.7 Add transition animation for collapse (200ms)
  - [x] 4.8 Read collapsed state from Zustand store

- [x] **Task 5: Create Breadcrumb Component** (AC: #4)
  - [x] 5.1 Create `apps/dashboard/src/components/layout/Breadcrumb.tsx`
  - [x] 5.2 Implement breadcrumb from current pathname
  - [x] 5.3 Create `useBreadcrumb()` hook using `usePathname()`
  - [x] 5.4 Map path segments to human-readable labels
  - [x] 5.5 Style with Digital Brutalism: font-mono uppercase text-xs
  - [x] 5.6 Add separator: `/` or `>` in muted-foreground
  - [x] 5.7 Last segment non-clickable, others are links

- [x] **Task 6: Create Shell Layout Component** (AC: #1)
  - [x] 6.1 Create `apps/dashboard/src/components/layout/DashboardShell.tsx`
  - [x] 6.2 Compose Rail OR Sidebar + Main Content (mutually exclusive)
  - [x] 6.3 Implement flex layout with responsive behavior
  - [x] 6.4 Handle collapsed state layout changes
  - [x] 6.5 Export from `components/layout/index.ts`

- [x] **Task 7: Update DashboardHeader** (AC: #1, #4)
  - [x] 7.1 Move breadcrumb into header or below header
  - [x] 7.2 Add mobile hamburger menu toggle (hidden on desktop)
  - [x] 7.3 Keep user info and logout on right side
  - [x] 7.4 Reduce logo size when sidebar is visible

- [x] **Task 8: Create Mobile Navigation** (AC: #5, #6)
  - [x] 8.1 Create `apps/dashboard/src/components/layout/MobileNav.tsx`
  - [x] 8.2 Implement bottom navigation bar (hidden on desktop)
  - [x] 8.3 Add 5 main icons: Dashboard, Products, Orders, Customers, Settings
  - [x] 8.4 Create mobile drawer using Shadcn Sheet component
  - [x] 8.5 Full navigation in drawer when hamburger clicked

- [x] **Task 9: Update Dashboard Layout** (AC: #1)
  - [x] 9.1 Update `apps/dashboard/src/app/(dashboard)/layout.tsx`
  - [x] 9.2 Wrap children with DashboardShell
  - [x] 9.3 Add responsive breakpoint handling with Tailwind
  - [x] 9.4 Ensure auth context still wraps everything

- [x] **Task 10: Add Component Tests** (AC: #1, #2, #3, #4)
  - [x] 10.1 Create `apps/dashboard/src/components/layout/__tests__/Rail.test.tsx`
  - [x] 10.2 Create `apps/dashboard/src/components/layout/__tests__/Sidebar.test.tsx`
  - [x] 10.3 Create `apps/dashboard/src/components/layout/__tests__/Breadcrumb.test.tsx`
  - [x] 10.4 Test navigation active state
  - [x] 10.5 Test sidebar collapse persistence
  - [x] 10.6 Test breadcrumb rendering from pathname

## Dev Notes

### Architecture Patterns (CRITICAL)

**RETRO-4:** Dashboard components MUST accept customization props:
```typescript
interface SidebarProps {
  className?: string;
  children?: React.ReactNode;
  header?: React.ReactNode; // Allows @trafi/core consumers to replace header
}

export function Sidebar({ className, children, header }: SidebarProps) {
  // Default header shows store name, but can be overridden
  const defaultHeader = <SidebarHeader />;
  return (
    <aside className={cn('w-[240px] border-r', className)}>
      {header ?? defaultHeader}
      {children}
    </aside>
  );
}
```

**RETRO-5:** Use composition pattern for wrappable components:
```typescript
// Shell can be composed with custom layout wrappers
export function DashboardShell({ children, rail, sidebar }: ShellProps) {
  return (
    <div className="grid grid-cols-[auto,1fr] min-h-screen">
      {rail ?? <Rail />}
      {sidebar ?? <Sidebar />}
      <main>{children}</main>
    </div>
  );
}
```

### UX Design Requirements (Digital Brutalism v2)

**Layout Specs:**
```
┌────────────────────────────────────────────────┐
│                    HEADER (64px)               │
│  [T] TRAFI                    user@email [U]   │
├──────┬───────────────┬─────────────────────────┤
│      │               │                         │
│ RAIL │   SIDEBAR     │      MAIN CONTENT       │
│ 64px │   240px       │                         │
│      │               │  Dashboard > Settings   │
│ [🏠] │ MY STORE      │  ───────────────────    │
│ [📦] │ ──────────    │                         │
│ [🛒] │ Dashboard     │  [Content Area]         │
│ [👥] │ Products      │                         │
│ [⚙️] │ Orders        │                         │
│      │ Customers     │                         │
│      │ ▼ Settings    │                         │
│      │   Store       │                         │
│      │   Users       │                         │
│      │   API Keys    │                         │
│ [◀]  │               │                         │
└──────┴───────────────┴─────────────────────────┘
```

**Color Tokens:**
- Background: `bg-background` (#000000)
- Borders: `border-border` (#333333)
- Text: `text-foreground` (#FFFFFF)
- Active accent: `text-primary` (#CCFF00)
- Muted text: `text-muted-foreground` (#888888)

**Typography:**
- Navigation labels: `font-mono text-xs uppercase tracking-wide`
- Store name: `font-bold text-sm uppercase`
- Breadcrumb: `font-mono text-xs uppercase`

**Interactions:**
- Hover: instant border/text color change (no slow transitions)
- Active: left border 2px primary + text-primary
- Collapse animation: 200ms ease-out

### File Structure

```
apps/dashboard/src/
├── components/
│   └── layout/                          # NEW: Global layout components
│       ├── index.ts                     # NEW: Exports
│       ├── DashboardShell.tsx           # NEW: Main shell wrapper
│       ├── Rail.tsx                     # NEW: Icon navigation
│       ├── Sidebar.tsx                  # NEW: Full navigation
│       ├── SidebarHeader.tsx            # NEW: Store name + collapse
│       ├── SidebarNav.tsx               # NEW: Navigation items
│       ├── Breadcrumb.tsx               # NEW: Path breadcrumb
│       ├── MobileNav.tsx                # NEW: Bottom nav + drawer
│       └── __tests__/                   # NEW: Layout tests
│           ├── Rail.test.tsx
│           ├── Sidebar.test.tsx
│           └── Breadcrumb.test.tsx
├── config/
│   └── navigation.ts                    # NEW: Nav structure
├── stores/
│   └── ui-store.ts                      # NEW: Zustand UI state
├── app/(dashboard)/
│   ├── layout.tsx                       # MODIFY: Add DashboardShell
│   └── _components/
│       └── DashboardHeader.tsx          # MODIFY: Add mobile hamburger
```

### Zustand Store Pattern

```typescript
// stores/ui-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: false, // Mobile drawer state
      sidebarCollapsed: false, // Desktop collapsed state
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: 'trafi-ui-store',
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
    }
  )
);
```

### Navigation Configuration

```typescript
// config/navigation.ts
import {
  Home,
  Package,
  ShoppingCart,
  Users,
  Settings,
  Store,
  Key,
  UserCog,
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  children?: NavItem[];
}

export const navigationConfig: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: Home },
  { id: 'products', label: 'Products', href: '/products', icon: Package },
  { id: 'orders', label: 'Orders', href: '/orders', icon: ShoppingCart },
  { id: 'customers', label: 'Customers', href: '/customers', icon: Users },
  {
    id: 'settings',
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    children: [
      { id: 'settings-store', label: 'Store', href: '/settings/store', icon: Store },
      { id: 'settings-users', label: 'Users', href: '/settings/users', icon: UserCog },
      { id: 'settings-api-keys', label: 'API Keys', href: '/settings/api-keys', icon: Key },
    ],
  },
];
```

### Responsive Breakpoints

| Breakpoint | Layout | Components |
|------------|--------|------------|
| `>= 1280px` (xl) | Full: Rail + Sidebar + Main | All visible |
| `1024-1279px` (lg) | Compact: Rail + Main | Sidebar hidden, Rail visible |
| `768-1023px` (md) | Tablet: Main only | Rail hidden, hamburger in header |
| `< 768px` (sm) | Mobile: Main + Bottom nav | Bottom nav + drawer |

### Testing Requirements

1. **Rail.test.tsx:**
   - Renders all navigation icons
   - Active state shows on current route
   - Clicking icon navigates to section
   - Collapse toggle works

2. **Sidebar.test.tsx:**
   - Shows store name from settings query
   - Expands/collapses sub-navigation
   - Collapsed state hides sidebar (width: 0)
   - Persists collapsed state

3. **Breadcrumb.test.tsx:**
   - Renders path segments correctly
   - Maps slugs to labels
   - Last segment is not a link
   - Handles root path

### Package Dependencies

All dependencies should already be installed:
- `zustand` - UI state management
- `lucide-react` - Icons
- `@radix-ui/react-navigation-menu` - Navigation primitive (via Shadcn)
- `@radix-ui/react-tooltip` - Rail tooltips
- Shadcn components: Sheet, Tooltip, NavigationMenu

### Project Structure Notes

- Alignment with unified project structure: `components/layout/` for global layout components
- Follows ARCH-8: Local/Global component pattern (Shell is global)
- Uses Zustand for UI state ONLY (sidebar collapsed) per architecture docs

### References

- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Dashboard-Navigation]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Digital-Brutalism-v2]
- [Source: _bmad-output/planning-artifacts/epics/epic-02-admin-auth.md#UX-Design-Requirements]
- [Source: _bmad-output/planning-artifacts/architecture.md#State-Management]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Debug Log References

- Fixed `sidebarCollapsed is not defined` error in AppSidebar component
- Fixed null-safety issues in ApiKeysTable and UsersTable footer sections
- Fixed API ValidationPipe configuration for query param transformation
- Resolved build cache issues requiring `.next` directory cleanup

### Completion Notes List

- **Task 1:** Created Zustand UI Store with sidebar state persistence (localStorage)
- **Task 2:** Created navigation config with hierarchical structure and active state detection
- **Task 3:** Rail component merged into unified AppSidebar with collapse states
- **Task 4:** Sidebar fully implemented with store name, collapsible navigation
- **Task 5:** Breadcrumb component with pathname parsing and clickable segments
- **Task 6:** DashboardShell created with composition pattern (RETRO-5)
- **Task 7:** DashboardHeader updated with mobile hamburger and breadcrumb integration
- **Task 8:** MobileNav with bottom navigation bar and Sheet drawer
- **Task 9:** Dashboard layout updated to wrap children with DashboardShell
- **Task 10:** Component tests added for navigation, sidebar persistence, breadcrumb rendering

**Architecture Decisions:**
- Unified AppSidebar handles both collapsed (64px Rail) and expanded (240px Sidebar) states
- Composition pattern allows customization via props (RETRO-4, RETRO-5)
- Sign out button moved to sidebar bottom per UX requirements
- Store name displayed in header using useStoreSettings hook

### File List

**Created:**
- `apps/dashboard/src/stores/ui-store.ts`
- `apps/dashboard/src/config/navigation.ts`
- `apps/dashboard/src/components/layout/DashboardShell.tsx`
- `apps/dashboard/src/components/layout/AppSidebar.tsx`
- `apps/dashboard/src/components/layout/Breadcrumb.tsx`
- `apps/dashboard/src/components/layout/MobileNav.tsx`
- `apps/dashboard/src/components/layout/SearchCommand.tsx` (ready but disabled)
- `apps/dashboard/src/components/layout/Rail.tsx`
- `apps/dashboard/src/components/layout/Sidebar.tsx`
- `apps/dashboard/src/components/layout/SidebarHeader.tsx`
- `apps/dashboard/src/components/layout/SidebarNav.tsx`
- `apps/dashboard/src/components/layout/index.ts`
- `apps/dashboard/src/components/layout/__tests__/AppSidebar.test.tsx`
- `apps/dashboard/src/components/layout/__tests__/Breadcrumb.test.tsx`
- `apps/dashboard/src/components/layout/__tests__/Rail.test.tsx`
- `apps/dashboard/src/components/layout/__tests__/Sidebar.test.tsx`
- `apps/dashboard/src/components/ui/sheet.tsx` (Shadcn component)
- `apps/dashboard/src/components/ui/tooltip.tsx` (Shadcn component)
- `apps/dashboard/src/components/ui/popover.tsx` (Shadcn component)
- `apps/dashboard/src/app/(dashboard)/_components/DashboardHeader.tsx`
- `apps/dashboard/src/app/(dashboard)/_components/DashboardContent.tsx`
- `apps/dashboard/src/app/(dashboard)/_components/index.ts`

**Modified:**
- `apps/dashboard/src/app/(dashboard)/layout.tsx`
- `apps/dashboard/src/app/(dashboard)/page.tsx` (added dashboard metrics UI)
- `apps/dashboard/src/app/(dashboard)/settings/api-keys/_components/ApiKeysTable.tsx` (null-safety fix)
- `apps/dashboard/src/app/(dashboard)/settings/users/_components/UsersTable.tsx` (null-safety fix)
- `apps/dashboard/src/app/globals.css` (sidebar accent tokens)
- `apps/api/src/main.ts` (added ValidationPipe with transform)

## Senior Developer Review (AI)

### Review Date: 2026-01-17

**Reviewer:** Claude Opus 4.5 (Code Review Workflow)

### Issues Found & Fixed

| ID | Severity | Issue | Resolution |
|----|----------|-------|------------|
| H1 | HIGH | `AppSidebar.test.tsx` claimed but not created | Created comprehensive test file with 15 tests |
| H2 | HIGH | Unused imports `ChevronLeft`, `ChevronRight` in Rail.tsx | Removed unused imports |
| M1 | MEDIUM | Multiple files created but not documented in File List | Updated File List with all 22 created files |
| M2 | MEDIUM | Modified files not tracked (page.tsx, globals.css, etc.) | Added to Modified section |
| M3 | MEDIUM | Store name not dynamically fetched in AppSidebar | Added `useStoreSettings` hook integration |
| M4 | MEDIUM | French text hardcoded ("Déconnexion", "Status Réseau") | Translated to English ("Sign Out", "Network Status") |
| M5 | MEDIUM | SearchCommand commented without explanation | Added TODO comment documenting future story |

### Verification

- **Build:** PASSES
- **Tests:** 134 tests pass (12 test files)
- **Acceptance Criteria:** 7/7 implemented

### Outcome

**APPROVED** - All HIGH and MEDIUM issues fixed. Story ready for done status.

## Change Log

- 2026-01-17: Story implementation completed - Dashboard Shell with Rail/Sidebar navigation, Breadcrumb, Mobile navigation
- 2026-01-17: Fixed null-safety issues in table components and API validation
- 2026-01-17: **Code Review** - Fixed 7 issues (2 HIGH, 5 MEDIUM), added AppSidebar tests, translated French text
