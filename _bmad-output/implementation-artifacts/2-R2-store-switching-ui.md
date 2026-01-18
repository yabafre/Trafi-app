# Story 2-R2: Store Switching UI

Status: done

## Story

As a **Multi-Store User**,
I want **to switch between my stores directly from the dashboard sidebar**,
so that **I can manage multiple stores without logging out and back in**.

## Acceptance Criteria

1. **AC1 - Store Switcher Component**
   - New `StoreSwitcher` component created in `components/layout/`
   - Displays current store name with dropdown trigger
   - Shows list of all stores the user has access to via `auth.myStores`
   - Indicates which store is currently active (visual highlight)
   - Shows user's role for each store (OWNER, ADMIN, EDITOR, VIEWER)
   - Follows Digital Brutalism v2 design system (0px border-radius, uppercase, monospace)

2. **AC2 - Store Switch Flow**
   - Clicking a store calls `auth.switchStore` mutation
   - New tokens stored in HTTP-only cookies (replacing old tokens)
   - Page refreshes to reinitialize auth context after switch
   - Loading state shown during switch operation
   - Error toast displayed if switch fails (e.g., no membership)

3. **AC3 - Sidebar Integration**
   - `StoreSwitcher` integrated into `AppSidebar.tsx` header section
   - Replaces static store name display with interactive switcher
   - Works in both collapsed (icon-only) and expanded states
   - Collapsed: Icon button with tooltip showing current store
   - Expanded: Full dropdown with store name and chevron

4. **AC4 - Single Store UX**
   - Users with only one store see store name without dropdown arrow
   - No switcher interaction for single-store users (clean UX)
   - Component gracefully handles edge case

5. **AC5 - Unit Tests**
   - `StoreSwitcher.test.tsx` - Renders with stores list
   - `StoreSwitcher.test.tsx` - Handles switch mutation
   - `StoreSwitcher.test.tsx` - Shows loading state
   - `StoreSwitcher.test.tsx` - Single store mode (no dropdown)
   - Integration with AppSidebar tested

## Tasks / Subtasks

- [x] Task 1: Create useMyStores hook (AC: 1, 4)
  - [x] Create `apps/dashboard/src/lib/hooks/useMyStores.ts`
  - [x] Use zsa pattern: Server Action -> tRPC -> auth.myStores
  - [x] Return `{ stores, currentStoreId, isLoading, error }`
  - [x] Memoize store list to prevent unnecessary re-renders

- [x] Task 2: Create useSwitchStore hook (AC: 2)
  - [x] Create `apps/dashboard/src/lib/hooks/useSwitchStore.ts`
  - [x] Use zsa pattern: Server Action -> tRPC -> auth.switchStore
  - [x] Handle token update via cookies (Server Action sets cookies)
  - [x] Trigger page refresh via window.location.reload()
  - [x] Return `{ switchStore, isLoading, error }`

- [x] Task 3: Create StoreSwitcher component (AC: 1, 3, 4)
  - [x] Create `apps/dashboard/src/components/layout/StoreSwitcher.tsx`
  - [x] Use Popover from shadcn/ui for dropdown
  - [x] Render current store with ChevronDown icon
  - [x] Map stores to selectable list items
  - [x] Apply Brutalist styling: uppercase, tracking-widest, border-border
  - [x] Handle collapsed sidebar state (icon-only mode)
  - [x] Hide dropdown for single-store users

- [x] Task 4: Create Server Actions (AC: 2)
  - [x] Create `apps/dashboard/src/app/(dashboard)/_actions/switch-store.action.ts`
  - [x] Create `apps/dashboard/src/app/(dashboard)/_actions/get-my-stores.action.ts`
  - [x] Use existing `createAuthenticatedTrpcClient` pattern
  - [x] Handle errors with proper error codes

- [x] Task 5: Integrate into AppSidebar (AC: 3)
  - [x] Modify `apps/dashboard/src/components/layout/AppSidebar.tsx`
  - [x] Replace static store name in header with StoreSwitcher
  - [x] Pass `collapsed` prop for responsive behavior
  - [x] Maintain existing UX for logo and toggle button

- [x] Task 6: Write unit tests (AC: 5)
  - [x] Create `apps/dashboard/src/components/layout/__tests__/StoreSwitcher.test.tsx`
  - [x] Test multi-store rendering
  - [x] Test single-store mode
  - [x] Test switch mutation trigger
  - [x] Test loading and error states
  - [x] Update AppSidebar.test.tsx if needed

### Review Follow-ups (AI)
- [ ] [AI-Review][MEDIUM] Move `StoreInfo`, `GetMyStoresResponse`, `SwitchStoreResponse` types from `_actions/*.ts` to `@trafi/types` package to comply with project-context.md type location rules [get-my-stores.action.ts:9-22, switch-store.action.ts:19-28]

## Dev Notes

### Architecture Patterns

**Dashboard Data Flow (from project-context.md):**
```
Page (RSC) -> Client Component -> Custom Hook -> Zsa Hook -> Server Action -> tRPC -> NestJS
```

For this story:
1. `AppSidebar.tsx` (Client Component)
2. `useMyStores` / `useSwitchStore` (Custom Hooks)
3. `get-my-stores.action.ts` / `switch-store.action.ts` (Server Actions)
4. `auth.myStores` / `auth.switchStore` (tRPC - already exist from Story 2-R1)

**Token Management:**
- Tokens stored in HTTP-only cookies (see `apps/dashboard/src/lib/auth.ts`)
- After switchStore returns new tokens, Server Action updates cookies via `setAuthCookies()`
- Trigger full refresh to reinitialize auth context (discards all store-scoped cached data)

### Existing Backend Endpoints

From Story 2-R1, these tRPC endpoints are ready:

