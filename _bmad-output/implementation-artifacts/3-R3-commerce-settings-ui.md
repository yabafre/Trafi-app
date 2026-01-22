# Story 3.R3: Commerce Feature Flags Dashboard UI

Status: done

## Story

As a **Merchant**,
I want **to configure commerce features (promotions, gift cards, multi-currency) from the Dashboard**,
So that **I can enable/disable features and set business limits without technical support**.

## Acceptance Criteria

1. **AC1**: Commerce tab displays promotions settings:
   - `promotionsEnabled` toggle (default: ON)
   - `maxDiscountPercent` slider/input (0-100, default: 100)
   - `allowStackablePromos` toggle (default: OFF)

2. **AC2**: Commerce tab displays gift cards settings:
   - `giftCardsEnabled` toggle (default: OFF)
   - `giftCardMinCents` input (min: 100, default: 1000 = $10)
   - `giftCardMaxCents` input (min: giftCardMinCents, default: 50000 = $500)
   - `giftCardValidityDays` input (optional, null = never expires)

3. **AC3**: Commerce tab displays multi-currency settings:
   - `multiCurrencyEnabled` toggle (default: OFF)
   - `displayPriceIncTax` toggle (default: ON)

4. **AC4**: Form validation enforces:
   - `giftCardMinCents <= giftCardMaxCents`
   - `maxDiscountPercent` is 0-100
   - All cent values are positive integers

5. **AC5**: Settings persist via existing StoreSettings API
6. **AC6**: Success toast on save, error toast on failure
7. **AC7**: Loading skeleton while fetching settings

## Tasks / Subtasks

### Dashboard Tasks

- [x] Task 1: Modify StoreSettingsTabs to add Commerce tab (AC: 1, 2, 3)
  - [x] 1.1: Add 'commerce' to TabValue type
  - [x] 1.2: Add COMMERCE tab to TABS array
  - [x] 1.3: Import and render CommerceSettingsForm
  - [x] 1.4: Verify tab navigation works

- [x] Task 2: Create CommerceSettingsForm component (AC: 1, 2, 3, 4, 5, 6, 7)
  - [x] 2.1: Create file `CommerceSettingsForm.tsx`
  - [x] 2.2: Implement Zod schema with validation refinement
  - [x] 2.3: Use react-hook-form with zodResolver
  - [x] 2.4: Use existing useStoreSettings and useUpdateStoreSettings hooks
  - [x] 2.5: Show SettingsFormSkeleton while loading
  - [x] 2.6: Implement form submit with toast feedback

- [x] Task 3: Create PromotionsSettingsSection component (AC: 1)
  - [x] 3.1: Create file `PromotionsSettingsSection.tsx`
  - [x] 3.2: Implement promotionsEnabled Switch
  - [x] 3.3: Implement maxDiscountPercent Slider with value display
  - [x] 3.4: Implement allowStackablePromos Switch
  - [x] 3.5: Follow existing form field pattern (border boxes)

- [x] Task 4: Create GiftCardsSettingsSection component (AC: 2)
  - [x] 4.1: Create file `GiftCardsSettingsSection.tsx`
  - [x] 4.2: Implement giftCardsEnabled Switch
  - [x] 4.3: Implement conditional rendering (hide fields when disabled)
  - [x] 4.4: Implement giftCardMinCents input with cents-to-currency conversion
  - [x] 4.5: Implement giftCardMaxCents input with cents-to-currency conversion
  - [x] 4.6: Implement giftCardValidityDays optional input

- [x] Task 5: Create MultiCurrencySettingsSection component (AC: 3)
  - [x] 5.1: Create file `MultiCurrencySettingsSection.tsx`
  - [x] 5.2: Implement multiCurrencyEnabled Switch
  - [x] 5.3: Implement displayPriceIncTax Switch

- [x] Task 6: Write unit tests (AC: 1-7)
  - [x] 6.1: Create `__tests__/CommerceSettingsForm.test.tsx`
  - [x] 6.2: Test renders all three sections
  - [x] 6.3: Test loading skeleton display
  - [x] 6.4: Test form validation (min <= max)
  - [x] 6.5: Test conditional gift card fields
  - [x] 6.6: Test save button disabled when pristine
  - [x] 6.7: Test toast on success/error

## Dev Notes

### CRITICAL: Backend Already Complete

