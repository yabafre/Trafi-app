## Story 4.6: Tax Calculation Engine

As a **System**,
I want **to calculate applicable taxes based on buyer location**,
So that **prices are legally compliant and transparent**.

**Acceptance Criteria:**

**Given** a cart and buyer location
**When** taxes are calculated
**Then** the system applies:
- Tax rules based on destination country/region
- Product-specific tax categories
- Tax-inclusive or tax-exclusive display per store config
**And** tax breakdown is visible in cart and checkout
**And** calculation handles EU VAT requirements
**And** tax amounts are stored in cents

### Technical Implementation

#### File Structure
```
apps/api/src/
├── tax/
│   ├── tax.module.ts
│   ├── tax.service.ts                 # Tax calculation engine
│   ├── tax-rates.service.ts           # Tax rate lookups
│   ├── dto/
│   │   ├── calculate-tax.dto.ts
│   │   └── tax-breakdown.dto.ts
│   └── data/
│       └── tax-rates.ts               # Default tax rates by region

apps/dashboard/src/app/(dashboard)/settings/taxes/
├── page.tsx
├── _components/
│   ├── tax-settings-form.tsx          # Tax display configuration
│   ├── tax-rates-table.tsx            # Custom tax rate overrides
│   └── tax-categories-list.tsx        # Product tax categories
```

#### Zod Schemas (`@trafi/validators`)
```typescript
// packages/validators/src/tax.ts
export const TaxCategorySchema = z.enum([
  'standard',
  'reduced',
  'zero',
  'exempt',
  'digital_goods',
  'food_beverage',
]);

export const TaxCalculationInputSchema = z.object({
  cartId: CartIdSchema,
  shippingAddress: z.object({
    countryCode: z.string().length(2),
    stateCode: z.string().optional(),
    postalCode: z.string().optional(),
  }),
  shippingPrice: z.number().int().optional(), // Cents
});

export const TaxLineItemSchema = z.object({
  productId: z.string().startsWith('prod_'),
  variantId: z.string().startsWith('var_'),
  taxCategory: TaxCategorySchema,
  taxableAmount: z.number().int(),       // Cents (ARCH-25)
  taxRate: z.number(),                    // Decimal (e.g., 0.20 for 20%)
  taxAmount: z.number().int(),            // Cents
  taxName: z.string(),                    // e.g., "VAT", "Sales Tax"
});

export const TaxCalculationResultSchema = z.object({
  subtotal: z.number().int(),             // Cents
  shippingTax: z.number().int(),          // Cents
  lineItems: z.array(TaxLineItemSchema),
  totalTax: z.number().int(),             // Cents
  taxInclusive: z.boolean(),              // Whether prices include tax
  taxBreakdown: z.array(z.object({
    name: z.string(),
    rate: z.number(),
    amount: z.number().int(),
  })),
});
```

#### Backend Service (`apps/api/src/tax/tax.service.ts`)
```typescript
@Injectable()
export class TaxService {
  constructor(
    private prisma: PrismaService,
    private taxRatesService: TaxRatesService,
  ) {}

  // Protected for @trafi/core extensibility (RETRO-2)
  protected async calculateTax(
    input: TaxCalculationInput,
  ): Promise<TaxCalculationResult> {
    const cart = await this.prisma.cart.findUnique({
      where: { id: input.cartId },
      include: {
        items: {
          include: {
            variant: {
              include: { product: { select: { taxCategory: true } } },
            },
          },
        },
      },
    });

    const store = await this.getStoreSettings();
    const taxInclusive = store.pricesIncludeTax;

    // Get applicable tax rate for destination
    const taxRate = await this.taxRatesService.getRateForLocation(
      input.shippingAddress,
    );

    const lineItems: TaxLineItem[] = [];
    let totalTax = 0;

    for (const item of cart.items) {
      const category = item.variant.product.taxCategory ?? 'standard';
      const categoryRate = this.getCategoryRate(taxRate, category);

      const taxableAmount = item.priceAtAddition * item.quantity;
      const taxAmount = this.calculateTaxAmount(
        taxableAmount,
        categoryRate,
        taxInclusive,
      );

      lineItems.push({
        productId: item.variant.productId,
        variantId: item.variantId,
        taxCategory: category,
        taxableAmount,
        taxRate: categoryRate,
        taxAmount,
        taxName: taxRate.name,
      });

      totalTax += taxAmount;
    }

    // Calculate shipping tax (if applicable)
    const shippingTax = input.shippingPrice
      ? this.calculateTaxAmount(input.shippingPrice, taxRate.shippingRate, taxInclusive)
      : 0;

    totalTax += shippingTax;

    // Build tax breakdown for display
    const taxBreakdown = this.buildTaxBreakdown(lineItems, shippingTax);

    return {
      subtotal: cart.items.reduce((sum, i) => sum + i.priceAtAddition * i.quantity, 0),
      shippingTax,
      lineItems,
      totalTax,
      taxInclusive,
      taxBreakdown,
    };
  }

  protected calculateTaxAmount(
    amount: number,
    rate: number,
    inclusive: boolean,
  ): number {
    if (inclusive) {
      // Extract tax from inclusive price: price / (1 + rate) * rate
      return Math.round(amount - amount / (1 + rate));
    } else {
      // Add tax to exclusive price: price * rate
      return Math.round(amount * rate);
    }
  }

  protected getCategoryRate(taxRate: TaxRate, category: TaxCategory): number {
    switch (category) {
      case 'exempt':
      case 'zero':
        return 0;
      case 'reduced':
        return taxRate.reducedRate ?? taxRate.standardRate;
      case 'digital_goods':
        return taxRate.digitalRate ?? taxRate.standardRate;
      case 'food_beverage':
        return taxRate.foodRate ?? taxRate.reducedRate ?? taxRate.standardRate;
      default:
        return taxRate.standardRate;
    }
  }

  // Quick estimate for cart display (before address known)
  protected async estimateForCart(
    cartId: string,
    subtotal: number,
  ): Promise<number> {
    const store = await this.getStoreSettings();
    // Use store's default tax rate for estimate
    const defaultRate = store.defaultTaxRate ?? 0;
    return Math.round(subtotal * defaultRate);
  }
}
```

