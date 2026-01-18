# Epic 15: Suppliers & Purchase Orders

Merchant peut gerer ses fournisseurs, passer des commandes d'approvisionnement, et suivre les receptions.

**FRs covered:** FR126, FR127, FR128, FR129, FR130

---

## Epic Implementation Guidelines

### Retrospective Learnings (MANDATORY)
- **RETRO-1:** Use Context7 MCP before implementing email/PDF generation
- **RETRO-2:** SupplierService, PurchaseOrderService use `protected` methods
- **RETRO-3:** SupplierModule exports explicit public API for custom workflows
- **RETRO-4:** Dashboard supplier components accept customization props
- **RETRO-5:** Purchase order pages use composition pattern
- **RETRO-6:** Code with @trafi/core override patterns (custom PO fields)

### UX Design Requirements (Dashboard - Digital Brutalism v2)

**Brutalist Manifesto:**
- The interface is a machine. No decoration, only data and action.
- Radius-zero everywhere — everything is a rectangle.
- Visible grid — 1px borders expose structure.
- High contrast — pure black background, pure white text.

**Visual Design:**
- **UX-1:** Dark mode default for all supplier pages
- **UX-2:** Rail (64px) + Sidebar (240px) + Main content layout
- **UX-3:** Breadcrumb: Dashboard > Suppliers > [Supplier/PO]
- **UX-4:** Status badges: active (#00FF94), inactive (#6B7280), blocked (#FF3366)
- **UX-5:** PO status: draft (#6B7280), sent (#3B82F6), confirmed (#CCFF00), received (#00FF94)
- **UX-6:** DataTable for suppliers and POs with row click
- **UX-8:** Shadcn UI: DataTable, Dialog, Tabs, Form (all radius-0)
- **UX-COLOR-1:** Primary Acid Lime #CCFF00 for action buttons
- **UX-COLOR-2:** Background #000000, borders #333333, text #FFFFFF
- **UX-RADIUS:** 0px everywhere

---

## Story 15.1: Supplier Management

As a **Merchant**,
I want **to manage my product suppliers**,
So that **I can track where my inventory comes from**.

**Acceptance Criteria:**

**Given** a Merchant accesses Suppliers
**When** they manage suppliers
**Then** they can:
- Create suppliers with contact info and payment terms
- Add multiple contacts per supplier
- Set supplier status (active/inactive/blocked)
- View supplier order history
**And** suppliers are searchable by name or code
**And** supplier data supports imports/exports

---

### Technical Implementation

#### File Structure
```
apps/dashboard/src/app/(dashboard)/suppliers/
├── page.tsx                          # RSC - Suppliers list
├── _components/
│   ├── SuppliersDataTable.tsx
│   ├── SupplierStatusBadge.tsx
│   └── CreateSupplierDialog.tsx
├── _hooks/
│   └── useSuppliers.ts
├── new/
│   ├── page.tsx
│   └── _components/
│       ├── SupplierForm.tsx
│       └── ContactsForm.tsx
└── [supplierId]/
    ├── page.tsx
    ├── _components/
    │   ├── SupplierDetails.tsx
    │   ├── ContactsList.tsx
    │   ├── ProductsTab.tsx
    │   └── OrderHistoryTab.tsx
    └── _hooks/
        └── useSupplier.ts

apps/api/src/modules/suppliers/
├── suppliers.module.ts
├── suppliers.service.ts
├── supplier-contact.service.ts
└── dto/
    ├── create-supplier.dto.ts
    └── create-contact.dto.ts
```

#### Prisma Schema (`apps/api/prisma/schema/supplier.prisma`)
```prisma
// =============================================================================
// Suppliers & Purchase Orders Domain Schema
// =============================================================================
// Supplier management and inventory procurement
// ID prefix: supp_, scon_, spprod_, po_, poitem_, porec_, porecitem_
// Money fields: INTEGER cents (ARCH-25)
// =============================================================================

enum SupplierStatus {
  ACTIVE
  INACTIVE
  BLOCKED
  PENDING_APPROVAL
}

enum PurchaseOrderStatus {
  DRAFT
  PENDING_APPROVAL
  SENT
  CONFIRMED
  PARTIAL
  RECEIVED
  CANCELLED
  CLOSED
}

model Supplier {
  id                  String          @id @default(cuid())
  storeId             String          @map("store_id")
  name                String
  code                String
  email               String?
  phone               String?
  website             String?
  status              SupplierStatus  @default(ACTIVE)
  paymentTerms        String?         @map("payment_terms")  // 'Net 30', etc.
  leadTimeDays        Int?            @map("lead_time_days")
  minimumOrderCents   Int?            @map("minimum_order_cents")
  currencyCode        String          @default("EUR") @map("currency_code")
  taxId               String?         @map("tax_id")
  notes               String?
  address             Json?
  metadata            Json?
  createdAt           DateTime        @default(now()) @map("created_at")
  updatedAt           DateTime        @updatedAt @map("updated_at")

  // Relations
  store               Store           @relation(fields: [storeId], references: [id], onDelete: Cascade)
  contacts            SupplierContact[]
  products            SupplierProduct[]
  purchaseOrders      PurchaseOrder[]

  @@unique([storeId, code])
  @@index([storeId])
  @@index([storeId, status])
  @@map("suppliers")
}

model SupplierContact {
  id          String    @id @default(cuid())
  supplierId  String    @map("supplier_id")
  name        String
  email       String?
  phone       String?
  role        String?
  isPrimary   Boolean   @default(false) @map("is_primary")
  notes       String?
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  // Relations
  supplier    Supplier  @relation(fields: [supplierId], references: [id], onDelete: Cascade)

  @@index([supplierId])
  @@map("supplier_contacts")
}
```

#### Zod Schemas (`@trafi/validators`)
```typescript
// packages/validators/src/supplier/supplier.schema.ts
import { z } from 'zod';

export const SupplierStatusSchema = z.enum([
  'ACTIVE',
  'INACTIVE',
  'BLOCKED',
  'PENDING_APPROVAL',
]);

export const CreateSupplierSchema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().min(1).max(50).regex(/^[A-Z0-9_-]+$/i),
  email: z.string().email().optional(),
  phone: z.string().max(30).optional(),
  website: z.string().url().optional(),
  paymentTerms: z.string().max(100).optional(),
  leadTimeDays: z.number().int().positive().optional(),
  minimumOrderCents: z.number().int().nonnegative().optional(),
  currencyCode: z.string().length(3).default('EUR'),
  taxId: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
  address: z.object({
    address1: z.string(),
    address2: z.string().optional(),
    city: z.string(),
    state: z.string().optional(),
    postalCode: z.string(),
    countryCode: z.string().length(2),
  }).optional(),
});

export const CreateSupplierContactSchema = z.object({
  supplierId: z.string(),
  name: z.string().min(1).max(100),
  email: z.string().email().optional(),
  phone: z.string().max(30).optional(),
  role: z.string().max(100).optional(),
  isPrimary: z.boolean().default(false),
  notes: z.string().max(500).optional(),
});
```

#### Backend Service (`apps/api/src/modules/suppliers/suppliers.service.ts`)
```typescript
@Injectable()
export class SuppliersService {
  constructor(
    private prisma: PrismaService,
    private idService: IdService,
  ) {}

  // Protected for @trafi/core extensibility (RETRO-2)
  protected async create(storeId: string, input: CreateSupplierInput): Promise<Supplier> {
    return this.prisma.supplier.create({
      data: {
        id: this.idService.generate('supp'),
        storeId,
        ...input,
      },
      include: { contacts: true },
    });
  }

  protected async list(storeId: string, query: SupplierListQuery): Promise<PaginatedResult<Supplier>> {
    const where: Prisma.SupplierWhereInput = { storeId };

    if (query.status) {
      where.status = { in: query.status };
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [suppliers, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        include: {
          contacts: { where: { isPrimary: true }, take: 1 },
          _count: { select: { purchaseOrders: true, products: true } },
        },
        orderBy: { name: 'asc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.supplier.count({ where }),
    ]);

    return { data: suppliers, total, page: query.page, limit: query.limit };
  }
}
```

#### UX Implementation Notes
- **Supplier list**: DataTable with primary contact visible
- **Status badges**: Color-coded per UX-4
- **Contact management**: Inline editing with primary flag
- **Import/Export**: CSV support for bulk operations

---

## Story 15.2: Supplier Product Linking

As a **Merchant**,
I want **to link products to suppliers with cost information**,
So that **I know where to order each product and at what cost**.

**Acceptance Criteria:**

**Given** products exist in catalog
**When** merchant links products to suppliers
**Then** they can:
- Set supplier SKU and cost price per product/variant
- Mark preferred supplier for each product
- Set supplier-specific lead times and MOQ
- Track cost history over time
**And** profit margins are calculable from cost data

---

### Technical Implementation

#### Prisma Schema (continued)
```prisma
model SupplierProduct {
  id                    String      @id @default(cuid())
  storeId               String      @map("store_id")
  supplierId            String      @map("supplier_id")
  productId             String      @map("product_id")
  variantId             String?     @map("variant_id")
  supplierSku           String?     @map("supplier_sku")
  costPriceCents        Int         @map("cost_price_cents")
  currencyCode          String      @default("EUR") @map("currency_code")
  minimumOrderQuantity  Int?        @map("minimum_order_quantity")
  leadTimeDays          Int?        @map("lead_time_days")
  isPreferred           Boolean     @default(false) @map("is_preferred")
  isActive              Boolean     @default(true) @map("is_active")
  lastOrderedAt         DateTime?   @map("last_ordered_at")
  createdAt             DateTime    @default(now()) @map("created_at")
  updatedAt             DateTime    @updatedAt @map("updated_at")

  // Relations
  store                 Store       @relation(fields: [storeId], references: [id], onDelete: Cascade)
  supplier              Supplier    @relation(fields: [supplierId], references: [id], onDelete: Cascade)

  @@unique([storeId, supplierId, productId, variantId])
  @@index([storeId])
  @@index([supplierId])
  @@index([productId])
  @@map("supplier_products")
}
```

#### Zod Schemas
```typescript
// packages/validators/src/supplier/supplier-product.schema.ts
export const LinkSupplierProductSchema = z.object({
  supplierId: z.string(),
  productId: z.string(),
  variantId: z.string().optional(),
  supplierSku: z.string().max(100).optional(),
  costPriceCents: z.number().int().nonnegative(),
  currencyCode: z.string().length(3).default('EUR'),
  minimumOrderQuantity: z.number().int().positive().optional(),
  leadTimeDays: z.number().int().positive().optional(),
  isPreferred: z.boolean().default(false),
});
```

#### UX Implementation Notes
- **Product suppliers tab**: Show all linked suppliers with cost comparison
- **Preferred badge**: Star icon for preferred supplier
- **Cost history**: Chart showing price changes over time
- **Margin calculator**: Real-time margin display based on selling price

---

## Story 15.3: Purchase Order Creation

As a **Merchant**,
I want **to create purchase orders for suppliers**,
So that **I can order inventory in a structured way**.

**Acceptance Criteria:**

**Given** a supplier is selected
**When** merchant creates a purchase order
**Then** they can:
- Add products from that supplier's catalog
- Set quantities and see line totals
- Add notes for supplier and internal use
- Save as draft or submit directly
**And** PO number is auto-generated
**And** expected delivery date is calculated from lead times

---

### Technical Implementation

#### Prisma Schema (continued)
```prisma
model PurchaseOrder {
  id                  String              @id @default(cuid())
  storeId             String              @map("store_id")
  supplierId          String              @map("supplier_id")
  orderNumber         String              @map("order_number")
  status              PurchaseOrderStatus @default(DRAFT)
  currencyCode        String              @map("currency_code")
  subtotalCents       Int                 @map("subtotal_cents")
  taxCents            Int                 @default(0) @map("tax_cents")
  shippingCents       Int                 @default(0) @map("shipping_cents")
  discountCents       Int                 @default(0) @map("discount_cents")
  totalCents          Int                 @map("total_cents")
  notes               String?
  internalNotes       String?             @map("internal_notes")
  expectedDeliveryAt  DateTime?           @map("expected_delivery_at")
  orderedAt           DateTime?           @map("ordered_at")
  confirmedAt         DateTime?           @map("confirmed_at")
  receivedAt          DateTime?           @map("received_at")
  cancelledAt         DateTime?           @map("cancelled_at")
  shippingAddress     Json?               @map("shipping_address")
  createdById         String              @map("created_by_id")
  createdAt           DateTime            @default(now()) @map("created_at")
  updatedAt           DateTime            @updatedAt @map("updated_at")

  // Relations
  store               Store               @relation(fields: [storeId], references: [id], onDelete: Cascade)
  supplier            Supplier            @relation(fields: [supplierId], references: [id])
  createdBy           User                @relation(fields: [createdById], references: [id])
  items               PurchaseOrderItem[]
  receipts            PurchaseOrderReceipt[]

  @@unique([storeId, orderNumber])
  @@index([storeId])
  @@index([supplierId])
  @@index([storeId, status])
  @@map("purchase_orders")
}

model PurchaseOrderItem {
  id                String        @id @default(cuid())
  purchaseOrderId   String        @map("purchase_order_id")
  productId         String        @map("product_id")
  variantId         String?       @map("variant_id")
  supplierSku       String?       @map("supplier_sku")
  name              String
  quantity          Int
  receivedQuantity  Int           @default(0) @map("received_quantity")
  unitCostCents     Int           @map("unit_cost_cents")
  totalCents        Int           @map("total_cents")
  notes             String?
  createdAt         DateTime      @default(now()) @map("created_at")
  updatedAt         DateTime      @updatedAt @map("updated_at")

  // Relations
  purchaseOrder     PurchaseOrder @relation(fields: [purchaseOrderId], references: [id], onDelete: Cascade)
  receiptItems      PurchaseOrderReceiptItem[]

  @@index([purchaseOrderId])
  @@index([productId])
  @@map("purchase_order_items")
}
```

#### Zod Schemas
```typescript
// packages/validators/src/supplier/purchase-order.schema.ts
export const PurchaseOrderStatusSchema = z.enum([
  'DRAFT',
  'PENDING_APPROVAL',
  'SENT',
  'CONFIRMED',
  'PARTIAL',
  'RECEIVED',
  'CANCELLED',
  'CLOSED',
]);

export const CreatePurchaseOrderSchema = z.object({
  supplierId: z.string(),
  items: z.array(z.object({
    productId: z.string(),
    variantId: z.string().optional(),
    quantity: z.number().int().positive(),
    unitCostCents: z.number().int().nonnegative(),
    notes: z.string().max(500).optional(),
  })).min(1),
  notes: z.string().max(1000).optional(),
  internalNotes: z.string().max(1000).optional(),
  expectedDeliveryAt: z.date().optional(),
  shippingAddress: z.object({
    address1: z.string(),
    city: z.string(),
    postalCode: z.string(),
    countryCode: z.string().length(2),
  }).optional(),
});

export const SubmitPurchaseOrderSchema = z.object({
  purchaseOrderId: z.string(),
  sendEmail: z.boolean().default(true),
});
```

#### Backend Service (`apps/api/src/modules/suppliers/purchase-order.service.ts`)
```typescript
@Injectable()
export class PurchaseOrderService {
  constructor(
    private prisma: PrismaService,
    private idService: IdService,
    private emailService: EmailService,
  ) {}

  // Protected for @trafi/core extensibility (RETRO-2)
  protected async create(
    storeId: string,
    userId: string,
    input: CreatePurchaseOrderInput,
  ): Promise<PurchaseOrder> {
    const supplier = await this.prisma.supplier.findUniqueOrThrow({
      where: { id: input.supplierId },
    });

    // Generate PO number
    const orderNumber = await this.generateOrderNumber(storeId);

    // Calculate totals
    const items = input.items.map(item => ({
      id: this.idService.generate('poitem'),
      productId: item.productId,
      variantId: item.variantId,
      supplierSku: item.supplierSku,
      name: '', // Will be populated from product
      quantity: item.quantity,
      unitCostCents: item.unitCostCents,
      totalCents: item.quantity * item.unitCostCents,
      notes: item.notes,
    }));

    const subtotalCents = items.reduce((sum, item) => sum + item.totalCents, 0);

    // Calculate expected delivery
    const expectedDeliveryAt = input.expectedDeliveryAt ??
      (supplier.leadTimeDays
        ? new Date(Date.now() + supplier.leadTimeDays * 24 * 60 * 60 * 1000)
        : null);

    return this.prisma.purchaseOrder.create({
      data: {
        id: this.idService.generate('po'),
        storeId,
        supplierId: input.supplierId,
        orderNumber,
        currencyCode: supplier.currencyCode,
        subtotalCents,
        totalCents: subtotalCents, // + tax + shipping - discount
        notes: input.notes,
        internalNotes: input.internalNotes,
        expectedDeliveryAt,
        shippingAddress: input.shippingAddress,
        createdById: userId,
        items: { create: items },
      },
      include: { items: true, supplier: true },
    });
  }

  protected async submit(
    storeId: string,
    purchaseOrderId: string,
    sendEmail: boolean,
  ): Promise<PurchaseOrder> {
    const po = await this.prisma.purchaseOrder.update({
      where: { id: purchaseOrderId, storeId },
      data: {
        status: 'SENT',
        orderedAt: new Date(),
      },
      include: { items: true, supplier: { include: { contacts: true } } },
    });

    if (sendEmail) {
      const primaryContact = po.supplier.contacts.find(c => c.isPrimary);
      if (primaryContact?.email) {
        await this.emailService.sendPurchaseOrder({
          to: primaryContact.email,
          purchaseOrder: po,
        });
      }
    }

    return po;
  }

  private async generateOrderNumber(storeId: string): Promise<string> {
    const count = await this.prisma.purchaseOrder.count({ where: { storeId } });
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `PO-${date}-${String(count + 1).padStart(4, '0')}`;
  }
}
```

#### UX Implementation Notes
- **PO builder**: Line item editor with product search
- **Running totals**: Live calculation as items are added
- **Submit flow**: Preview email before sending
- **PDF export**: Downloadable PO document

---

## Story 15.4: Goods Receipt & Inventory Update

As a **Merchant**,
I want **to record goods received against purchase orders**,
So that **inventory is automatically updated**.

**Acceptance Criteria:**

**Given** a purchase order exists
**When** goods are received
**Then** merchant can:
- Record partial or full receipt
- Note damaged/rejected items
- Auto-update inventory quantities
- Close PO when fully received
**And** receipt creates audit trail
**And** multiple receipts per PO are supported

---

### Technical Implementation

#### Prisma Schema (continued)
```prisma
model PurchaseOrderReceipt {
  id                String                    @id @default(cuid())
  storeId           String                    @map("store_id")
  purchaseOrderId   String                    @map("purchase_order_id")
  receiptNumber     String                    @map("receipt_number")
  receivedAt        DateTime                  @map("received_at")
  receivedById      String                    @map("received_by_id")
  notes             String?
  createdAt         DateTime                  @default(now()) @map("created_at")

  // Relations
  store             Store                     @relation(fields: [storeId], references: [id], onDelete: Cascade)
  purchaseOrder     PurchaseOrder             @relation(fields: [purchaseOrderId], references: [id])
  receivedBy        User                      @relation(fields: [receivedById], references: [id])
  items             PurchaseOrderReceiptItem[]

  @@unique([storeId, receiptNumber])
  @@index([purchaseOrderId])
  @@map("purchase_order_receipts")
}

model PurchaseOrderReceiptItem {
  id                    String                @id @default(cuid())
  receiptId             String                @map("receipt_id")
  purchaseOrderItemId   String                @map("purchase_order_item_id")
  quantityReceived      Int                   @map("quantity_received")
  quantityDamaged       Int                   @default(0) @map("quantity_damaged")
  notes                 String?
  createdAt             DateTime              @default(now()) @map("created_at")

  // Relations
  receipt               PurchaseOrderReceipt  @relation(fields: [receiptId], references: [id], onDelete: Cascade)
  purchaseOrderItem     PurchaseOrderItem     @relation(fields: [purchaseOrderItemId], references: [id])

  @@index([receiptId])
  @@index([purchaseOrderItemId])
  @@map("purchase_order_receipt_items")
}
```

#### Zod Schemas
```typescript
// packages/validators/src/supplier/receipt.schema.ts
export const CreateReceiptSchema = z.object({
  purchaseOrderId: z.string(),
  items: z.array(z.object({
    purchaseOrderItemId: z.string(),
    quantityReceived: z.number().int().nonnegative(),
    quantityDamaged: z.number().int().nonnegative().default(0),
    notes: z.string().max(500).optional(),
  })).min(1),
  notes: z.string().max(1000).optional(),
});
```

#### Backend Service
```typescript
@Injectable()
export class ReceiptService {
  // Protected for @trafi/core extensibility (RETRO-2)
  protected async createReceipt(
    storeId: string,
    userId: string,
    input: CreateReceiptInput,
  ): Promise<PurchaseOrderReceipt> {
    return this.prisma.$transaction(async (tx) => {
      const receiptNumber = await this.generateReceiptNumber(tx, storeId);

      // Create receipt
      const receipt = await tx.purchaseOrderReceipt.create({
        data: {
          id: this.idService.generate('porec'),
          storeId,
          purchaseOrderId: input.purchaseOrderId,
          receiptNumber,
          receivedAt: new Date(),
          receivedById: userId,
          notes: input.notes,
          items: {
            create: input.items.map(item => ({
              id: this.idService.generate('porecitem'),
              purchaseOrderItemId: item.purchaseOrderItemId,
              quantityReceived: item.quantityReceived,
              quantityDamaged: item.quantityDamaged,
              notes: item.notes,
            })),
          },
        },
        include: { items: true },
      });

      // Update PO item received quantities
      for (const item of input.items) {
        await tx.purchaseOrderItem.update({
          where: { id: item.purchaseOrderItemId },
          data: { receivedQuantity: { increment: item.quantityReceived } },
        });

        // Update inventory
        const poItem = await tx.purchaseOrderItem.findUnique({
          where: { id: item.purchaseOrderItemId },
        });

        if (poItem?.variantId) {
          await tx.productVariant.update({
            where: { id: poItem.variantId },
            data: { quantity: { increment: item.quantityReceived } },
          });

          // Log inventory change
          await tx.inventoryHistory.create({
            data: {
              variantId: poItem.variantId,
              quantityChange: item.quantityReceived,
              reason: 'purchase_order_receipt',
              note: `Receipt ${receiptNumber}`,
            },
          });
        }
      }

      // Check if PO is fully received
      const po = await tx.purchaseOrder.findUnique({
        where: { id: input.purchaseOrderId },
        include: { items: true },
      });

      const allReceived = po!.items.every(
        item => item.receivedQuantity >= item.quantity
      );

      if (allReceived) {
        await tx.purchaseOrder.update({
          where: { id: input.purchaseOrderId },
          data: { status: 'RECEIVED', receivedAt: new Date() },
        });
      } else {
        await tx.purchaseOrder.update({
          where: { id: input.purchaseOrderId },
          data: { status: 'PARTIAL' },
        });
      }

      return receipt;
    });
  }
}
```

#### UX Implementation Notes
- **Receipt form**: Pre-filled with expected quantities
- **Damage recording**: Inline notes for damaged items
- **Auto-close**: PO automatically closes when fully received
- **Inventory update**: Real-time stock level updates

---

## Dependencies

- **Epic 3**: Product and ProductVariant models
- **Epic 2**: User model for createdBy relations
- **Epic 1**: Store model for tenant scoping

## Notes

This epic is designed for **Post-MVP Phase 2** but schemas are defined now for planning purposes. The implementation can be deferred until inventory management becomes a priority.
