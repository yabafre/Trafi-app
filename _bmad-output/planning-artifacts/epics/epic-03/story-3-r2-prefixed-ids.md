## Story 3.R2: Prefixed IDs Foundation

As a **Developer**,
I want **all database IDs to be automatically prefixed with domain identifiers**,
So that **IDs are self-documenting and debugging is easier**.

**Acceptance Criteria:**

**Given** any Prisma create operation
**When** no ID is provided in the input data
**Then** a prefixed ID is automatically generated
**And** the format is `{prefix}_{nanoid}` (e.g., `prod_abc123xyz...`)
**And** all 65+ planned models have prefixes configured
**And** existing manual ID generation is removed from services
**And** nested writes also receive prefixed IDs automatically

---

### Technical Implementation

#### ID Prefix Configuration (`apps/api/src/database/id-prefixes.config.ts`)
```typescript
/**
 * Centralized ID Prefix Configuration
 * All Trafi models use prefixed IDs for better debugging and self-documentation.
 * Format: {prefix}_{nanoid} (e.g., prod_abc123xyz...)
 */

export const ID_PREFIXES: Record<string, string> = {
  // Core
  Store: 'store',
  User: 'usr',
  StoreSettings: 'stset',
  ApiKey: 'apikey',
  AuditLog: 'audit',
  OwnershipTransfer: 'owntx',

  // Products (Epic 3)
  Product: 'prod',
  ProductVariant: 'var',
  ProductMedia: 'med',
  Category: 'cat',
  Collection: 'col',
  TaxRule: 'tax',
  InventoryHistory: 'invh',

  // Marketing (Epic 3)
  Promotion: 'promo',
  PromotionRule: 'prule',
  PromotionAction: 'pact',
  Coupon: 'coup',
  PromotionUsage: 'puse',
  GiftCard: 'gc',
  GiftCardTransaction: 'gctx',
  GiftCardTemplate: 'gctpl',

  // Cart & Checkout (Epic 4)
  Cart: 'cart',
  CartItem: 'citem',
  CheckoutSession: 'chk',

  // ... (see full config for all 65+ models)
};

export function getIdPrefix(modelName: string): string | null {
  return ID_PREFIXES[modelName] ?? null;
}
```

#### Prisma Extension (`apps/api/src/database/prefixed-ids.extension.ts`)
```typescript
import { Prisma } from '@generated/prisma/client';
import { nanoid } from 'nanoid';
import { getIdPrefix } from './id-prefixes.config';

/**
 * Generate a prefixed ID for a model
 */
export function generatePrefixedId(modelName: string): string | null {
  const prefix = getIdPrefix(modelName);
  if (!prefix) return null;
  return `${prefix}_${nanoid(21)}`;
}

/**
 * Prisma extension that automatically generates prefixed IDs
 * on all create operations (create, createMany, upsert)
 */
export const prefixedIdsExtension = Prisma.defineExtension({
  name: 'prefixed-ids',
  query: {
    $allModels: {
      async create({ model, args, query }) {
        if (args.data && !args.data.id) {
          const id = generatePrefixedId(model);
          if (id) args.data = { ...args.data, id };
        }
        return query(args);
      },
      async createMany({ model, args, query }) {
        // Process each item in the data array
        if (args.data) {
          args.data = processCreateData(model, args.data);
        }
        return query(args);
      },
      async upsert({ model, args, query }) {
        if (args.create && !args.create.id) {
          const id = generatePrefixedId(model);
          if (id) args.create = { ...args.create, id };
        }
        return query(args);
      },
    },
  },
});
```

#### PrismaService Integration
```typescript
// apps/api/src/database/prisma.service.ts
import { prefixedIdsExtension } from './prefixed-ids.extension';

function createExtendedClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL as string,
  });
  const baseClient = new PrismaClient({ adapter });
  return baseClient.$extends(prefixedIdsExtension);
}

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly client: ExtendedPrismaClient;

  constructor() {
    this.client = createExtendedClient();
  }

  // Delegate model accessors to extended client
  get product() { return this.client.product; }
  get store() { return this.client.store; }
  // ... other models
}
```

#### Service Updates
```typescript
// apps/api/src/modules/products/products.service.ts
// REMOVED: Manual ID generation
// - protected generateProductId(): string { ... }
// - const id = this.generateProductId();

// UPDATED: Let extension handle ID generation
async create(storeId: string, input: CreateProductInput) {
  // No id passed - extension generates it automatically
  const product = await this.prisma.product.create({
    data: {
      storeId,
      name: input.name,
      slug,
      // ... other fields
      // id is auto-generated as prod_xxx
    },
  });
}
```

#### Dependencies
```bash
pnpm add nanoid --filter @trafi/api
```

#### File Structure
```
apps/api/src/database/
├── database.module.ts
├── prisma.service.ts          # Updated with extension
├── id-prefixes.config.ts      # NEW: All model prefixes
├── prefixed-ids.extension.ts  # NEW: Prisma extension
└── index.ts                   # Exports
```

#### Verification Steps
1. Run tests: `pnpm test --filter @trafi/api`
2. Create a product via tRPC and verify ID format: `prod_...`
3. Create nested records and verify all have correct prefixes
4. Check logs show prefixed IDs on create operations