```typescript
// auth.router.ts
auth.myStores: publicProcedure.use(isAuthed).query()
// Returns: { stores: [{ id, name, slug, role, isCurrent }] }

auth.switchStore: publicProcedure.use(isAuthed)
  .input(z.object({ storeId: z.string().min(1) }))
  .mutation()
// Returns: { success, user, accessToken, refreshToken, expiresIn }
```

### UI Design Requirements (Digital Brutalism v2)

From epic-02-admin-auth.md:
- Pure black background (#000000)
- Acid lime accent (#CCFF00) for primary actions
- 0px border-radius everywhere
- Uppercase text with tracking-widest
- Monospace for data/status text
- Border color: `border-border` (muted gray)

**StoreSwitcher Design:**
```
Collapsed:
[Store Icon] <- Tooltip: "Store Name (OWNER)"

Expanded:
┌─────────────────────────────────┐
│ [Store] STORE NAME         [v] │  <- Click to open
└─────────────────────────────────┘

Dropdown (Popover):
┌─────────────────────────────────┐
│ YOUR STORES                     │
├─────────────────────────────────┤
│ [*] DEMO STORE         OWNER   │  <- Current (highlighted)
│ [ ] CLIENT STORE       ADMIN   │
│ [ ] AGENCY STORE       EDITOR  │
└─────────────────────────────────┘
```

### File Structure

```
apps/dashboard/src/
├── app/(dashboard)/
│   └── _actions/
│       ├── get-my-stores.action.ts    # NEW
│       └── switch-store.action.ts     # NEW
├── components/layout/
│   ├── StoreSwitcher.tsx              # NEW
│   ├── __tests__/
│   │   └── StoreSwitcher.test.tsx     # NEW
│   └── AppSidebar.tsx                 # MODIFY
└── lib/hooks/
    ├── useMyStores.ts                 # NEW
    └── useSwitchStore.ts              # NEW
```

### Testing Strategy

- Mock tRPC responses for isolated component tests
- Use `@testing-library/react` with custom render wrapper
- Test both collapsed and expanded states
- Test keyboard navigation (a11y)

### Project Structure Notes

- Alignment with unified project structure (paths, modules, naming)
- Server Actions in `_actions/` following existing pattern
- Hooks in `lib/hooks/` following existing pattern
- Layout components in `components/layout/`

### References

- [Source: _bmad-output/implementation-artifacts/2-R1-multi-store-rbac.md#Task 5] - Backend endpoints
- [Source: _bmad-output/planning-artifacts/epics/epic-02-admin-auth.md#UX Design] - Brutalist v2 specs
- [Source: _bmad-output/project-context.md#Dashboard Data Flow] - Architecture pattern
- [Source: apps/api/src/trpc/routers/auth.router.ts:102-158] - myStores & switchStore endpoints
- [Source: apps/dashboard/src/components/layout/AppSidebar.tsx] - Integration target

## Dev Agent Record

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References
- Initial implementation pass completed without major debugging
- Test fixes applied for multiple element assertions (getAllByText pattern)

### Completion Notes List
1. Server Actions created first since hooks depend on them
2. Token update handled via cookies in Server Action (setAuthCookies) rather than localStorage
3. Page reload used to reinitialize auth context after store switch
4. StoreSwitcher follows Brutalist v2 design with Popover/Tooltip components
5. AppSidebar tests updated to mock useMyStores and StoreSwitcher
6. All 28 tests passing (15 AppSidebar + 13 StoreSwitcher)

### File List
**Created:**
- `apps/dashboard/src/app/(dashboard)/_actions/get-my-stores.action.ts`
- `apps/dashboard/src/app/(dashboard)/_actions/switch-store.action.ts`
- `apps/dashboard/src/lib/hooks/useMyStores.ts`
- `apps/dashboard/src/lib/hooks/useSwitchStore.ts`
- `apps/dashboard/src/components/layout/StoreSwitcher.tsx`
- `apps/dashboard/src/components/layout/__tests__/StoreSwitcher.test.tsx`

**Modified:**
- `apps/dashboard/src/app/(dashboard)/_actions/index.ts` (added exports)
- `apps/dashboard/src/lib/hooks/index.ts` (added exports)
- `apps/dashboard/src/components/layout/AppSidebar.tsx` (integrated StoreSwitcher)
- `apps/dashboard/src/components/layout/__tests__/AppSidebar.test.tsx` (added mocks)

## Senior Developer Review (AI)

**Reviewer:** Claude Opus 4.5 (Adversarial Code Review)
**Date:** 2026-01-18
**Outcome:** APPROVED with fixes applied

### Issues Found & Fixed

| Severity | Issue | Fix Applied |
|----------|-------|-------------|
| HIGH | Missing error toast on switch failure (AC2.5) | Added `toast.error()` in `useSwitchStore.ts:45` |
| HIGH | Story documentation said localStorage, implementation uses cookies | Updated AC2 and Dev Notes to reflect cookies |
| MEDIUM | `useRouter` imported but unused in useSwitchStore | Removed unused import |
| MEDIUM | Error type casting without validation | Added `instanceof Error` checks in both hooks |
| MEDIUM | No documentation for reload vs invalidation choice | Added comment explaining architectural decision |

### Action Items Created
- [ ] Move types to `@trafi/types` package (deferred - needs broader refactor)

### Tests Verified
- 56 layout component tests passing
- StoreSwitcher: 13 tests
- AppSidebar: 15 tests

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-18 | Story created from Epic 2 deferred scope | Claude Opus 4.5 |
| 2026-01-18 | Implementation completed - all 6 tasks done | Claude Opus 4.5 |
| 2026-01-18 | Code review fixes: toast errors, doc corrections, type safety | Claude Opus 4.5 (Review) |
