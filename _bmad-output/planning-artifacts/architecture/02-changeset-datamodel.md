## Autopilot ChangeSet: Executable Artifact

_Added in revision 2026-01-14 - The standardized artifact that enables autonomous execution_

Every Autopilot action is encapsulated in a **ChangeSet** — a structured, auditable, reversible artifact that transforms recommendations into executable actions.

### ChangeSet Interface

```typescript
// @trafi/types/src/profit-engine/changeset.types.ts
interface AutopilotChangeSet {
  // Identity
  id: string;                          // UUID (cuid)
  version: number;                     // Increments on modification
  createdAt: Date;
  storeId: string;                     // Tenant scope

  // Hypothesis
  hypothesis: {
    problem: string;                   // "42% cart abandonment at shipping step"
    expectedOutcome: string;           // "Reduce abandonment by 15-25%"
    confidenceLevel: 'low' | 'medium' | 'high';
    dataEvidence: DataPoint[];         // Supporting metrics
  };

  // Action Plan
  actionPlan: {
    type: 'feature_flag' | 'workflow' | 'copy_change' | 'timing_change' | 'segment_target';
    targetSegment: SegmentDefinition;  // Who sees this change
    implementation: {
      featureFlagKey?: string;
      workflowId?: string;
      changes: ChangeDetail[];         // Specific modifications
    };
    rolloutStrategy: 'immediate' | 'gradual' | 'holdout';
    rolloutPercentage?: number;        // For gradual rollout
  };

  // Guardrails
  guardrails: {
    profitFloor: number;               // Minimum margin % to maintain
    stockThreshold?: number;           // Don't deplete below X units
    sloRequirements: SLOCheck[];       // System health gates
    riskLevel: 'low' | 'medium' | 'high';
    blockedConditions: string[];       // Conditions that block execution
  };

  // Rollback Plan
  rollbackPlan: {
    autoRollbackTriggers: MetricTrigger[];  // When to auto-revert
    manualRollbackEnabled: boolean;
    rollbackProcedure: string;              // Step-by-step instructions
    estimatedRollbackTime: string;          // "< 5 minutes"
  };

  // Proof Plan
  proofPlan: {
    primaryMetrics: MetricDefinition[];     // What we're optimizing
    secondaryMetrics: MetricDefinition[];   // Guard metrics
    holdoutPercentage: number;              // Control group size (typically 10-20%)
    statisticalMethod: 'cuped' | 'bayesian' | 'frequentist';
    minimumSampleSize: number;
    measurementWindow: string;              // "14 days"
    significanceThreshold: number;          // p < 0.05
  };

  // Approval
  approval: {
    status: 'pending' | 'approved' | 'rejected' | 'expired';
    approvedBy?: string;                    // User ID
    approvedAt?: Date;
    approvalNotes?: string;
    expiresAt?: Date;                       // Auto-expire if not approved
  };

  // Execution State
  execution: {
    status: 'draft' | 'pending_approval' | 'active' | 'measuring' | 'proven' | 'rolled_back' | 'permanent';
    startedAt?: Date;
    endedAt?: Date;
    currentMetrics?: LiveMetrics;
    proofResult?: ProofResult;
  };

  // Audit Trail
  auditTrail: AuditEvent[];                // All state changes logged
}
```

### ChangeSet Lifecycle

```
┌────────────────────────────────────────────────────────────────────────────┐
│                       CHANGESET LIFECYCLE                                  │
│                                                                            │
│  DRAFT → PENDING_APPROVAL → ACTIVE → MEASURING → [PROVEN | ROLLED_BACK]   │
│                                                           ↓               │
│                                                      PERMANENT             │
│                                                                            │
│  At each transition:                                                       │
│  • Guardrails checked (profitFloor, stockThreshold, SLO gates)            │
│  • Audit event logged (actor, timestamp, state change)                    │
│  • Notifications sent (if configured)                                      │
└────────────────────────────────────────────────────────────────────────────┘
```

