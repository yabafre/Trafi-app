## Story 4.5: Shipping Rate Calculation

As a **System**,
I want **to calculate shipping rates based on cart and destination**,
So that **buyers see accurate shipping costs early**.

**Acceptance Criteria:**

**Given** a cart with items and a destination address
**When** shipping rates are requested
**Then** the system returns:
- All available shipping methods for the zone
- Calculated price per method
- Estimated delivery timeframe per method
**And** rates are calculated based on cart weight/value
**And** free shipping is applied when threshold is met
**And** calculation completes in < 200ms

### Technical Implementation

#### Zod Schemas (`@trafi/validators`)
```typescript
// packages/validators/src/shipping.ts
export const ShippingCalculationInputSchema = z.object({
  cartId: CartIdSchema,
  countryCode: z.string().length(2),
  postalCode: z.string().optional(),
});

export const CalculatedShippingRateSchema = z.object({
  rateId: ShippingRateIdSchema,
  name: z.string(),
  price: z.number().int(),              // Cents (ARCH-25)
  originalPrice: z.number().int(),       // Before free shipping discount
  isFree: z.boolean(),
  estimatedDaysMin: z.number().int(),
  estimatedDaysMax: z.number().int(),
  estimatedDeliveryDate: z.object({
    min: z.date(),
    max: z.date(),
  }),
});

export const ShippingCalculationResultSchema = z.object({
  zoneId: ShippingZoneIdSchema,
  zoneName: z.string(),
  availableRates: z.array(CalculatedShippingRateSchema),
  recommendedRateId: ShippingRateIdSchema.optional(), // Cheapest or fastest
});
```

#### Backend Service (`apps/api/src/shipping/shipping.service.ts`)
```typescript
@Injectable()
export class ShippingService {
  // Protected for @trafi/core extensibility (RETRO-2)
  protected async calculateRates(
    input: ShippingCalculationInput,
  ): Promise<ShippingCalculationResult> {
    const [cart, zone] = await Promise.all([
      this.cartService.getCartWithItems(input.cartId),
      this.findZoneForCountry(input.countryCode),
    ]);

    if (!zone) {
      throw new BadRequestException('Shipping not available to this location');
    }

    const cartValue = this.calculateCartValue(cart);
    const cartWeight = this.calculateCartWeight(cart);

    const availableRates = zone.rates.map((rate) => {
      const calculatedPrice = this.calculateRatePrice(rate, cartValue, cartWeight);
      const isFree = rate.minOrderValue && cartValue >= rate.minOrderValue;

      return {
        rateId: rate.id,
        name: rate.name,
        price: isFree ? 0 : calculatedPrice,
        originalPrice: calculatedPrice,
        isFree,
        estimatedDaysMin: rate.estimatedDaysMin,
        estimatedDaysMax: rate.estimatedDaysMax,
        estimatedDeliveryDate: this.calculateDeliveryDate(
          rate.estimatedDaysMin,
          rate.estimatedDaysMax,
        ),
      };
    });

    // Sort by price, recommend cheapest
    availableRates.sort((a, b) => a.price - b.price);

    return {
      zoneId: zone.id,
      zoneName: zone.name,
      availableRates,
      recommendedRateId: availableRates[0]?.rateId,
    };
  }

  protected calculateRatePrice(
    rate: ShippingRate,
    cartValue: number,
    cartWeight: number,
  ): number {
    switch (rate.type) {
      case 'flat':
        return rate.price;

      case 'weight_based':
        // Price per kg, rounded up
        const weightKg = Math.ceil(cartWeight / 1000);
        return rate.price * weightKg;

      case 'price_based':
        // Percentage of cart value
        return Math.round(cartValue * (rate.price / 10000));

      default:
        return rate.price;
    }
  }

  protected calculateDeliveryDate(
    minDays: number,
    maxDays: number,
  ): { min: Date; max: Date } {
    const today = new Date();
    return {
      min: addBusinessDays(today, minDays),
      max: addBusinessDays(today, maxDays),
    };
  }

  // Quick estimate without full address (for cart preview)
  protected async getQuickEstimate(cartId: string): Promise<QuickEstimate | null> {
    // Use GeoIP or default zone for rough estimate
    const defaultZone = await this.prisma.shippingZone.findFirst({
      where: { isDefault: true },
      include: { rates: { take: 1, orderBy: { price: 'asc' } } },
    });

    if (!defaultZone?.rates[0]) return null;

    return {
      minDays: defaultZone.rates[0].estimatedDaysMin,
      maxDays: defaultZone.rates[0].estimatedDaysMax,
      price: defaultZone.rates[0].price,
    };
  }
}
```

