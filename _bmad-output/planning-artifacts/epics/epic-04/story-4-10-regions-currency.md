## Story 4.10: Regions & Multi-Currency Foundation

As a **Merchant**,
I want **to configure regions and support multiple currencies**,
So that **I can sell internationally with localized pricing**.

**Acceptance Criteria:**

**Given** a Merchant accesses Region settings
**When** they configure regions
**Then** they can:
- Create regions (e.g., "European Union", "North America")
- Assign countries to regions
- Set default currency per region
- Configure tax inclusion settings per region
**And** customers see prices in their regional currency
**And** checkout respects regional shipping and tax rules

**FRs covered:** FR114, FR115, FR116, FR117, FR118

---

### Technical Implementation

#### Prisma Schema (`apps/api/prisma/schema/region.prisma`)
```prisma
// =============================================================================
// Regions & Multi-Currency Domain Schema
// =============================================================================
// Geographic regions with localized settings
// ID prefix: reg_, ctry_, curr_, exr_, plist_, plp_
// =============================================================================

enum ExchangeRateSource {
  MANUAL
  AUTOMATIC
  API
}

enum PriceListType {
  SALE
  OVERRIDE
  WHOLESALE
  REGIONAL
}

enum PriceListStatus {
  DRAFT
  ACTIVE
  EXPIRED
  ARCHIVED
}

model Region {
  id                  String      @id @default(cuid())
  storeId             String      @map("store_id")
  name                String
  slug                String
  currencyCode        String      @map("currency_code")
  taxIncluded         Boolean     @default(true) @map("tax_included")
  taxRate             Int?        @map("tax_rate")        // Percentage * 100
  paymentProviders    String[]    @map("payment_providers")
  fulfillmentProviders String[]   @map("fulfillment_providers")
  isDefault           Boolean     @default(false) @map("is_default")
  isActive            Boolean     @default(true) @map("is_active")
  metadata            Json?
  createdAt           DateTime    @default(now()) @map("created_at")
  updatedAt           DateTime    @updatedAt @map("updated_at")

  // Relations
  store               Store       @relation(fields: [storeId], references: [id], onDelete: Cascade)
  countries           Country[]
  priceLists          PriceList[]

  @@unique([storeId, slug])
  @@index([storeId])
  @@index([storeId, isActive])
  @@map("regions")
}

model Country {
  id                  String      @id @default(cuid())
  storeId             String      @map("store_id")
  regionId            String      @map("region_id")
  iso2                String
  iso3                String
  name                String
  displayName         String?     @map("display_name")
  numericCode         Int         @map("numeric_code")
  taxRate             Int?        @map("tax_rate")       // Override region tax
  requiresPostalCode  Boolean     @default(true) @map("requires_postal_code")
  postalCodeFormat    String?     @map("postal_code_format")
  isActive            Boolean     @default(true) @map("is_active")
  createdAt           DateTime    @default(now()) @map("created_at")
  updatedAt           DateTime    @updatedAt @map("updated_at")

  // Relations
  store               Store       @relation(fields: [storeId], references: [id], onDelete: Cascade)
  region              Region      @relation(fields: [regionId], references: [id], onDelete: Cascade)

  @@unique([storeId, iso2])
  @@index([storeId])
  @@index([regionId])
  @@map("countries")
}

model Currency {
  id                  String      @id @default(cuid())
  storeId             String      @map("store_id")
  code                String                              // ISO 4217
  name                String
  symbol              String
  symbolNative        String      @map("symbol_native")
  decimalDigits       Int         @default(2) @map("decimal_digits")
  rounding            Int         @default(0)
  isDefault           Boolean     @default(false) @map("is_default")
  isActive            Boolean     @default(true) @map("is_active")
  createdAt           DateTime    @default(now()) @map("created_at")
  updatedAt           DateTime    @updatedAt @map("updated_at")

  // Relations
  store               Store       @relation(fields: [storeId], references: [id], onDelete: Cascade)
  exchangeRatesFrom   ExchangeRate[] @relation("FromCurrency")
  exchangeRatesTo     ExchangeRate[] @relation("ToCurrency")

  @@unique([storeId, code])
  @@index([storeId])
  @@index([storeId, isActive])
  @@map("currencies")
}

model ExchangeRate {
  id                  String              @id @default(cuid())
  storeId             String              @map("store_id")
  fromCurrencyCode    String              @map("from_currency_code")
  toCurrencyCode      String              @map("to_currency_code")
  rate                Decimal             @db.Decimal(18, 8)
  source              ExchangeRateSource  @default(MANUAL)
  validFrom           DateTime            @map("valid_from")
  validTo             DateTime?           @map("valid_to")
  createdAt           DateTime            @default(now()) @map("created_at")
  updatedAt           DateTime            @updatedAt @map("updated_at")

  // Relations
  store               Store               @relation(fields: [storeId], references: [id], onDelete: Cascade)
  fromCurrency        Currency            @relation("FromCurrency", fields: [storeId, fromCurrencyCode], references: [storeId, code])
  toCurrency          Currency            @relation("ToCurrency", fields: [storeId, toCurrencyCode], references: [storeId, code])

  @@unique([storeId, fromCurrencyCode, toCurrencyCode, validFrom])
  @@index([storeId])
  @@index([storeId, fromCurrencyCode, toCurrencyCode])
  @@map("exchange_rates")
}

model PriceList {
  id                  String          @id @default(cuid())
  storeId             String          @map("store_id")
  name                String
  description         String?
  type                PriceListType
  status              PriceListStatus @default(DRAFT)
  currencyCode        String          @map("currency_code")
  startsAt            DateTime?       @map("starts_at")
  endsAt              DateTime?       @map("ends_at")
  regionId            String?         @map("region_id")
  customerGroupId     String?         @map("customer_group_id")
  priority            Int             @default(0)
  includesTax         Boolean         @default(true) @map("includes_tax")
  createdAt           DateTime        @default(now()) @map("created_at")
  updatedAt           DateTime        @updatedAt @map("updated_at")

  // Relations
  store               Store           @relation(fields: [storeId], references: [id], onDelete: Cascade)
  region              Region?         @relation(fields: [regionId], references: [id])
  prices              PriceListPrice[]

  @@index([storeId])
  @@index([storeId, status])
  @@index([regionId])
  @@map("price_lists")
}

model PriceListPrice {
  id                  String      @id @default(cuid())
  priceListId         String      @map("price_list_id")
  productId           String      @map("product_id")
  variantId           String?     @map("variant_id")
  priceInCents        Int         @map("price_in_cents")
  minQuantity         Int?        @map("min_quantity")
  maxQuantity         Int?        @map("max_quantity")
  createdAt           DateTime    @default(now()) @map("created_at")
  updatedAt           DateTime    @updatedAt @map("updated_at")

  // Relations
  priceList           PriceList   @relation(fields: [priceListId], references: [id], onDelete: Cascade)

  @@unique([priceListId, productId, variantId, minQuantity])
  @@index([priceListId])
  @@index([productId])
  @@map("price_list_prices")
}
```