### ChangeSet Database Schema

```prisma
// In apps/api/prisma/schema.prisma
model ChangeSet {
  id              String   @id @default(cuid())
  storeId         String
  version         Int      @default(1)

  // Content stored as JSONB for flexibility
  hypothesis      Json
  actionPlan      Json
  guardrails      Json
  rollbackPlan    Json
  proofPlan       Json

  // Approval tracking
  approvalStatus  ApprovalStatus @default(PENDING)
  approvedBy      String?
  approvedAt      DateTime?
  expiresAt       DateTime?

  // Execution state
  executionStatus ExecutionStatus @default(DRAFT)
  startedAt       DateTime?
  endedAt         DateTime?
  currentMetrics  Json?
  proofResult     Json?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  store           Store    @relation(fields: [storeId], references: [id])
  auditTrail      ChangeSetAudit[]

  @@index([storeId])
  @@index([executionStatus])
}

enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
  EXPIRED
}

enum ExecutionStatus {
  DRAFT
  PENDING_APPROVAL
  ACTIVE
  MEASURING
  PROVEN
  ROLLED_BACK
  PERMANENT
}
```

### ChangeSet Module Structure

```
apps/api/src/modules/profit-engine/
├── changeset/
│   ├── changeset.module.ts
│   ├── changeset.service.ts        # Core CRUD + state machine
│   ├── changeset.controller.ts     # REST API
│   ├── changeset.router.ts         # tRPC router
│   ├── changeset-executor.service.ts  # Executes actions
│   ├── changeset-validator.service.ts # Validates guardrails
│   └── __tests__/
```

## Data Model Reference

_Added in revision 2026-01-18 - Comprehensive database schema overview_

This section provides a complete reference of all Prisma models across the platform, organized by domain.

### Model Summary by Domain

| Domain | Models | ID Prefix | Primary Epic |
|--------|--------|-----------|--------------|
| **Foundation** | Store, StoreSettings | `store_`, `stset_` | Epic 1, 2 |
| **Auth/Users** | User, ApiKey, AuditLog | `usr_`, `apikey_` | Epic 2 |
| **Catalog** | Product, ProductVariant, ProductMedia, Category, Collection | `prod_`, `var_`, `med_`, `cat_`, `col_` | Epic 3 |
| **Inventory** | InventoryHistory, TaxRule | `invh_`, `tax_` | Epic 3 |
| **Marketing** | Promotion, PromotionRule, Coupon, GiftCard, GiftCardTransaction | `promo_`, `coup_`, `gc_`, `gctx_` | Epic 3 |
| **Cart/Checkout** | Cart, CartItem, CheckoutSession | `cart_`, `citem_`, `chk_` | Epic 4 |
| **Shipping** | ShippingZone, ShippingMethod, ShippingRate | `szone_`, `smeth_`, `srate_` | Epic 4 |
| **Localization** | Region, Country, Currency, ExchangeRate, PriceList | `reg_`, `ctry_`, `curr_`, `exr_`, `plist_` | Epic 4 |
| **Payment** | StripeConnection, Payment, Refund, PaymentAuditLog | `sconn_`, `pay_`, `ref_`, `palog_` | Epic 5 |
| **Orders** | Order, OrderItem, OrderAddress, OrderTimelineEvent | `ord_`, `oli_`, `oadr_`, `ote_` | Epic 6 |
| **Fulfillment** | Fulfillment, FulfillmentItem, FulfillmentTrackingEvent | `ful_`, `fuli_` | Epic 6 |
| **Returns** | Return, ReturnItem, ReturnPolicy | `ret_`, `reti_`, `rpol_` | Epic 6 |
| **Customers** | Customer, CustomerSession, CustomerAddress, CustomerGroup, Wishlist | `cst_`, `csess_`, `cadr_`, `cgrp_`, `wl_` | Epic 7 |
| **Suppliers** | Supplier, SupplierContact, SupplierProduct, PurchaseOrder | `supp_`, `scon_`, `spprod_`, `po_` | Epic 15 |
| **Profit Engine** | ChangeSet, ChangeSetAudit | `cs_` | Epic 8 |