**No API changes needed!** Story 3.R1 already implemented all backend fields:
- `StoreSettingsResponseDto` includes all commerce feature flags
- `UpdateStoreSettingsDto` accepts all commerce feature flags
- Validators include all necessary Zod schemas with refinements

Simply use the existing `useStoreSettings` and `useUpdateStoreSettings` hooks.

### Existing Hooks to Use

```typescript
// apps/dashboard/src/app/(dashboard)/settings/store/_hooks/index.ts
export { useStoreSettings } from './useStoreSettings'
export { useUpdateStoreSettings } from './useUpdateStoreSettings'
```

These hooks already handle the commerce feature flag fields from 3.R1.

### Money Display Pattern (CRITICAL)

Follow project-context.md rule: Money stored as INTEGER cents.

```typescript
// Helper functions for cents <-> display conversion
const centsToDisplay = (cents: number): string => (cents / 100).toFixed(2)
const displayToCents = (display: string): number => Math.round(parseFloat(display) * 100)

// In input onChange:
onChange={(e) => field.onChange(displayToCents(e.target.value))}
// In input value:
value={centsToDisplay(field.value)}
```

### Form Pattern from GeneralSettingsForm.tsx

Follow the established pattern:
1. Use `useStoreSettings()` for fetching
2. Use `useUpdateStoreSettings()` for mutations
3. Show `SettingsFormSkeleton` while loading
4. Track dirty state for save button
5. Toast feedback via `sonner`

### UX Design: Digital Brutalism v2

From project-context.md and existing forms:
- `radius-0` everywhere (no rounded corners)
- Dark mode default
- `font-mono text-xs uppercase tracking-wider` for labels
- Border boxes for form fields (`border border-border`)
- Primary color `#CCFF00` for active states
- Section headers with `border-b border-border`

### Component Props Pattern

Pass react-hook-form control to section components:
```typescript
interface SectionProps {
  control: Control<CommerceSettingsFormData>
  watch?: UseFormWatch<CommerceSettingsFormData>  // Only if needed
}
```

### Conditional Rendering (Gift Cards)

Only show gift card configuration fields when `giftCardsEnabled` is true:
```typescript
const giftCardsEnabled = watch('giftCardsEnabled')

return (
  <>
    <FormField name="giftCardsEnabled" ... />
    {giftCardsEnabled && (
      <>
        <FormField name="giftCardMinCents" ... />
        <FormField name="giftCardMaxCents" ... />
        <FormField name="giftCardValidityDays" ... />
      </>
    )}
  </>
)
```

### Slider Component for maxDiscountPercent

Use Shadcn Slider:
```typescript
import { Slider } from '@/components/ui/slider'

<Slider
  value={[field.value]}
  onValueChange={([val]) => field.onChange(val)}
  min={0}
  max={100}
  step={5}
/>
```

### Validation Schema

```typescript
const commerceSettingsSchema = z.object({
  promotionsEnabled: z.boolean(),
  maxDiscountPercent: z.number().int().min(0).max(100),
  allowStackablePromos: z.boolean(),
  giftCardsEnabled: z.boolean(),
  giftCardMinCents: z.number().int().min(100),
  giftCardMaxCents: z.number().int().min(100),
  giftCardValidityDays: z.number().int().min(1).nullable(),
  multiCurrencyEnabled: z.boolean(),
  displayPriceIncTax: z.boolean(),
}).refine(data => data.giftCardMinCents <= data.giftCardMaxCents, {
  message: 'Minimum amount must be less than or equal to maximum',
  path: ['giftCardMinCents'],
})
```

### Project Structure Notes

Files to create:
```
apps/dashboard/src/app/(dashboard)/settings/store/_components/
├── CommerceSettingsForm.tsx           # Main form container
├── PromotionsSettingsSection.tsx      # Promotions section
├── GiftCardsSettingsSection.tsx       # Gift cards section
├── MultiCurrencySettingsSection.tsx   # Multi-currency section
└── __tests__/
    └── CommerceSettingsForm.test.tsx  # Unit tests
```

Files to modify:
```
apps/dashboard/src/app/(dashboard)/settings/store/_components/
└── StoreSettingsTabs.tsx              # Add 'commerce' tab
```

### Testing Approach

Use existing test patterns from the codebase:
- Mock `useStoreSettings` and `useUpdateStoreSettings`
- Use `@testing-library/react` for rendering
- Test user interactions with `userEvent`
- Verify toast calls with mock