#### Zod Schemas (`@trafi/validators`)
```typescript
// packages/validators/src/region/region.schema.ts
import { z } from 'zod';

export const CreateRegionSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  currencyCode: z.string().length(3),
  taxIncluded: z.boolean().default(true),
  taxRate: z.number().int().min(0).max(10000).optional(), // 0-100%
  isDefault: z.boolean().default(false),
});

export const CreateCountrySchema = z.object({
  regionId: z.string(),
  iso2: z.string().length(2),
  iso3: z.string().length(3),
  name: z.string().min(1).max(100),
  displayName: z.string().max(100).optional(),
  numericCode: z.number().int(),
  taxRate: z.number().int().min(0).max(10000).optional(),
  requiresPostalCode: z.boolean().default(true),
  postalCodeFormat: z.string().optional(),
});

export const CreateCurrencySchema = z.object({
  code: z.string().length(3),
  name: z.string().min(1).max(50),
  symbol: z.string().min(1).max(5),
  symbolNative: z.string().min(1).max(5),
  decimalDigits: z.number().int().min(0).max(4).default(2),
  rounding: z.number().int().min(0).default(0),
  isDefault: z.boolean().default(false),
});

export const CreatePriceListSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['SALE', 'OVERRIDE', 'WHOLESALE', 'REGIONAL']),
  currencyCode: z.string().length(3),
  startsAt: z.date().optional(),
  endsAt: z.date().optional(),
  regionId: z.string().optional(),
  customerGroupId: z.string().optional(),
  priority: z.number().int().default(0),
  includesTax: z.boolean().default(true),
});

export const SetPriceListPriceSchema = z.object({
  priceListId: z.string(),
  productId: z.string(),
  variantId: z.string().optional(),
  priceInCents: z.number().int().positive(),
  minQuantity: z.number().int().positive().optional(),
  maxQuantity: z.number().int().positive().optional(),
});
```

#### Backend Service (`apps/api/src/modules/regions/regions.service.ts`)
```typescript
@Injectable()
export class RegionsService {
  constructor(
    private prisma: PrismaService,
    private idService: IdService,
  ) {}

  // Protected for @trafi/core extensibility (RETRO-2)
  protected async create(storeId: string, input: CreateRegionInput): Promise<Region> {
    // If setting as default, unset other defaults
    if (input.isDefault) {
      await this.prisma.region.updateMany({
        where: { storeId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.region.create({
      data: {
        id: this.idService.generate('reg'),
        storeId,
        ...input,
      },
      include: { countries: true },
    });
  }

  protected async detectRegion(storeId: string, countryCode: string): Promise<Region | null> {
    const country = await this.prisma.country.findUnique({
      where: { storeId_iso2: { storeId, iso2: countryCode.toUpperCase() } },
      include: { region: true },
    });

    if (country?.region) {
      return country.region;
    }

    // Fall back to default region
    return this.prisma.region.findFirst({
      where: { storeId, isDefault: true },
    });
  }

  protected async convertPrice(
    storeId: string,
    amountCents: number,
    fromCurrency: string,
    toCurrency: string,
  ): Promise<number> {
    if (fromCurrency === toCurrency) return amountCents;

    const rate = await this.prisma.exchangeRate.findFirst({
      where: {
        storeId,
        fromCurrencyCode: fromCurrency,
        toCurrencyCode: toCurrency,
        validFrom: { lte: new Date() },
        OR: [
          { validTo: null },
          { validTo: { gt: new Date() } },
        ],
      },
      orderBy: { validFrom: 'desc' },
    });

    if (!rate) {
      throw new BadRequestException(`No exchange rate found for ${fromCurrency} to ${toCurrency}`);
    }

    return Math.round(amountCents * Number(rate.rate));
  }
}
```

#### UX Implementation Notes
- **Region management**: Dashboard page at Settings > Regions
- **Country picker**: Multi-select with search, grouped by region
- **Currency display**: Preview with sample prices
- **Price lists**: Visual editor with bulk import/export
- **Storefront**: Automatic region detection via IP geolocation
