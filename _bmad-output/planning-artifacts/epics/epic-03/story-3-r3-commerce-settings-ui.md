## Story 3.R3: Commerce Feature Flags Dashboard UI

As a **Merchant**,
I want **to configure commerce features (promotions, gift cards, multi-currency) from the Dashboard**,
So that **I can enable/disable features and set business limits without technical support**.

**Acceptance Criteria:**

**Given** a Merchant is authenticated with Admin/Owner role
**When** they navigate to Settings > Store
**Then** they see a new "COMMERCE" tab alongside General, Localization, Contact, Brand
**And** the Commerce tab displays:
- Promotions section with toggle and settings
- Gift Cards section with toggle and settings
- Multi-Currency section with toggle and settings

**AC1:** Commerce tab displays promotions settings:
- `promotionsEnabled` toggle (default: ON)
- `maxDiscountPercent` slider/input (0-100, default: 100)
- `allowStackablePromos` toggle (default: OFF)

**AC2:** Commerce tab displays gift cards settings:
- `giftCardsEnabled` toggle (default: OFF)
- `giftCardMinCents` input (min: 100, default: 1000 = $10)
- `giftCardMaxCents` input (min: giftCardMinCents, default: 50000 = $500)
- `giftCardValidityDays` input (optional, null = never expires)

**AC3:** Commerce tab displays multi-currency settings:
- `multiCurrencyEnabled` toggle (default: OFF)
- `displayPriceIncTax` toggle (default: ON)

**AC4:** Form validation enforces:
- `giftCardMinCents <= giftCardMaxCents`
- `maxDiscountPercent` is 0-100
- All cent values are positive integers

**AC5:** Settings persist via existing StoreSettings API
**AC6:** Success toast on save, error toast on failure
**AC7:** Loading skeleton while fetching settings

**FRs covered:** FR105-FR110 (Promotions), FR115-FR120 (Gift Cards)

---

### Technical Implementation

#### File Structure
```
apps/dashboard/src/app/(dashboard)/settings/store/
├── _components/
│   ├── StoreSettingsTabs.tsx         # MODIFY: Add 'commerce' tab
│   ├── CommerceSettingsForm.tsx      # NEW: Commerce feature flags form
│   ├── PromotionsSettingsSection.tsx # NEW: Promotions toggle + settings
│   ├── GiftCardsSettingsSection.tsx  # NEW: Gift cards toggle + settings
│   ├── MultiCurrencySettingsSection.tsx # NEW: Multi-currency toggle + settings
│   └── __tests__/
│       └── CommerceSettingsForm.test.tsx  # NEW: Unit tests
```

#### Component: StoreSettingsTabs.tsx (MODIFY)
```typescript
// Add 'commerce' to TabValue type and TABS array
type TabValue = 'general' | 'localization' | 'contact' | 'brand' | 'commerce'

const TABS: Tab[] = [
  { value: 'general', label: 'GENERAL' },
  { value: 'localization', label: 'LOCALISATION' },
  { value: 'contact', label: 'CONTACT' },
  { value: 'brand', label: 'MARQUE' },
  { value: 'commerce', label: 'COMMERCE' },  // NEW
]

// Add import and render
import { CommerceSettingsForm } from './CommerceSettingsForm'

// In render:
{activeTab === 'commerce' && <CommerceSettingsForm />}
```

#### Component: CommerceSettingsForm.tsx (NEW)
```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useStoreSettings, useUpdateStoreSettings } from '../_hooks/useStoreSettings'
import { PromotionsSettingsSection } from './PromotionsSettingsSection'
import { GiftCardsSettingsSection } from './GiftCardsSettingsSection'
import { MultiCurrencySettingsSection } from './MultiCurrencySettingsSection'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { toast } from 'sonner'
import { SettingsFormSkeleton } from './SettingsFormSkeleton'

const commerceSettingsSchema = z.object({
  // Promotions
  promotionsEnabled: z.boolean(),
  maxDiscountPercent: z.number().int().min(0).max(100),
  allowStackablePromos: z.boolean(),
  // Gift Cards
  giftCardsEnabled: z.boolean(),
  giftCardMinCents: z.number().int().min(100),
  giftCardMaxCents: z.number().int().min(100),
  giftCardValidityDays: z.number().int().min(1).nullable(),
  // Multi-Currency
  multiCurrencyEnabled: z.boolean(),
  displayPriceIncTax: z.boolean(),
}).refine(data => data.giftCardMinCents <= data.giftCardMaxCents, {
  message: 'Minimum amount must be less than or equal to maximum',
  path: ['giftCardMinCents'],
})

type CommerceSettingsFormData = z.infer<typeof commerceSettingsSchema>

export function CommerceSettingsForm() {
  const { data: settings, isLoading } = useStoreSettings()
  const { mutate: updateSettings, isPending } = useUpdateStoreSettings()

  const form = useForm<CommerceSettingsFormData>({
    resolver: zodResolver(commerceSettingsSchema),
    values: settings ? {
      promotionsEnabled: settings.promotionsEnabled,
      maxDiscountPercent: settings.maxDiscountPercent,
      allowStackablePromos: settings.allowStackablePromos,
      giftCardsEnabled: settings.giftCardsEnabled,
      giftCardMinCents: settings.giftCardMinCents,
      giftCardMaxCents: settings.giftCardMaxCents,
      giftCardValidityDays: settings.giftCardValidityDays,
      multiCurrencyEnabled: settings.multiCurrencyEnabled,
      displayPriceIncTax: settings.displayPriceIncTax,
    } : undefined,
  })

  if (isLoading) return <SettingsFormSkeleton />

  const onSubmit = (data: CommerceSettingsFormData) => {
    updateSettings(data, {
      onSuccess: () => toast.success('Commerce settings updated'),
      onError: () => toast.error('Failed to update settings'),
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <PromotionsSettingsSection control={form.control} />
        <GiftCardsSettingsSection control={form.control} watch={form.watch} />
        <MultiCurrencySettingsSection control={form.control} />

        <div className="flex justify-end pt-4 border-t border-border">
          <Button
            type="submit"
            disabled={isPending || !form.formState.isDirty}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isPending ? 'SAVING...' : 'SAVE CHANGES'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
```