### Naming Conventions (ARCH-22)

```
Prisma Model:     PascalCase singular    → Product, OrderItem
Database Table:   snake_case plural      → products, order_items
Prisma Field:     camelCase              → createdAt, priceInCents
Database Column:  snake_case             → created_at, price_in_cents
ID Prefix:        lowercase + underscore → prod_, ord_, usr_
```

### Money Fields (ARCH-25)

All monetary values stored as **INTEGER cents** for precision:

```prisma
priceInCents        Int    @map("price_in_cents")    // $19.99 = 1999
discountAmountCents Int    @map("discount_amount_cents")
totalCents          Int    @map("total_cents")
```

### Multi-Tenancy (ARCH-20)

Every tenant-scoped model includes `storeId` with cascade delete:

```prisma
model Product {
  id        String   @id @default(cuid())
  storeId   String   @map("store_id")
  // ... fields

  store     Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)

  @@index([storeId])
  @@map("products")
}
```

### Schema File Organization

```
apps/api/prisma/schema/
├── base.prisma           # Generator, datasource, conventions
├── store.prisma          # Store (tenant root)
├── user.prisma           # User, roles
├── store-settings.prisma # Store configuration
├── api-key.prisma        # SDK authentication
├── audit-log.prisma      # Security audit trail
├── product.prisma        # Product catalog
├── promotion.prisma      # Promotions & coupons (Epic 3)
├── gift-card.prisma      # Gift cards (Epic 3)
├── cart.prisma           # Shopping cart (Epic 4)
├── region.prisma         # Regions & currencies (Epic 4)
├── payment.prisma        # Payment processing (Epic 5)
├── order.prisma          # Orders (Epic 6)
├── fulfillment.prisma    # Shipping & fulfillment (Epic 6)
├── return.prisma         # Returns & RMA (Epic 6)
├── customer.prisma       # Customer accounts (Epic 7)
├── supplier.prisma       # Suppliers & POs (Epic 15)
└── changeset.prisma      # Profit Engine (Epic 8)
```

### Cross-Reference: FRs to Models

| FR Range | Domain | Key Models |
|----------|--------|------------|
| FR10-FR12 | Catalog | Product, ProductVariant, Category |
| FR13-FR17 | Cart | Cart, CartItem, CheckoutSession |
| FR18-FR22 | Orders | Order, OrderItem, Fulfillment |
| FR41-FR45 | Customers | Customer, CustomerAddress |
| FR46-FR50 | Payments | Payment, Refund |
| FR51-FR56 | Fulfillment | Fulfillment, Return |
| FR105-FR109 | Promotions | Promotion, Coupon |
| FR110-FR113 | Gift Cards | GiftCard, GiftCardTransaction |
| FR114-FR118 | Localization | Region, Currency, PriceList |
| FR126-FR130 | Suppliers | Supplier, PurchaseOrder |

> **Reference:** See `_bmad-output/implementation-artifacts/database-schema-roadmap.md` for detailed story-to-model mapping.

## Override Kernel: Runtime Resolution System

_Enhanced in revision 2026-01-14 - Detailed resolution mechanism for @trafi/core distribution_

The Override Kernel is the **deterministic runtime system** that resolves which implementation (core vs override) to use. This enables the @trafi/core distribution model.

### Backend: NestJS DI Resolution

```typescript
// Core service with override token
@Injectable()
export class CoreProductService {
  protected calculatePrice(product: Product): number {
    return product.basePrice;
  }

  getProduct(id: string): Product {
    const product = this.repository.findById(id);
    product.calculatedPrice = this.calculatePrice(product);
    return product;
  }
}

// Override token declaration
export const PRODUCT_SERVICE = Symbol('PRODUCT_SERVICE');

// Core module registers default
@Module({
  providers: [
    {
      provide: PRODUCT_SERVICE,
      useClass: CoreProductService,
    },
  ],
  exports: [PRODUCT_SERVICE],
})
export class CoreProductModule {}

// Override module replaces implementation
@Module({
  providers: [
    {
      provide: PRODUCT_SERVICE,
      useClass: CustomProductService, // Extends CoreProductService
    },
  ],
})
export class CustomProductModule {}
```

