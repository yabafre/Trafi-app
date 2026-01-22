## Story 3.6: Product Pricing and Tax Rules

As a **Merchant**,
I want **to set product prices with tax configuration**,
So that **prices display correctly with applicable taxes**.

**Acceptance Criteria:**

**Given** a product variant exists
**When** the Merchant sets pricing
**Then** they can configure:
- Base price (stored in cents - ARCH-25)
- Compare-at price for sales display
- Cost price for margin calculation
- Tax inclusion setting (price includes tax or not)
**And** tax rules can be assigned per product
**And** prices support the store's default currency

---

### Technical Implementation

#### Zod Schemas (@trafi/validators)
```typescript
// packages/@trafi/validators/src/pricing/index.ts
export const PricingSchema = z.object({
  priceInCents: z.number().int().positive(),           // ARCH-25: all money in cents
  compareAtPriceInCents: z.number().int().positive().optional(), // Strike-through price
  costPriceInCents: z.number().int().nonnegative().optional(),   // For margin calc
  taxIncluded: z.boolean().default(true),              // EU default: tax included
  taxRuleId: z.string().optional(),                    // Link to TaxRule
});

export const TaxRuleSchema = z.object({
  id: z.string(),
  name: z.string(),                                    // "TVA Standard", "TVA Réduit"
  rate: z.number().min(0).max(100),                    // e.g., 20 for 20%
  countryCode: z.string().length(2),                   // "FR", "DE"
  isDefault: z.boolean().default(false),
});

export const UpdateVariantPricingSchema = z.object({
  variantId: z.string(),
  ...PricingSchema.shape,
});
```

#### Price Calculation Service (NestJS)
```typescript
// apps/api/src/modules/pricing/pricing.service.ts
@Injectable()
export class PricingService {
  // Protected for @trafi/core extensibility
  protected calculateTax(priceInCents: number, taxRate: number, taxIncluded: boolean): {
    netPriceInCents: number;
    taxAmountInCents: number;
    grossPriceInCents: number;
  } {
    if (taxIncluded) {
      // Price already includes tax, extract it
      const netPriceInCents = Math.round(priceInCents / (1 + taxRate / 100));
      const taxAmountInCents = priceInCents - netPriceInCents;
      return { netPriceInCents, taxAmountInCents, grossPriceInCents: priceInCents };
    } else {
      // Price is net, add tax
      const taxAmountInCents = Math.round(priceInCents * (taxRate / 100));
      return {
        netPriceInCents: priceInCents,
        taxAmountInCents,
        grossPriceInCents: priceInCents + taxAmountInCents,
      };
    }
  }

  protected calculateMargin(priceInCents: number, costPriceInCents: number | null): {
    marginInCents: number;
    marginPercent: number;
  } | null {
    if (!costPriceInCents || costPriceInCents === 0) return null;
    const marginInCents = priceInCents - costPriceInCents;
    const marginPercent = Math.round((marginInCents / priceInCents) * 100);
    return { marginInCents, marginPercent };
  }

  formatPrice(cents: number, currency: string = 'EUR', locale: string = 'fr-FR'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(cents / 100);
  }
}
```

#### Dashboard Data Flow
```
PricingSection.tsx (Client)
  └─► Price input in euros, converted to cents on save
       └─► useUpdateVariantPricing() hook
            └─► trpc.variants.update.mutate({ priceInCents })
```

#### Key Implementation Notes
- **All prices stored in cents** (ARCH-25) - prevents floating point issues
- **Currency formatting:** `Intl.NumberFormat` for display
- **Tax calculation:** Server-side for consistency
- **Margin display:** Real-time calculation as cost price is entered

---

### UX Implementation

- **Price input:** Shows € symbol, user enters decimal (e.g., "29.99"), converted to 2999 cents
- **Compare-at price:** Shows strikethrough preview
- **Margin display:** Real-time percentage badge next to cost price
- **Tax toggle:** Switch for "Prix TTC" / "Prix HT"
- **Validation:** Red border if price is 0 or negative

---