#### Component: PromotionsSettingsSection.tsx (NEW)
```typescript
'use client'

import { Control } from 'react-hook-form'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'

interface PromotionsSettingsSectionProps {
  control: Control<any>
}

export function PromotionsSettingsSection({ control }: PromotionsSettingsSectionProps) {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-2">
        <h3 className="font-mono text-sm uppercase tracking-wider">Promotions & Discounts</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Configure how promotions and discount codes work in your store
        </p>
      </div>

      <FormField
        control={control}
        name="promotionsEnabled"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between p-4 border border-border">
            <div className="space-y-0.5">
              <FormLabel className="font-mono text-xs uppercase">Enable Promotions</FormLabel>
              <FormDescription className="text-xs">
                Allow creating and applying discount codes and promotions
              </FormDescription>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="maxDiscountPercent"
        render={({ field }) => (
          <FormItem className="p-4 border border-border space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <FormLabel className="font-mono text-xs uppercase">Max Discount</FormLabel>
                <FormDescription className="text-xs">
                  Maximum percentage discount allowed (0-100%)
                </FormDescription>
              </div>
              <span className="font-mono text-lg">{field.value}%</span>
            </div>
            <FormControl>
              <Slider
                value={[field.value]}
                onValueChange={([val]) => field.onChange(val)}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="allowStackablePromos"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between p-4 border border-border">
            <div className="space-y-0.5">
              <FormLabel className="font-mono text-xs uppercase">Stackable Promotions</FormLabel>
              <FormDescription className="text-xs">
                Allow multiple promotions to be applied to a single order
              </FormDescription>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  )
}
```

#### Component: GiftCardsSettingsSection.tsx (NEW)
```typescript
'use client'

import { Control, UseFormWatch } from 'react-hook-form'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'

interface GiftCardsSettingsSectionProps {
  control: Control<any>
  watch: UseFormWatch<any>
}

// Helper to display cents as currency
const centsToDisplay = (cents: number) => (cents / 100).toFixed(2)
const displayToCents = (display: string) => Math.round(parseFloat(display) * 100)

export function GiftCardsSettingsSection({ control, watch }: GiftCardsSettingsSectionProps) {
  const giftCardsEnabled = watch('giftCardsEnabled')

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-2">
        <h3 className="font-mono text-sm uppercase tracking-wider">Gift Cards</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Configure gift card purchasing and redemption settings
        </p>
      </div>

      <FormField
        control={control}
        name="giftCardsEnabled"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between p-4 border border-border">
            <div className="space-y-0.5">
              <FormLabel className="font-mono text-xs uppercase">Enable Gift Cards</FormLabel>
              <FormDescription className="text-xs">
                Allow customers to purchase and redeem gift cards
              </FormDescription>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />

      {giftCardsEnabled && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={control}
              name="giftCardMinCents"
              render={({ field }) => (
                <FormItem className="p-4 border border-border">
                  <FormLabel className="font-mono text-xs uppercase">Minimum Amount</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="1"
                        value={centsToDisplay(field.value)}
                        onChange={(e) => field.onChange(displayToCents(e.target.value))}
                        className="font-mono"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="giftCardMaxCents"
              render={({ field }) => (
                <FormItem className="p-4 border border-border">
                  <FormLabel className="font-mono text-xs uppercase">Maximum Amount</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="1"
                        value={centsToDisplay(field.value)}
                        onChange={(e) => field.onChange(displayToCents(e.target.value))}
                        className="font-mono"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={control}
            name="giftCardValidityDays"
            render={({ field }) => (
              <FormItem className="p-4 border border-border">
                <FormLabel className="font-mono text-xs uppercase">Validity Period (Days)</FormLabel>
                <FormDescription className="text-xs mb-2">
                  Leave empty for gift cards that never expire
                </FormDescription>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    placeholder="No expiration"
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                    className="font-mono max-w-[200px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}
    </div>
  )
}
```

