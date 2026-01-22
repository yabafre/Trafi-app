## Story 4.4: Shipping Zones and Rates Configuration

As a **Merchant**,
I want **to configure shipping zones and rates**,
So that **customers see accurate shipping costs**.

**Acceptance Criteria:**

**Given** a Merchant is in Settings
**When** they configure shipping
**Then** they can:
- Create shipping zones by country/region
- Define shipping methods per zone (standard, express, etc.)
- Set flat rates or weight-based rates
- Configure free shipping thresholds
**And** zones can have multiple methods with different prices
**And** a default/fallback zone handles unconfigured regions

### Technical Implementation

#### File Structure
```
apps/dashboard/src/app/(dashboard)/settings/shipping/
├── page.tsx                          # Shipping settings page (RSC)
├── _components/
│   ├── shipping-zones-table.tsx      # DataTable of zones
│   ├── zone-dialog.tsx               # Create/edit zone
│   ├── rate-dialog.tsx               # Create/edit shipping rate
│   └── countries-select.tsx          # Multi-select for countries
├── _hooks/
│   ├── use-shipping-zones.ts
│   └── use-shipping-rates.ts
└── _actions/
    ├── create-zone.ts
    ├── update-zone.ts
    ├── create-rate.ts
    └── update-rate.ts

apps/api/src/
├── shipping/
│   ├── shipping.module.ts
│   ├── shipping.service.ts
│   ├── dto/
│   │   ├── create-zone.dto.ts
│   │   ├── create-rate.dto.ts
│   │   └── rate-calculation.dto.ts
│   └── entities/
│       ├── shipping-zone.entity.ts
│       └── shipping-rate.entity.ts
```

#### Zod Schemas (`@trafi/validators`)
```typescript
// packages/validators/src/shipping.ts
export const ShippingZoneIdSchema = z.string().startsWith('zone_');
export const ShippingRateIdSchema = z.string().startsWith('rate_');

export const RateTypeSchema = z.enum(['flat', 'weight_based', 'price_based']);

export const CreateShippingZoneSchema = z.object({
  name: z.string().min(1).max(100),
  countries: z.array(z.string().length(2)), // ISO 3166-1 alpha-2
  regions: z.array(z.string()).optional(),   // State/province codes
  isDefault: z.boolean().default(false),
});

export const CreateShippingRateSchema = z.object({
  zoneId: ShippingZoneIdSchema,
  name: z.string().min(1).max(100),          // e.g., "Standard", "Express"
  type: RateTypeSchema,
  price: z.number().int().nonnegative(),      // Cents (ARCH-25)
  minOrderValue: z.number().int().optional(), // Free shipping threshold
  minWeight: z.number().optional(),           // For weight-based
  maxWeight: z.number().optional(),
  estimatedDaysMin: z.number().int().positive(),
  estimatedDaysMax: z.number().int().positive(),
});

export const ShippingZoneWithRatesSchema = z.object({
  id: ShippingZoneIdSchema,
  name: z.string(),
  countries: z.array(z.string()),
  isDefault: z.boolean(),
  rates: z.array(z.object({
    id: ShippingRateIdSchema,
    name: z.string(),
    type: RateTypeSchema,
    price: z.number(),
    estimatedDaysMin: z.number(),
    estimatedDaysMax: z.number(),
  })),
});
```

#### Backend Service (`apps/api/src/shipping/shipping.service.ts`)
```typescript
@Injectable()
export class ShippingService {
  constructor(private prisma: PrismaService) {}

  // Protected for @trafi/core extensibility (RETRO-2)
  protected async createZone(input: CreateZoneInput): Promise<ShippingZone> {
    // Ensure only one default zone exists
    if (input.isDefault) {
      await this.prisma.shippingZone.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.shippingZone.create({
      data: {
        id: generateId('zone'),
        ...input,
      },
    });
  }

  protected async createRate(input: CreateRateInput): Promise<ShippingRate> {
    return this.prisma.shippingRate.create({
      data: {
        id: generateId('rate'),
        ...input,
      },
    });
  }

  protected async getZonesWithRates(): Promise<ShippingZoneWithRates[]> {
    return this.prisma.shippingZone.findMany({
      include: { rates: true },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  protected async findZoneForCountry(countryCode: string): Promise<ShippingZone | null> {
    // First try to find specific zone via join table (ARCH-SHIP-1: NO arrays)
    const specificZone = await this.prisma.shippingZone.findFirst({
      where: {
        ShippingZoneCountry: { some: { countryIso2: countryCode } }
      },
      include: { rates: true, ShippingZoneCountry: true },
    });

    if (specificZone) return specificZone;

    // Fallback to default zone
    return this.prisma.shippingZone.findFirst({
      where: { isDefault: true },
      include: { rates: true, ShippingZoneCountry: true },
    });
  }
}
```