#### Tax Rates Service (`apps/api/src/tax/tax-rates.service.ts`)
```typescript
@Injectable()
export class TaxRatesService {
  // EU VAT rates built-in
  private readonly EU_VAT_RATES: Record<string, TaxRate> = {
    FR: { name: 'TVA', standardRate: 0.20, reducedRate: 0.055, shippingRate: 0.20 },
    DE: { name: 'MwSt', standardRate: 0.19, reducedRate: 0.07, shippingRate: 0.19 },
    ES: { name: 'IVA', standardRate: 0.21, reducedRate: 0.10, shippingRate: 0.21 },
    IT: { name: 'IVA', standardRate: 0.22, reducedRate: 0.10, shippingRate: 0.22 },
    // ... other EU countries
  };

  // Protected for @trafi/core extensibility (RETRO-2)
  protected async getRateForLocation(
    address: { countryCode: string; stateCode?: string },
  ): Promise<TaxRate> {
    // 1. Check for custom rate override in store settings
    const customRate = await this.prisma.taxRateOverride.findFirst({
      where: {
        countryCode: address.countryCode,
        stateCode: address.stateCode ?? null,
      },
    });

    if (customRate) {
      return customRate;
    }

    // 2. Use built-in EU VAT rates
    if (this.EU_VAT_RATES[address.countryCode]) {
      return this.EU_VAT_RATES[address.countryCode];
    }

    // 3. US sales tax (would need Avalara/TaxJar integration for accuracy)
    if (address.countryCode === 'US') {
      return this.getUSSalesTax(address.stateCode);
    }

    // 4. Default: no tax
    return { name: 'Tax', standardRate: 0, shippingRate: 0 };
  }
}
```

#### tRPC Router (`apps/api/src/trpc/routers/tax.router.ts`)
```typescript
export const taxRouter = router({
  calculate: publicProcedure
    .input(TaxCalculationInputSchema)
    .query(async ({ ctx, input }) => {
      return ctx.taxService.calculateTax(input);
    }),

  estimate: publicProcedure
    .input(z.object({ cartId: CartIdSchema, subtotal: z.number().int() }))
    .query(async ({ ctx, input }) => {
      return ctx.taxService.estimateForCart(input.cartId, input.subtotal);
    }),
});
```

#### Dashboard Data Flow (Tax Settings)
```
┌─────────────────────────────────────────────────────────────────────┐
│ Settings > Taxes Page (RSC)                                         │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ TaxSettingsForm (Client Component)                              │ │
│ │   ├─ "Prices include tax" toggle                                │ │
│ │   ├─ Default tax rate input                                     │ │
│ │   ├─ Tax display format (e.g., "incl. VAT", "excl. tax")        │ │
│ │   └─ Save → updateTaxSettingsAction                             │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ TaxRatesTable (Client Component)                                │ │
│ │   ├─ DataTable of tax rate overrides                            │ │
│ │   ├─ Add custom rate for specific country/region                │ │
│ │   └─ Built-in EU VAT rates shown (read-only)                    │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ TaxCategoriesList (Client Component)                            │ │
│ │   ├─ List of available tax categories                           │ │
│ │   └─ Products can be assigned to categories                     │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

#### Tax Display Component (`apps/storefront/src/components/checkout/tax-breakdown.tsx`)
```typescript
'use client';

export function TaxBreakdown({ taxResult }: TaxBreakdownProps) {
  if (!taxResult.totalTax) {
    return null;
  }

  return (
    <div className="space-y-2">
      {taxResult.taxBreakdown.map((tax, index) => (
        <div key={index} className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {tax.name} ({(tax.rate * 100).toFixed(0)}%)
          </span>
          <span>{formatCents(tax.amount)}</span>
        </div>
      ))}
      {taxResult.taxInclusive && (
        <p className="text-xs text-muted-foreground">
          Prices include tax
        </p>
      )}
    </div>
  );
}
```

#### UX Implementation Notes
- **Tax Inclusive Display**: When prices include tax, show "(incl. VAT)" next to prices
- **Tax Breakdown**: In checkout summary, show each tax type separately (e.g., VAT 20%, Reduced 5.5%)
- **EU Compliance**: Support MOSS (Mini One-Stop Shop) for digital goods
- **Rounding**: All tax amounts rounded to nearest cent, with rounding adjustments tracked
- **Performance**: Tax rates cached per country/state combo, recalculated when cart changes
- **Error Handling**: If tax cannot be calculated, show estimate with disclaimer

---