#### Component: MultiCurrencySettingsSection.tsx (NEW)
```typescript
'use client'

import { Control } from 'react-hook-form'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'

interface MultiCurrencySettingsSectionProps {
  control: Control<any>
}

export function MultiCurrencySettingsSection({ control }: MultiCurrencySettingsSectionProps) {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-2">
        <h3 className="font-mono text-sm uppercase tracking-wider">Multi-Currency</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Configure how your store handles multiple currencies
        </p>
      </div>

      <FormField
        control={control}
        name="multiCurrencyEnabled"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between p-4 border border-border">
            <div className="space-y-0.5">
              <FormLabel className="font-mono text-xs uppercase">Enable Multi-Currency</FormLabel>
              <FormDescription className="text-xs">
                Display prices in multiple currencies based on customer location
              </FormDescription>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="displayPriceIncTax"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between p-4 border border-border">
            <div className="space-y-0.5">
              <FormLabel className="font-mono text-xs uppercase">Prices Include Tax</FormLabel>
              <FormDescription className="text-xs">
                Display prices with tax included (recommended for B2C in EU)
              </FormDescription>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  )
}
```

---

### UX Implementation

**Layout:** Settings page, "COMMERCE" tab in StoreSettingsTabs
**Breadcrumb:** Dashboard > Settings > Store > Commerce
**Design System:** Digital Brutalism v2 (radius-0, dark mode, mono font)

**Visual Sections:**
1. **Promotions & Discounts** - Toggle + slider + toggle
2. **Gift Cards** - Toggle + conditional fields (min/max/validity)
3. **Multi-Currency** - Two toggles

**Interactions:**
- Toggle switches for boolean flags
- Slider for maxDiscountPercent (visual feedback)
- Input fields for gift card amounts (cents displayed as currency)
- Conditional rendering: Gift card fields only shown when enabled
- Form dirty state: Save button disabled until changes made

**Feedback:**
- Loading skeleton while fetching settings
- Success toast: "Commerce settings updated"
- Error toast: "Failed to update settings"
- Validation errors inline on fields

---

### Testing Requirements

#### Unit Tests (CommerceSettingsForm.test.tsx)
```typescript
describe('CommerceSettingsForm', () => {
  it('renders all three sections', () => {})
  it('shows loading skeleton when fetching', () => {})
  it('populates form with existing settings', () => {})
  it('validates giftCardMinCents <= giftCardMaxCents', () => {})
  it('validates maxDiscountPercent is 0-100', () => {})
  it('hides gift card fields when giftCardsEnabled is false', () => {})
  it('shows gift card fields when giftCardsEnabled is true', () => {})
  it('disables save button when form is pristine', () => {})
  it('enables save button when form is dirty', () => {})
  it('calls updateSettings on submit', () => {})
  it('shows success toast on successful save', () => {})
  it('shows error toast on failed save', () => {})
})
```

---

### Dependencies

- **Story 3.R1** (DONE): Backend commerce feature flags already in StoreSettings
- **Existing:** StoreSettingsTabs, useStoreSettings hook, existing settings forms

### Effort Estimate

- **Backend:** None (API already supports these fields from 3.R1)
- **Frontend:** 4 new components + 1 modification + tests
- **Complexity:** Medium (form handling, conditional fields, validation)

---

### Dev Notes

#### API Already Supports These Fields
The `UpdateStoreSettingsDto` and `StoreSettingsResponseDto` already include all commerce feature flag fields from Story 3.R1. No API changes needed.

#### Money Display Pattern
Follow existing pattern for displaying cents as currency:
- Store as integer cents (e.g., 1000 = $10.00)
- Display as formatted currency with 2 decimals
- Convert on input/output at form level

#### Conditional Sections
Gift card configuration fields are only shown when `giftCardsEnabled` is true. This reduces visual clutter for merchants who don't use gift cards.

#### UX Design Reference
Follow existing settings forms (GeneralSettingsForm, BrandSettingsForm) for consistent:
- Section headers with border-b
- Form field layout with border boxes
- Switch toggle alignment
- Save button positioning

---

### References

- [Source: Story 3.R1 - Foundation Reinforcement (backend fields)]
- [Source: apps/dashboard/src/app/(dashboard)/settings/store/ - existing structure]
- [Source: StoreSettingsTabs.tsx - tab navigation pattern]
- [Source: GeneralSettingsForm.tsx - form pattern reference]