#### tRPC Router (`apps/api/src/trpc/routers/shipping.router.ts`)
```typescript
export const shippingRouter = router({
  listZones: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.shippingService.getZonesWithRates();
    }),

  createZone: protectedProcedure
    .input(CreateShippingZoneSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.shippingService.createZone(input);
    }),

  updateZone: protectedProcedure
    .input(CreateShippingZoneSchema.extend({ id: ShippingZoneIdSchema }))
    .mutation(async ({ ctx, input }) => {
      return ctx.shippingService.updateZone(input.id, input);
    }),

  createRate: protectedProcedure
    .input(CreateShippingRateSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.shippingService.createRate(input);
    }),

  deleteZone: protectedProcedure
    .input(z.object({ id: ShippingZoneIdSchema }))
    .mutation(async ({ ctx, input }) => {
      return ctx.shippingService.deleteZone(input.id);
    }),
});
```

#### Dashboard Data Flow
```
┌─────────────────────────────────────────────────────────────────────┐
│ Settings > Shipping Page (RSC)                                      │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ ShippingZonesTable (Client Component)                           │ │
│ │   ├─ useShippingZones() hook                                    │ │
│ │   │   └─ useServerActionQuery(getZonesAction)                   │ │
│ │   │       └─ Server Action → tRPC → ShippingService             │ │
│ │   │                                                             │ │
│ │   └─ DataTable with columns:                                    │ │
│ │       [Zone Name] [Countries] [Methods] [Actions]               │ │
│ │                                                                 │ │
│ │   Actions: Edit Zone | Add Rate | Delete Zone                   │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ ZoneDialog (Client - opens on Create/Edit)                      │ │
│ │   ├─ Zone name input                                            │ │
│ │   ├─ CountriesSelect (searchable multi-select)                  │ │
│ │   ├─ "Set as default zone" checkbox                             │ │
│ │   └─ Save → createZoneAction/updateZoneAction                   │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ RateDialog (Client - opens on Add Rate)                         │ │
│ │   ├─ Rate name (e.g., "Standard Shipping")                      │ │
│ │   ├─ Rate type: Flat / Weight-based / Price-based               │ │
│ │   ├─ Price input (cents converted for display)                  │ │
│ │   ├─ Free shipping threshold (optional)                         │ │
│ │   ├─ Estimated delivery days (min/max)                          │ │
│ │   └─ Save → createRateAction                                    │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

#### Server Action (`apps/dashboard/src/app/(dashboard)/settings/shipping/_actions/create-zone.ts`)
```typescript
'use server';

import { createServerActionProcedure } from 'zsa';
import { CreateShippingZoneSchema } from '@trafi/validators';
import { trpc } from '@/lib/trpc/server';

export const createZoneAction = createServerActionProcedure()
  .input(CreateShippingZoneSchema)
  .handler(async ({ input }) => {
    const zone = await trpc.shipping.createZone(input);
    revalidatePath('/settings/shipping');
    return zone;
  });
```

#### Custom Hook (`apps/dashboard/src/app/(dashboard)/settings/shipping/_hooks/use-shipping-zones.ts`)
```typescript
'use client';

import { useServerActionQuery, useServerActionMutation } from 'zsa-react';
import { getZonesAction, createZoneAction, deleteZoneAction } from '../_actions';

export function useShippingZones() {
  const { data: zones, isLoading, refetch } = useServerActionQuery(getZonesAction);

  const createZone = useServerActionMutation(createZoneAction, {
    onSuccess: () => refetch(),
  });

  const deleteZone = useServerActionMutation(deleteZoneAction, {
    onSuccess: () => refetch(),
  });

  return { zones, isLoading, createZone, deleteZone, refetch };
}
```

#### UX Implementation Notes
- **Breadcrumb**: Dashboard > Settings > Shipping (UX-3)
- **Layout**: Rail + Sidebar + Main content (UX-2)
- **DataTable**: Sortable columns, expandable rows to show rates (UX-8)
- **Countries Select**: Searchable with flag icons, grouped by continent
- **Default Zone**: Visual indicator (badge) for the fallback zone
- **Rate Display**: Show price formatted from cents, delivery estimate range
- **Validation**: Prevent deleting default zone, require at least one zone

---

