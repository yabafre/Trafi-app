## Story 3.9: Promotions & Discounts Foundation

As a **Merchant**,
I want **to create promotions and discount codes**,
So that **I can run marketing campaigns and incentivize purchases**.

**Acceptance Criteria:**

**Given** a Merchant is authenticated
**When** they access the Promotions section
**Then** they can:
- Create promotions with percentage or fixed amount discounts
- Set promotion rules (min purchase, product/category restrictions)
- Generate unique coupon codes (single or bulk)
- Set start/end dates and usage limits
**And** promotions can be stackable or exclusive
**And** usage is tracked per customer and globally

**FRs covered:** FR105, FR106, FR107, FR108, FR109

---

### Technical Implementation

#### File Structure
```
apps/dashboard/src/app/(dashboard)/marketing/promotions/
├── page.tsx                          # RSC - Promotions list
├── _components/
│   ├── PromotionsDataTable.tsx       # Client - DataTable
│   ├── PromotionStatusBadge.tsx      # Status: draft/active/paused/expired
│   ├── CreatePromotionDialog.tsx     # Create form dialog
│   └── CouponGenerator.tsx           # Bulk code generation
├── _hooks/
│   ├── usePromotions.ts
│   ├── useCreatePromotion.ts
│   └── useGenerateCoupons.ts
├── new/
│   ├── page.tsx
│   └── _components/
│       ├── PromotionForm.tsx
│       ├── PromotionRulesBuilder.tsx # Visual rule builder
│       └── PromotionActionsBuilder.tsx
└── [promotionId]/
    ├── page.tsx
    ├── _components/
    │   ├── EditPromotionForm.tsx
    │   ├── CouponsTab.tsx            # Manage associated coupons
    │   └── UsageTab.tsx              # Usage analytics
    └── _hooks/
        └── usePromotion.ts

apps/api/src/modules/promotions/
├── promotions.module.ts
├── promotions.service.ts             # protected methods
├── coupon.service.ts                 # Code generation & validation
├── promotion-engine.service.ts       # Apply promotions to cart
└── dto/
    ├── create-promotion.dto.ts
    ├── create-coupon.dto.ts
    └── apply-promotion.dto.ts
```