### Previous Story Intelligence (from 3.R1)

Story 3.R1 established:
1. Commerce feature flags in StoreSettings model
2. DTOs with proper validation decorators
3. Service methods handle all new fields
4. 663 tests passing after implementation

The API is battle-tested and ready to consume.

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-03/story-3-r3-commerce-settings-ui.md - Full technical spec]
- [Source: _bmad-output/implementation-artifacts/3-R1-foundation-reinforcement.md - Backend implementation]
- [Source: _bmad-output/project-context.md - Coding standards and patterns]
- [Source: apps/dashboard/src/app/(dashboard)/settings/store/_components/GeneralSettingsForm.tsx - Form pattern reference]
- [Source: apps/dashboard/src/app/(dashboard)/settings/store/_components/StoreSettingsTabs.tsx - Tab navigation pattern]
- [Source: apps/api/src/modules/settings/dto/store-settings-response.dto.ts - API response shape]
- [Source: apps/api/src/modules/settings/dto/update-store-settings.dto.ts - API request shape]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Build passed after fixing `@/components/ui/form` missing component (created Shadcn Form component)
- Build passed after fixing Zod import (changed `import { z } from 'zod'` to `import { z } from '@trafi/zod'`)
- Added `@radix-ui/react-slider` dependency for Slider component

### Completion Notes List

1. **Task 1 Complete**: Added 'commerce' tab to StoreSettingsTabs.tsx with proper TabValue type extension
2. **Task 2 Complete**: Created CommerceSettingsForm.tsx with Zod validation, react-hook-form integration, useStoreSettings/useUpdateStoreSettings hooks, and loading skeleton
3. **Task 3 Complete**: Created PromotionsSettingsSection.tsx with Switch for promotionsEnabled/allowStackablePromos and Slider for maxDiscountPercent
4. **Task 4 Complete**: Created GiftCardsSettingsSection.tsx with conditional rendering (fields hidden when giftCardsEnabled=false), cents-to-currency conversion helpers
5. **Task 5 Complete**: Created MultiCurrencySettingsSection.tsx with multiCurrencyEnabled and displayPriceIncTax switches
6. **Task 6 Complete**: Created 19 unit tests covering all ACs - loading skeleton, section rendering, conditional fields, validation, save button state, form submission
7. **Infrastructure**: Created new Shadcn components (Form, Slider) following project patterns

### File List

**New Files:**
- `apps/dashboard/src/components/ui/form.tsx` - Shadcn Form component for react-hook-form
- `apps/dashboard/src/components/ui/slider.tsx` - Shadcn Slider component
- `apps/dashboard/src/app/(dashboard)/settings/store/_components/CommerceSettingsForm.tsx` - Main form container
- `apps/dashboard/src/app/(dashboard)/settings/store/_components/PromotionsSettingsSection.tsx` - Promotions section
- `apps/dashboard/src/app/(dashboard)/settings/store/_components/GiftCardsSettingsSection.tsx` - Gift cards section
- `apps/dashboard/src/app/(dashboard)/settings/store/_components/MultiCurrencySettingsSection.tsx` - Multi-currency section
- `apps/dashboard/src/app/(dashboard)/settings/store/_components/__tests__/CommerceSettingsForm.test.tsx` - 19 unit tests

**Modified Files:**
- `apps/dashboard/src/app/(dashboard)/settings/store/_components/StoreSettingsTabs.tsx` - Added commerce tab
- `apps/dashboard/package.json` - Added dependencies for Form, Slider components

**Dependencies Added:**
- `@radix-ui/react-slider` - For Slider component
- `@radix-ui/react-label` - For Form component
- `@radix-ui/react-slot` - For Form component
- `react-hook-form` - For form state management
- `@hookform/resolvers` - For Zod resolver

### Change Log

- **2026-01-22:** Story created via create-story workflow - comprehensive developer guide
- **2026-01-22:** Implementation complete - 6 tasks completed, 19 unit tests, 249 total dashboard tests passing, build successful
- **2026-01-22:** Code review fixes applied:
  - Added schema documentation clarifying relationship with @trafi/validators
  - Fixed floating point precision in displayToCents using string manipulation
  - Made currency label dynamic (EUR -> settings.defaultCurrency)
  - Added aria-label to slider for accessibility
  - Fixed test act() warnings with proper async wrapping
  - Updated File List to include package.json