#### tRPC Router (`apps/api/src/trpc/routers/shipping.router.ts`)
```typescript
export const shippingRouter = router({
  calculateRates: publicProcedure
    .input(ShippingCalculationInputSchema)
    .query(async ({ ctx, input }) => {
      return ctx.shippingService.calculateRates(input);
    }),

  quickEstimate: publicProcedure
    .input(z.object({ cartId: CartIdSchema }))
    .query(async ({ ctx, input }) => {
      return ctx.shippingService.getQuickEstimate(input.cartId);
    }),
});
```

#### Storefront Data Flow
```
┌────────────────────────────────────────────────────────────────────┐
│ Checkout Page - Shipping Step                                       │
│ ┌────────────────────────────────────────────────────────────────┐ │
│ │ AddressForm (Client Component)                                 │ │
│ │   └─ onCountryChange/onPostalCodeChange:                       │ │
│ │       │                                                        │ │
│ │       ▼                                                        │ │
│ │   trpc.shipping.calculateRates.useQuery({                      │ │
│ │     cartId, countryCode, postalCode                            │ │
│ │   })                                                           │ │
│ │       │                                                        │ │
│ │       ▼                                                        │ │
│ │   ShippingMethodSelector updates with available rates          │ │
│ └────────────────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────────────────┐ │
│ │ ShippingMethodSelector (Client Component)                      │ │
│ │   ├─ Radio group of available shipping methods                 │ │
│ │   ├─ Each option shows: name, price, delivery estimate         │ │
│ │   ├─ Free shipping badge when threshold met                    │ │
│ │   └─ Recommended rate pre-selected                             │ │
│ └────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

#### Shipping Method Selector (`apps/storefront/src/components/checkout/shipping-method-selector.tsx`)
```typescript
'use client';

export function ShippingMethodSelector({
  cartId,
  countryCode,
  postalCode,
  onSelect,
}: ShippingMethodSelectorProps) {
  const { data, isLoading } = trpc.shipping.calculateRates.useQuery(
    { cartId, countryCode, postalCode },
    { enabled: !!countryCode },
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Auto-select recommended rate
  useEffect(() => {
    if (data?.recommendedRateId && !selectedId) {
      setSelectedId(data.recommendedRateId);
      onSelect(data.recommendedRateId);
    }
  }, [data?.recommendedRateId]);

  if (isLoading) {
    return <Skeleton className="h-32" />;
  }

  if (!data?.availableRates.length) {
    return <p className="text-muted-foreground">No shipping available</p>;
  }

  return (
    <RadioGroup value={selectedId} onValueChange={(id) => {
      setSelectedId(id);
      onSelect(id);
    }}>
      {data.availableRates.map((rate) => (
        <div key={rate.rateId} className="flex items-center space-x-3 p-4 border rounded-lg">
          <RadioGroupItem value={rate.rateId} id={rate.rateId} />
          <Label htmlFor={rate.rateId} className="flex-1 cursor-pointer">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{rate.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDeliveryDate(rate.estimatedDeliveryDate)}
                </p>
              </div>
              <div className="text-right">
                {rate.isFree ? (
                  <Badge variant="success">Free</Badge>
                ) : (
                  <span className="font-medium">{formatCents(rate.price)}</span>
                )}
              </div>
            </div>
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}
```

#### UX Implementation Notes
- **Performance**: Calculation cached for 5 minutes per cart+destination combo
- **Free Shipping**: Strike through original price, show "Free" badge in green
- **Delivery Dates**: Show range like "Wed, Jan 15 - Fri, Jan 17"
- **Loading State**: Skeleton while calculating (max 200ms target)
- **Error State**: "Shipping not available to this location" with support link
- **Recommended**: Pre-select cheapest option, but show all available

---