**Resolution Order:**
1. Check `trafi.config.ts` for explicit override mapping
2. If override module registered, use override provider
3. Fall back to core provider
4. **Fail fast** if token has no provider (dev error, not runtime surprise)

### Dashboard: Page/Component Wrapping

```typescript
// trafi.config.ts - Dashboard overrides
export default defineTrafiConfig({
  dashboard: {
    pages: {
      '/products': {
        override: './src/pages/products/CustomProductsPage.tsx',
        wrapCore: true, // Wraps core, doesn't replace
      },
      '/products/[id]': {
        override: './src/pages/products/CustomProductDetail.tsx',
        wrapCore: false, // Fully replaces core
      },
    },
    components: {
      'ProductCard': {
        override: './src/components/CustomProductCard.tsx',
        slots: ['header', 'footer', 'actions'], // Available slot overrides
      },
    },
  },
});

// Core page with slot injection
export function CoreProductsPage({ slots }: { slots?: PageSlots }) {
  return (
    <PageLayout>
      {slots?.header ?? <DefaultHeader />}
      <ProductTable />
      {slots?.footer ?? <DefaultFooter />}
    </PageLayout>
  );
}

// Override wrapping core
export function CustomProductsPage() {
  return (
    <CoreProductsPage
      slots={{
        header: <CustomHeader showBulkActions />,
        footer: <CustomFooter showExportButton />,
      }}
    />
  );
}
```

### Config Resolution & Validation

```typescript
// trafi.config.ts structure
interface TrafiConfig {
  version: string;                    // Minimum compatible @trafi/core version

  api: {
    modules: ModuleOverride[];        // Backend module overrides
    services: ServiceOverride[];      // Individual service overrides
    guards: GuardOverride[];          // Auth/permission guard overrides
  };

  dashboard: {
    pages: PageOverride[];            // Page-level overrides
    components: ComponentOverride[];  // Component-level overrides
    theme: ThemeOverride;             // Design token overrides
  };

  sdk: {
    interceptors: Interceptor[];      // Request/response interceptors
    hooks: HookOverride[];            // SDK event hooks
  };
}

// Validation at startup (FAIL FAST)
function validateConfig(config: TrafiConfig): ValidationResult {
  const errors: ValidationError[] = [];

  // Version compatibility check
  if (!semver.satisfies(CORE_VERSION, config.version)) {
    errors.push({
      type: 'version_mismatch',
      message: `Config requires ${config.version}, running ${CORE_VERSION}`,
    });
  }

  // Override file existence check
  for (const override of config.api.modules) {
    if (!fs.existsSync(override.path)) {
      errors.push({ type: 'missing_override', path: override.path });
    }
  }

  // Type compatibility check (via TypeScript compiler API)
  for (const service of config.api.services) {
    if (!extendsCore(service.override, service.core)) {
      errors.push({
        type: 'incompatible_override',
        message: `${service.override} must extend ${service.core}`,
      });
    }
  }

  return { valid: errors.length === 0, errors };
}
```

### Compatibility Guarantees

| Surface | Versioning | Breaking Change Policy |
|---------|------------|------------------------|
| **Public service methods** | SemVer major | 90-day deprecation window |
| **Protected methods** | SemVer minor | Can change in minor versions |
| **Internal methods** | None | Can change anytime |
| **Component props** | SemVer major | 90-day deprecation window |
| **Slot definitions** | SemVer minor | New slots = minor, removed = major |
| **Config schema** | SemVer major | Migration scripts provided |

**Critical Rule:** Customizations must survive upgrades — or fail loudly at startup, not silently at runtime.