#### Prisma Schema (`apps/api/prisma/schema/promotion.prisma`)
```prisma
// =============================================================================
// Promotions & Discounts Domain Schema
// =============================================================================
// Marketing campaigns with rules and coupon codes
// ID prefix: promo_, prule_, pact_, coup_, puse_
// Money fields: INTEGER cents (ARCH-25)
// =============================================================================

enum PromotionType {
  PERCENTAGE
  FIXED_AMOUNT
  BUY_X_GET_Y
  FREE_SHIPPING
}

enum PromotionStatus {
  DRAFT
  ACTIVE
  PAUSED
  EXPIRED
  ARCHIVED
}

enum RuleType {
  PRODUCT
  CATEGORY
  COLLECTION
  CUSTOMER_TAG
  ORDER_COUNT
  CART_QUANTITY
  FIRST_ORDER
  SHIPPING_COUNTRY
  MIN_PURCHASE
}

enum RuleOperator {
  EQUALS
  IN
  NOT_IN
  GREATER_THAN
  LESS_THAN
  BETWEEN
}

enum ActionType {
  PERCENTAGE_OFF
  FIXED_OFF
  FREE_ITEM
  FREE_SHIPPING
}

enum TargetType {
  ORDER
  LINE_ITEM
  SHIPPING
  SPECIFIC_ITEMS
}

model Promotion {
  id                    String            @id @default(cuid())
  storeId               String            @map("store_id")
  name                  String
  description           String?
  code                  String?           // null = automatic, not code-based
  type                  PromotionType
  discountValue         Int               @map("discount_value")  // Cents or percentage*100
  minPurchaseAmountCents Int?             @map("min_purchase_amount_cents")
  maxDiscountCents      Int?              @map("max_discount_cents")
  usageLimit            Int?              @map("usage_limit")     // null = unlimited
  usageCount            Int               @default(0) @map("usage_count")
  perCustomerLimit      Int?              @map("per_customer_limit")
  startsAt              DateTime          @map("starts_at")
  endsAt                DateTime?         @map("ends_at")
  status                PromotionStatus   @default(DRAFT)
  priority              Int               @default(0)
  stackable             Boolean           @default(false)
  createdAt             DateTime          @default(now()) @map("created_at")
  updatedAt             DateTime          @updatedAt @map("updated_at")

  // Relations
  store                 Store             @relation(fields: [storeId], references: [id], onDelete: Cascade)
  rules                 PromotionRule[]
  actions               PromotionAction[]
  coupons               Coupon[]
  usages                PromotionUsage[]

  @@unique([storeId, code])
  @@index([storeId])
  @@index([storeId, status])
  @@index([storeId, startsAt, endsAt])
  @@map("promotions")
}

model PromotionRule {
  id            String        @id @default(cuid())
  promotionId   String        @map("promotion_id")
  type          RuleType
  operator      RuleOperator
  value         Json          // Product IDs, category slugs, amounts, etc.
  createdAt     DateTime      @default(now()) @map("created_at")

  // Relations
  promotion     Promotion     @relation(fields: [promotionId], references: [id], onDelete: Cascade)

  @@index([promotionId])
  @@map("promotion_rules")
}

model PromotionAction {
  id            String        @id @default(cuid())
  promotionId   String        @map("promotion_id")
  type          ActionType
  value         Int           // Discount value
  targetType    TargetType
  targetValue   Json?         // Specific targets
  maxQuantity   Int?          @map("max_quantity")
  createdAt     DateTime      @default(now()) @map("created_at")

  // Relations
  promotion     Promotion     @relation(fields: [promotionId], references: [id], onDelete: Cascade)

  @@index([promotionId])
  @@map("promotion_actions")
}

model Coupon {
  id            String        @id @default(cuid())
  storeId       String        @map("store_id")
  promotionId   String        @map("promotion_id")
  code          String
  usageLimit    Int?          @map("usage_limit")
  usageCount    Int           @default(0) @map("usage_count")
  expiresAt     DateTime?     @map("expires_at")
  isActive      Boolean       @default(true) @map("is_active")
  metadata      Json?
  createdAt     DateTime      @default(now()) @map("created_at")
  updatedAt     DateTime      @updatedAt @map("updated_at")

  // Relations
  store         Store         @relation(fields: [storeId], references: [id], onDelete: Cascade)
  promotion     Promotion     @relation(fields: [promotionId], references: [id], onDelete: Cascade)
  usages        PromotionUsage[]

  @@unique([storeId, code])
  @@index([storeId])
  @@index([promotionId])
  @@map("coupons")
}

model PromotionUsage {
  id                  String      @id @default(cuid())
  storeId             String      @map("store_id")
  promotionId         String      @map("promotion_id")
  couponId            String?     @map("coupon_id")
  orderId             String      @map("order_id")
  customerId          String?     @map("customer_id")
  discountAmountCents Int         @map("discount_amount_cents")
  appliedAt           DateTime    @default(now()) @map("applied_at")

  // Relations
  store               Store       @relation(fields: [storeId], references: [id], onDelete: Cascade)
  promotion           Promotion   @relation(fields: [promotionId], references: [id])
  coupon              Coupon?     @relation(fields: [couponId], references: [id])

  @@index([storeId])
  @@index([promotionId])
  @@index([customerId])
  @@index([orderId])
  @@map("promotion_usages")
}
```

#### Zod Schemas (`@trafi/validators`)
```typescript
// packages/validators/src/promotion/promotion.schema.ts
import { z } from 'zod';

export const PromotionTypeSchema = z.enum([
  'PERCENTAGE',
  'FIXED_AMOUNT',
  'BUY_X_GET_Y',
  'FREE_SHIPPING',
]);

export const PromotionStatusSchema = z.enum([
  'DRAFT',
  'ACTIVE',
  'PAUSED',
  'EXPIRED',
  'ARCHIVED',
]);

export const RuleTypeSchema = z.enum([
  'PRODUCT',
  'CATEGORY',
  'COLLECTION',
  'CUSTOMER_TAG',
  'ORDER_COUNT',
  'CART_QUANTITY',
  'FIRST_ORDER',
  'SHIPPING_COUNTRY',
  'MIN_PURCHASE',
]);

export const CreatePromotionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  code: z.string().min(3).max(30).regex(/^[A-Z0-9_-]+$/).optional(),
  type: PromotionTypeSchema,
  discountValue: z.number().int().positive(),
  minPurchaseAmountCents: z.number().int().nonnegative().optional(),
  maxDiscountCents: z.number().int().positive().optional(),
  usageLimit: z.number().int().positive().optional(),
  perCustomerLimit: z.number().int().positive().optional(),
  startsAt: z.date(),
  endsAt: z.date().optional(),
  stackable: z.boolean().default(false),
  rules: z.array(z.object({
    type: RuleTypeSchema,
    operator: z.enum(['EQUALS', 'IN', 'NOT_IN', 'GREATER_THAN', 'LESS_THAN']),
    value: z.unknown(),
  })).optional(),
});

export const ApplyCouponSchema = z.object({
  code: z.string().min(1),
  cartId: z.string(),
});

export const GenerateCouponsSchema = z.object({
  promotionId: z.string(),
  count: z.number().int().min(1).max(10000),
  prefix: z.string().max(10).optional(),
  length: z.number().int().min(6).max(20).default(8),
});
```

#### Backend Service (`apps/api/src/modules/promotions/promotions.service.ts`)
```typescript
@Injectable()
export class PromotionsService {
  constructor(
    private prisma: PrismaService,
    private idService: IdService,
  ) {}

  // Protected for @trafi/core extensibility (RETRO-2)
  protected async create(storeId: string, input: CreatePromotionInput): Promise<Promotion> {
    return this.prisma.promotion.create({
      data: {
        id: this.idService.generate('promo'),
        storeId,
        ...input,
        rules: input.rules ? {
          create: input.rules.map(rule => ({
            id: this.idService.generate('prule'),
            ...rule,
          })),
        } : undefined,
      },
      include: { rules: true, actions: true },
    });
  }

  protected async list(storeId: string, query: PromotionListQuery): Promise<PaginatedResult<Promotion>> {
    const where: Prisma.PromotionWhereInput = { storeId };

    if (query.status) {
      where.status = { in: query.status };
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [promotions, total] = await Promise.all([
      this.prisma.promotion.findMany({
        where,
        include: { _count: { select: { usages: true, coupons: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.promotion.count({ where }),
    ]);

    return { data: promotions, total, page: query.page, limit: query.limit };
  }

  protected async validateAndApply(
    storeId: string,
    code: string,
    cart: Cart,
    customerId?: string,
  ): Promise<ApplyPromotionResult> {
    // Find promotion by code (direct or via coupon)
    const promotion = await this.findPromotionByCode(storeId, code);

    if (!promotion) {
      return { success: false, error: 'INVALID_CODE' };
    }

    // Check status and dates
    if (promotion.status !== 'ACTIVE') {
      return { success: false, error: 'PROMOTION_INACTIVE' };
    }

    const now = new Date();
    if (promotion.startsAt > now) {
      return { success: false, error: 'PROMOTION_NOT_STARTED' };
    }

    if (promotion.endsAt && promotion.endsAt < now) {
      return { success: false, error: 'PROMOTION_EXPIRED' };
    }

    // Check usage limits
    if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
      return { success: false, error: 'USAGE_LIMIT_REACHED' };
    }

    // Check per-customer limit
    if (customerId && promotion.perCustomerLimit) {
      const customerUsage = await this.prisma.promotionUsage.count({
        where: { promotionId: promotion.id, customerId },
      });
      if (customerUsage >= promotion.perCustomerLimit) {
        return { success: false, error: 'CUSTOMER_LIMIT_REACHED' };
      }
    }

    // Validate rules
    const rulesValid = await this.validateRules(promotion.rules, cart);
    if (!rulesValid.valid) {
      return { success: false, error: 'RULES_NOT_MET', details: rulesValid.reason };
    }

    // Calculate discount
    const discount = this.calculateDiscount(promotion, cart);

    return {
      success: true,
      promotion,
      discountAmountCents: discount,
    };
  }

  protected calculateDiscount(promotion: Promotion, cart: Cart): number {
    const cartTotal = cart.items.reduce((sum, item) => sum + item.priceAtAddition * item.quantity, 0);

    let discount = 0;
    switch (promotion.type) {
      case 'PERCENTAGE':
        discount = Math.floor(cartTotal * (promotion.discountValue / 10000)); // discountValue is percentage * 100
        break;
      case 'FIXED_AMOUNT':
        discount = promotion.discountValue;
        break;
      case 'FREE_SHIPPING':
        discount = cart.shippingCost ?? 0;
        break;
    }

    // Apply max discount cap
    if (promotion.maxDiscountCents && discount > promotion.maxDiscountCents) {
      discount = promotion.maxDiscountCents;
    }

    return discount;
  }
}
```

#### UX Implementation Notes
- **Promotion list:** DataTable with status badges, usage stats, quick actions
- **Rule builder:** Visual drag-and-drop rule composition
- **Coupon generator:** Bulk generation with preview and export to CSV
- **Analytics tab:** Charts showing usage over time, conversion rates

---

