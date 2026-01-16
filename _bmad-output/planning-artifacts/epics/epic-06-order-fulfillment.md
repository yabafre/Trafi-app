# Epic 6: Order Management & Fulfillment

Merchant peut traiter, expedier, et suivre les commandes avec integration 3PL et gestion des retours.

**FRs covered:** FR18, FR19, FR51, FR52, FR53, FR54, FR55, FR56

---

## Epic Implementation Guidelines

### Retrospective Learnings (MANDATORY)
- **RETRO-1:** Use Context7 MCP before implementing email libraries, webhook handling
- **RETRO-2:** OrderService, FulfillmentService, ReturnService use `protected` methods
- **RETRO-3:** OrderModule exports explicit public API for custom order flows
- **RETRO-4:** Dashboard order components accept customization props (columns, actions)
- **RETRO-5:** Order list page uses composition pattern (wrappable DataTable)
- **RETRO-6:** Code with @trafi/core override patterns (custom fulfillment steps)

### UX Design Requirements (Dashboard - Digital Brutalism v2)

**Brutalist Manifesto:**
- The interface is a machine. No decoration, only data and action.
- Radius-zero everywhere — everything is a rectangle.
- Visible grid — 1px borders expose structure.
- High contrast — pure black background, pure white text.

**Visual Design:**
- **UX-1:** Dark mode default for all order pages
- **UX-2:** Rail (64px) + Sidebar (240px) + Main content layout
- **UX-3:** Breadcrumb: Dashboard > Orders > [Order #]
- **UX-4:** Status badges: confirmed (#3B82F6), processing (#CCFF00), shipped (#A855F7), delivered (#00FF94), cancelled (#FF3366)
- **UX-5:** Order list in DataTable with row click for detail
- **UX-6:** Order detail uses tab sections (Details, Items, Timeline, Returns)
- **UX-7:** Fulfillment modal with carrier dropdown and tracking input
- **UX-8:** Shadcn UI: DataTable, Dialog, Tabs, Badge, Timeline (all radius-0)
- **UX-COLOR-1:** Primary Acid Lime #CCFF00 for action buttons, focus states
- **UX-COLOR-2:** Background #000000, borders #333333, text #FFFFFF
- **UX-COLOR-3:** Success #00FF94, Risk #FF3366
- **UX-RADIUS:** 0px everywhere — `border-radius: 0px !important`
- **UX-SHADOW:** None — elements sit firmly in the grid
- **UX-TYPE:** JetBrains Mono for order numbers/amounts, system font for body

---

## Story 6.1: Order List and Search

As a **Merchant**,
I want **to view and search all orders**,
So that **I can manage my business efficiently**.

**Acceptance Criteria:**

**Given** a Merchant accesses the Orders section
**When** the order list loads
**Then** they see orders with:
- Order number, date, customer name
- Order status, payment status, fulfillment status
- Total amount
**And** orders can be filtered by status, date range, customer
**And** orders can be searched by order number or customer email
**And** pagination handles large order volumes

### Technical Implementation

#### File Structure
```
apps/dashboard/src/app/(dashboard)/orders/
├── page.tsx                               # Order list page (RSC)
├── _components/
│   ├── orders-data-table.tsx              # DataTable with columns
│   ├── orders-filters.tsx                 # Filter controls
│   ├── orders-search.tsx                  # Search input
│   ├── order-status-badge.tsx             # Status badge component
│   └── orders-table-columns.tsx           # Column definitions
├── _hooks/
│   └── use-orders.ts
└── _actions/
    └── get-orders.ts

apps/api/src/
├── order/
│   ├── order.module.ts
│   ├── order.service.ts
│   └── order.controller.ts
```

#### Zod Schemas (`@trafi/validators`)
```typescript
// packages/validators/src/order.ts
export const OrderIdSchema = z.string().startsWith('ord_');

export const OrderStatusSchema = z.enum([
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
]);

export const PaymentStatusSchema = z.enum([
  'pending',
  'paid',
  'failed',
  'refunded',
  'partially_refunded',
]);

export const FulfillmentStatusSchema = z.enum([
  'unfulfilled',
  'partially_fulfilled',
  'fulfilled',
]);

export const OrderListQuerySchema = z.object({
  search: z.string().optional(),
  status: z.array(OrderStatusSchema).optional(),
  paymentStatus: z.array(PaymentStatusSchema).optional(),
  fulfillmentStatus: z.array(FulfillmentStatusSchema).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  customerId: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'orderNumber', 'total']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const OrderListItemSchema = z.object({
  id: OrderIdSchema,
  orderNumber: z.string(),
  createdAt: z.date(),
  customerName: z.string(),
  customerEmail: z.string().email(),
  status: OrderStatusSchema,
  paymentStatus: PaymentStatusSchema,
  fulfillmentStatus: FulfillmentStatusSchema,
  total: z.number().int(), // Cents
  currency: z.string().length(3),
  itemCount: z.number().int(),
});

export const OrderListResponseSchema = z.object({
  orders: z.array(OrderListItemSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});
```

#### Backend Order Service (`apps/api/src/order/order.service.ts`)
```typescript
@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  // Protected for @trafi/core extensibility (RETRO-2)
  protected async listOrders(
    storeId: string,
    query: OrderListQuery,
  ): Promise<OrderListResponse> {
    const where: Prisma.OrderWhereInput = { storeId };

    // Search by order number or customer email
    if (query.search) {
      where.OR = [
        { orderNumber: { contains: query.search, mode: 'insensitive' } },
        { customerEmail: { contains: query.search, mode: 'insensitive' } },
        { customer: { name: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    // Filter by status
    if (query.status?.length) {
      where.status = { in: query.status };
    }
    if (query.paymentStatus?.length) {
      where.paymentStatus = { in: query.paymentStatus };
    }
    if (query.fulfillmentStatus?.length) {
      where.fulfillmentStatus = { in: query.fulfillmentStatus };
    }

    // Date range filter
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = query.startDate;
      if (query.endDate) where.createdAt.lte = query.endDate;
    }

    // Customer filter
    if (query.customerId) {
      where.customerId = query.customerId;
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        select: {
          id: true,
          orderNumber: true,
          createdAt: true,
          status: true,
          paymentStatus: true,
          fulfillmentStatus: true,
          total: true,
          currency: true,
          customerEmail: true,
          customer: { select: { name: true } },
          _count: { select: { items: true } },
        },
        orderBy: { [query.sortBy]: query.sortOrder },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders: orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        customerName: order.customer?.name ?? 'Guest',
        customerEmail: order.customerEmail,
        status: order.status as OrderStatus,
        paymentStatus: order.paymentStatus as PaymentStatus,
        fulfillmentStatus: order.fulfillmentStatus as FulfillmentStatus,
        total: order.total,
        currency: order.currency,
        itemCount: order._count.items,
      })),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }
}
```

#### tRPC Router (`apps/api/src/trpc/routers/order.router.ts`)
```typescript
export const orderRouter = router({
  list: protectedProcedure
    .input(OrderListQuerySchema)
    .query(async ({ ctx, input }) => {
      return ctx.orderService.listOrders(ctx.storeId, input);
    }),
});
```

#### Server Action (`apps/dashboard/src/app/(dashboard)/orders/_actions/get-orders.ts`)
```typescript
'use server';

import { createServerAction } from 'zsa';
import { OrderListQuerySchema } from '@trafi/validators';
import { trpc } from '@/lib/trpc/server';

export const getOrdersAction = createServerAction()
  .input(OrderListQuerySchema)
  .handler(async ({ input }) => {
    return trpc.order.list(input);
  });
```

#### Dashboard Data Flow
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Orders Page (RSC)                                                           │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ OrdersSearch (Client Component)                                          │ │
│ │   └─ Debounced search input → updates URL params                        │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ OrdersFilters (Client Component)                                         │ │
│ │   ├─ Status multi-select (Shadcn MultiSelect)                           │ │
│ │   ├─ Date range picker (Shadcn DatePickerWithRange)                     │ │
│ │   └─ Apply filters → updates URL params                                 │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ OrdersDataTable (Client Component)                                       │ │
│ │   ├─ useServerActionQuery(getOrdersAction, { input: queryFromUrl })     │ │
│ │   │                                                                      │ │
│ │   ├─ Columns:                                                           │ │
│ │   │   ├─ Order # (link to detail)                                       │ │
│ │   │   ├─ Date (formatted)                                               │ │
│ │   │   ├─ Customer (name + email)                                        │ │
│ │   │   ├─ Status (OrderStatusBadge)                                      │ │
│ │   │   ├─ Payment (PaymentStatusBadge)                                   │ │
│ │   │   ├─ Fulfillment (FulfillmentStatusBadge)                           │ │
│ │   │   └─ Total (formatted currency)                                     │ │
│ │   │                                                                      │ │
│ │   └─ Row click → router.push(`/orders/${orderId}`)                      │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Pagination (Client Component)                                            │ │
│ │   └─ Page navigation → updates URL params                               │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Order Status Badge (`apps/dashboard/src/app/(dashboard)/orders/_components/order-status-badge.tsx`)
```typescript
'use client';

const STATUS_CONFIG: Record<OrderStatus, { label: string; variant: BadgeVariant; color: string }> = {
  pending: { label: 'Pending', variant: 'outline', color: 'text-gray-500' },
  confirmed: { label: 'Confirmed', variant: 'default', color: 'bg-blue-500' },
  processing: { label: 'Processing', variant: 'default', color: 'bg-yellow-500' },
  shipped: { label: 'Shipped', variant: 'default', color: 'bg-purple-500' },
  delivered: { label: 'Delivered', variant: 'default', color: 'bg-green-500' },
  cancelled: { label: 'Cancelled', variant: 'destructive', color: 'bg-red-500' },
  refunded: { label: 'Refunded', variant: 'secondary', color: 'bg-gray-500' },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge variant={config.variant} className={cn(config.color, 'transition-colors duration-200')}>
      {config.label}
    </Badge>
  );
}
```

#### UX Implementation Notes
- **DataTable**: Uses Shadcn DataTable with sortable columns (UX-5)
- **Status Badges**: Color-coded per UX-4 spec
- **Search**: Debounced 300ms, searches order # and customer email
- **Filters**: Persist in URL for shareable links
- **Pagination**: Server-side pagination for performance
- **Row Click**: Navigate to order detail (UX-5)
- **Dark Mode**: Table uses #1A1A1A card background (UX-COLOR)

---

## Story 6.2: Order Detail View

As a **Merchant**,
I want **to view complete order details**,
So that **I can process and fulfill orders correctly**.

**Acceptance Criteria:**

**Given** a Merchant clicks on an order
**When** the order detail loads
**Then** they see:
- Customer information (shipping/billing address, email)
- Line items with variants, quantities, prices
- Payment details and transaction history
- Fulfillment status per item
- Order timeline with all events
**And** actions are available based on order status

### Technical Implementation

#### File Structure
```
apps/dashboard/src/app/(dashboard)/orders/[orderId]/
├── page.tsx                               # Order detail page (RSC)
├── _components/
│   ├── order-header.tsx                   # Order # + status + actions
│   ├── order-customer-card.tsx            # Customer info card
│   ├── order-items-card.tsx               # Line items table
│   ├── order-payment-card.tsx             # Payment details
│   ├── order-shipping-card.tsx            # Shipping address
│   ├── order-timeline.tsx                 # Event timeline
│   ├── order-actions-dropdown.tsx         # Context actions
│   └── order-tabs.tsx                     # Tab navigation
├── _hooks/
│   └── use-order-detail.ts
└── _actions/
    └── get-order.ts
```

#### Zod Schemas (`@trafi/validators`)
```typescript
// packages/validators/src/order.ts
export const OrderLineItemSchema = z.object({
  id: z.string().startsWith('oli_'),
  productId: z.string().startsWith('prod_'),
  variantId: z.string().startsWith('var_').nullable(),
  productName: z.string(),
  variantName: z.string().nullable(),
  sku: z.string().nullable(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().int(), // Cents
  totalPrice: z.number().int(), // Cents
  imageUrl: z.string().url().nullable(),
  fulfillmentStatus: FulfillmentStatusSchema,
  fulfilledQuantity: z.number().int(),
});

export const OrderAddressSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  address1: z.string(),
  address2: z.string().nullable(),
  city: z.string(),
  state: z.string().nullable(),
  postalCode: z.string(),
  country: z.string(),
  phone: z.string().nullable(),
});

export const OrderTimelineEventSchema = z.object({
  id: z.string(),
  type: z.enum([
    'order_created',
    'payment_received',
    'payment_failed',
    'status_changed',
    'fulfillment_created',
    'shipment_created',
    'tracking_updated',
    'delivered',
    'refund_issued',
    'note_added',
  ]),
  description: z.string(),
  metadata: z.record(z.unknown()).nullable(),
  createdAt: z.date(),
  createdBy: z.string().nullable(), // Admin user name or "System"
});

export const OrderDetailSchema = z.object({
  id: OrderIdSchema,
  orderNumber: z.string(),
  createdAt: z.date(),
  status: OrderStatusSchema,
  paymentStatus: PaymentStatusSchema,
  fulfillmentStatus: FulfillmentStatusSchema,
  customer: z.object({
    id: z.string().nullable(),
    name: z.string(),
    email: z.string().email(),
  }),
  shippingAddress: OrderAddressSchema,
  billingAddress: OrderAddressSchema,
  items: z.array(OrderLineItemSchema),
  subtotal: z.number().int(),
  shippingCost: z.number().int(),
  taxAmount: z.number().int(),
  discountAmount: z.number().int(),
  total: z.number().int(),
  currency: z.string().length(3),
  payment: z.object({
    method: z.string(),
    last4: z.string().nullable(),
    brand: z.string().nullable(),
    stripePaymentIntentId: z.string(),
  }).nullable(),
  timeline: z.array(OrderTimelineEventSchema),
  notes: z.string().nullable(),
});
```

#### Backend Order Service (extended)
```typescript
// apps/api/src/order/order.service.ts
@Injectable()
export class OrderService {
  // ... existing methods

  // Protected for @trafi/core extensibility (RETRO-2)
  protected async getOrderDetail(
    storeId: string,
    orderId: string,
  ): Promise<OrderDetail> {
    const order = await this.prisma.order.findUniqueOrThrow({
      where: { id: orderId, storeId },
      include: {
        customer: true,
        items: {
          include: {
            product: { select: { name: true, images: { take: 1 } } },
            variant: { select: { name: true, sku: true } },
          },
        },
        payment: true,
        shippingAddress: true,
        billingAddress: true,
        timeline: {
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { name: true } } },
        },
        fulfillments: {
          include: { items: true },
        },
      },
    });

    // Calculate fulfilled quantities per item
    const fulfilledQuantities = this.calculateFulfilledQuantities(order.fulfillments);

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      status: order.status as OrderStatus,
      paymentStatus: order.paymentStatus as PaymentStatus,
      fulfillmentStatus: order.fulfillmentStatus as FulfillmentStatus,
      customer: {
        id: order.customer?.id ?? null,
        name: order.customer?.name ?? order.customerName,
        email: order.customerEmail,
      },
      shippingAddress: this.mapAddress(order.shippingAddress),
      billingAddress: this.mapAddress(order.billingAddress),
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        productName: item.product.name,
        variantName: item.variant?.name ?? null,
        sku: item.variant?.sku ?? null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        imageUrl: item.product.images[0]?.url ?? null,
        fulfillmentStatus: this.getItemFulfillmentStatus(item, fulfilledQuantities),
        fulfilledQuantity: fulfilledQuantities[item.id] ?? 0,
      })),
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      taxAmount: order.taxAmount,
      discountAmount: order.discountAmount,
      total: order.total,
      currency: order.currency,
      payment: order.payment ? {
        method: order.payment.method,
        last4: order.payment.cardLast4,
        brand: order.payment.cardBrand,
        stripePaymentIntentId: order.payment.stripePaymentIntentId,
      } : null,
      timeline: order.timeline.map((event) => ({
        id: event.id,
        type: event.type as TimelineEventType,
        description: event.description,
        metadata: event.metadata,
        createdAt: event.createdAt,
        createdBy: event.user?.name ?? 'System',
      })),
      notes: order.notes,
    };
  }

  private calculateFulfilledQuantities(
    fulfillments: Fulfillment[],
  ): Record<string, number> {
    const quantities: Record<string, number> = {};
    for (const fulfillment of fulfillments) {
      for (const item of fulfillment.items) {
        quantities[item.orderItemId] = (quantities[item.orderItemId] ?? 0) + item.quantity;
      }
    }
    return quantities;
  }

  private getItemFulfillmentStatus(
    item: OrderItem,
    fulfilledQuantities: Record<string, number>,
  ): FulfillmentStatus {
    const fulfilled = fulfilledQuantities[item.id] ?? 0;
    if (fulfilled === 0) return 'unfulfilled';
    if (fulfilled < item.quantity) return 'partially_fulfilled';
    return 'fulfilled';
  }
}
```

#### Server Action (`apps/dashboard/src/app/(dashboard)/orders/[orderId]/_actions/get-order.ts`)
```typescript
'use server';

import { createServerAction } from 'zsa';
import { trpc } from '@/lib/trpc/server';

export const getOrderAction = createServerAction()
  .input(z.object({ orderId: OrderIdSchema }))
  .handler(async ({ input }) => {
    return trpc.order.getDetail(input);
  });
```

#### Dashboard Data Flow
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Order Detail Page (RSC)                                                      │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ OrderHeader (Client Component)                                           │ │
│ │   ├─ Order # (Clash Display font) + Date                                │ │
│ │   ├─ Status badges (order, payment, fulfillment)                        │ │
│ │   └─ OrderActionsDropdown (based on current status)                     │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ OrderTabs (Client Component) - UX-6                                      │ │
│ │   ├─ Tab: Details                                                        │ │
│ │   │   ├─ OrderCustomerCard (name, email, contact)                       │ │
│ │   │   ├─ OrderShippingCard (address)                                    │ │
│ │   │   └─ OrderPaymentCard (method, last4, Stripe link)                  │ │
│ │   │                                                                      │ │
│ │   ├─ Tab: Items                                                          │ │
│ │   │   └─ OrderItemsCard (table with images, fulfillment status)         │ │
│ │   │                                                                      │ │
│ │   ├─ Tab: Timeline                                                       │ │
│ │   │   └─ OrderTimeline (vertical timeline with events)                  │ │
│ │   │                                                                      │ │
│ │   └─ Tab: Returns                                                        │ │
│ │       └─ OrderReturnsCard (RMA list if any)                             │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Order Header Component (`apps/dashboard/src/app/(dashboard)/orders/[orderId]/_components/order-header.tsx`)
```typescript
'use client';

export function OrderHeader({ order }: { order: OrderDetail }) {
  return (
    <div className="flex items-center justify-between pb-6 border-b">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="font-clash text-2xl font-bold">{order.orderNumber}</h1>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {format(order.createdAt, 'PPpp')}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex gap-2 mr-4">
          <Badge variant="outline">
            Payment: {order.paymentStatus}
          </Badge>
          <Badge variant="outline">
            Fulfillment: {order.fulfillmentStatus}
          </Badge>
        </div>

        <OrderActionsDropdown order={order} />
      </div>
    </div>
  );
}
```

#### Order Timeline (`apps/dashboard/src/app/(dashboard)/orders/[orderId]/_components/order-timeline.tsx`)
```typescript
'use client';

const EVENT_ICONS: Record<string, LucideIcon> = {
  order_created: ShoppingCart,
  payment_received: CreditCard,
  payment_failed: XCircle,
  status_changed: RefreshCw,
  fulfillment_created: Package,
  shipment_created: Truck,
  tracking_updated: MapPin,
  delivered: CheckCircle,
  refund_issued: ArrowLeftRight,
  note_added: MessageSquare,
};

export function OrderTimeline({ timeline }: { timeline: OrderTimelineEvent[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

          <div className="space-y-6">
            {timeline.map((event) => {
              const Icon = EVENT_ICONS[event.type] ?? Circle;

              return (
                <div key={event.id} className="relative pl-10">
                  <div className="absolute left-0 w-8 h-8 rounded-full bg-background border flex items-center justify-center">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>

                  <div>
                    <p className="text-sm font-medium">{event.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(event.createdAt, { addSuffix: true })}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        by {event.createdBy}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

#### UX Implementation Notes
- **Tabs**: 4 sections per UX-6 (Details, Items, Timeline, Returns)
- **Timeline**: Vertical timeline with icons (UX-8)
- **Order Number**: Uses Clash Display font (UX-TYPE)
- **Tab Transitions**: 150ms ease (UX-ANIM)
- **Dark Mode**: Cards use #1A1A1A background (UX-COLOR)
- **Breadcrumb**: Dashboard > Orders > [Order #] (UX-3)

---

## Story 6.3: Order Status Transitions

As a **Merchant**,
I want **to update order status through its lifecycle**,
So that **orders progress from confirmed to completed**.

**Acceptance Criteria:**

**Given** an order exists
**When** the Merchant changes status
**Then** valid transitions are enforced:
- Confirmed -> Processing -> Shipped -> Delivered
- Any status -> Cancelled (with restrictions)
**And** status changes are logged in order timeline
**And** invalid transitions are prevented with clear messaging
**And** status changes trigger appropriate notifications

### Technical Implementation

#### File Structure
```
apps/dashboard/src/app/(dashboard)/orders/[orderId]/
├── _components/
│   ├── status-transition-dialog.tsx       # Status change modal
│   └── order-actions-dropdown.tsx         # Actions based on status
└── _actions/
    └── update-order-status.ts

apps/api/src/
├── order/
│   ├── order-status.service.ts            # Status transition logic
│   └── order-status.machine.ts            # State machine definition
```

#### Zod Schemas (`@trafi/validators`)
```typescript
// packages/validators/src/order.ts
export const UpdateOrderStatusInputSchema = z.object({
  orderId: OrderIdSchema,
  newStatus: OrderStatusSchema,
  reason: z.string().max(500).optional(),
  notifyCustomer: z.boolean().default(true),
});

export const StatusTransitionSchema = z.object({
  from: OrderStatusSchema,
  to: OrderStatusSchema,
  allowed: z.boolean(),
  requiresReason: z.boolean(),
  triggersNotification: z.boolean(),
});
```

#### Status State Machine (`apps/api/src/order/order-status.machine.ts`)
```typescript
// Valid status transitions
const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [], // Terminal state
  cancelled: [], // Terminal state
  refunded: [], // Terminal state (set by payment system)
};

// Transitions that require a reason
const REQUIRES_REASON: Array<[OrderStatus, OrderStatus]> = [
  ['confirmed', 'cancelled'],
  ['processing', 'cancelled'],
  ['shipped', 'cancelled'],
];

// Transitions that trigger customer notification
const TRIGGERS_NOTIFICATION: Array<[OrderStatus, OrderStatus]> = [
  ['pending', 'confirmed'],
  ['confirmed', 'processing'],
  ['processing', 'shipped'],
  ['shipped', 'delivered'],
  ['*', 'cancelled'],
];

export function isValidTransition(from: OrderStatus, to: OrderStatus): boolean {
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function requiresReason(from: OrderStatus, to: OrderStatus): boolean {
  return REQUIRES_REASON.some(([f, t]) => f === from && t === to);
}

export function shouldNotify(from: OrderStatus, to: OrderStatus): boolean {
  return TRIGGERS_NOTIFICATION.some(
    ([f, t]) => (f === '*' || f === from) && t === to,
  );
}

export function getAvailableTransitions(current: OrderStatus): OrderStatus[] {
  return STATUS_TRANSITIONS[current] ?? [];
}
```

#### Backend Status Service (`apps/api/src/order/order-status.service.ts`)
```typescript
@Injectable()
export class OrderStatusService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private timelineService: OrderTimelineService,
  ) {}

  // Protected for @trafi/core extensibility (RETRO-2)
  protected async updateStatus(
    storeId: string,
    input: UpdateOrderStatusInput,
    adminUserId: string,
  ): Promise<OrderDetail> {
    const order = await this.prisma.order.findUniqueOrThrow({
      where: { id: input.orderId, storeId },
    });

    // Validate transition
    if (!isValidTransition(order.status as OrderStatus, input.newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${order.status} to ${input.newStatus}`,
      );
    }

    // Check if reason is required
    if (requiresReason(order.status as OrderStatus, input.newStatus) && !input.reason) {
      throw new BadRequestException('Reason is required for this status change');
    }

    // Update order status
    const updatedOrder = await this.prisma.order.update({
      where: { id: input.orderId },
      data: { status: input.newStatus },
    });

    // Log timeline event
    await this.timelineService.addEvent({
      orderId: input.orderId,
      type: 'status_changed',
      description: `Order status changed from ${order.status} to ${input.newStatus}`,
      metadata: {
        previousStatus: order.status,
        newStatus: input.newStatus,
        reason: input.reason,
      },
      userId: adminUserId,
    });

    // Send notification if needed
    if (input.notifyCustomer && shouldNotify(order.status as OrderStatus, input.newStatus)) {
      await this.emailService.sendOrderStatusUpdate({
        orderId: order.id,
        orderNumber: order.orderNumber,
        newStatus: input.newStatus,
        customerEmail: order.customerEmail,
        reason: input.reason,
      });
    }

    return this.orderService.getOrderDetail(storeId, input.orderId);
  }

  protected async getAvailableActions(orderId: string): Promise<OrderStatus[]> {
    const order = await this.prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      select: { status: true },
    });

    return getAvailableTransitions(order.status as OrderStatus);
  }
}
```

#### Server Action (`apps/dashboard/src/app/(dashboard)/orders/[orderId]/_actions/update-order-status.ts`)
```typescript
'use server';

import { createServerAction } from 'zsa';
import { UpdateOrderStatusInputSchema } from '@trafi/validators';
import { trpc } from '@/lib/trpc/server';

export const updateOrderStatusAction = createServerAction()
  .input(UpdateOrderStatusInputSchema)
  .handler(async ({ input }) => {
    return trpc.order.updateStatus(input);
  });

export const getAvailableActionsAction = createServerAction()
  .input(z.object({ orderId: OrderIdSchema }))
  .handler(async ({ input }) => {
    return trpc.order.getAvailableActions(input);
  });
```

#### Status Transition Dialog (`apps/dashboard/src/app/(dashboard)/orders/[orderId]/_components/status-transition-dialog.tsx`)
```typescript
'use client';

import { useServerAction, useServerActionQuery } from 'zsa-react';
import { updateOrderStatusAction, getAvailableActionsAction } from '../_actions/update-order-status';

export function StatusTransitionDialog({ order, open, onOpenChange }: Props) {
  const { data: availableStatuses } = useServerActionQuery(
    getAvailableActionsAction,
    { input: { orderId: order.id }, queryKey: ['available-statuses', order.id] },
  );

  const { execute, isPending } = useServerAction(updateOrderStatusAction);

  const [newStatus, setNewStatus] = useState<OrderStatus | null>(null);
  const [reason, setReason] = useState('');
  const [notifyCustomer, setNotifyCustomer] = useState(true);

  const selectedTransition = newStatus
    ? { requiresReason: requiresReason(order.status, newStatus) }
    : null;

  const handleSubmit = async () => {
    if (!newStatus) return;

    const [result, error] = await execute({
      orderId: order.id,
      newStatus,
      reason: reason || undefined,
      notifyCustomer,
    });

    if (error) {
      toast.error('Failed to update status', { description: error.message });
      return;
    }

    toast.success('Order status updated');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Order Status</DialogTitle>
          <DialogDescription>
            Current status: <Badge>{order.status}</Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status Selection */}
          <div className="space-y-2">
            <Label>New Status</Label>
            <RadioGroup value={newStatus ?? ''} onValueChange={setNewStatus}>
              {availableStatuses?.map((status) => (
                <div key={status} className="flex items-center space-x-2">
                  <RadioGroupItem value={status} id={status} />
                  <Label htmlFor={status}>
                    <OrderStatusBadge status={status} />
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Reason (if required) */}
          {selectedTransition?.requiresReason && (
            <div className="space-y-2">
              <Label>Reason (required)</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this status change is needed..."
              />
            </div>
          )}

          {/* Notify Customer */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="notify"
              checked={notifyCustomer}
              onCheckedChange={setNotifyCustomer}
            />
            <Label htmlFor="notify">Notify customer about this change</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !newStatus || (selectedTransition?.requiresReason && !reason)}
          >
            {isPending ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

#### UX Implementation Notes
- **State Machine**: Enforces valid transitions only
- **Reason Required**: Cancellation requires explanation
- **Customer Notification**: Toggle to control email sending
- **Available Actions**: Dynamically show only valid next statuses
- **Badge Transitions**: 200ms animation (UX-ANIM)

---

## Story 6.4: Order Fulfillment - Manual

As a **Merchant**,
I want **to mark orders as fulfilled with tracking info**,
So that **customers know their order is on the way**.

**Acceptance Criteria:**

**Given** a confirmed/processing order
**When** the Merchant fulfills the order
**Then** they can:
- Select items to fulfill (partial or full)
- Enter carrier and tracking number
- Add internal fulfillment notes
**And** fulfillment creates a shipment record
**And** order status updates to "Shipped" when fully fulfilled
**And** partial fulfillment is tracked separately

### Technical Implementation

#### File Structure
```
apps/dashboard/src/app/(dashboard)/orders/[orderId]/
├── _components/
│   ├── fulfillment-dialog.tsx             # Fulfillment modal
│   ├── fulfillment-item-selector.tsx      # Item + quantity selection
│   ├── carrier-select.tsx                 # Carrier dropdown
│   └── fulfillment-history-card.tsx       # Previous shipments
└── _actions/
    └── create-fulfillment.ts

apps/api/src/
├── fulfillment/
│   ├── fulfillment.module.ts
│   ├── fulfillment.service.ts
│   └── carriers.config.ts                 # Supported carriers list
```

#### Zod Schemas (`@trafi/validators`)
```typescript
// packages/validators/src/fulfillment.ts
export const FulfillmentIdSchema = z.string().startsWith('ful_');
export const ShipmentIdSchema = z.string().startsWith('ship_');

export const CarrierSchema = z.enum([
  'colissimo',
  'chronopost',
  'dhl',
  'ups',
  'fedex',
  'mondial_relay',
  'la_poste',
  'other',
]);

export const FulfillmentItemInputSchema = z.object({
  orderItemId: z.string().startsWith('oli_'),
  quantity: z.number().int().positive(),
});

export const CreateFulfillmentInputSchema = z.object({
  orderId: OrderIdSchema,
  items: z.array(FulfillmentItemInputSchema).min(1),
  carrier: CarrierSchema,
  trackingNumber: z.string().min(1).max(100),
  notes: z.string().max(500).optional(),
  notifyCustomer: z.boolean().default(true),
});

export const FulfillmentSchema = z.object({
  id: FulfillmentIdSchema,
  orderId: OrderIdSchema,
  status: z.enum(['pending', 'shipped', 'delivered', 'cancelled']),
  carrier: CarrierSchema,
  trackingNumber: z.string(),
  trackingUrl: z.string().url().nullable(),
  items: z.array(z.object({
    orderItemId: z.string(),
    productName: z.string(),
    quantity: z.number(),
  })),
  notes: z.string().nullable(),
  shippedAt: z.date().nullable(),
  deliveredAt: z.date().nullable(),
  createdAt: z.date(),
  createdBy: z.string(),
});
```

#### Backend Fulfillment Service (`apps/api/src/fulfillment/fulfillment.service.ts`)
```typescript
@Injectable()
export class FulfillmentService {
  constructor(
    private prisma: PrismaService,
    private orderService: OrderService,
    private emailService: EmailService,
    private timelineService: OrderTimelineService,
  ) {}

  // Protected for @trafi/core extensibility (RETRO-2)
  protected async createFulfillment(
    storeId: string,
    input: CreateFulfillmentInput,
    adminUserId: string,
  ): Promise<Fulfillment> {
    const order = await this.prisma.order.findUniqueOrThrow({
      where: { id: input.orderId, storeId },
      include: { items: true, fulfillments: { include: { items: true } } },
    });

    // Validate items and quantities
    await this.validateFulfillmentItems(order, input.items);

    // Create fulfillment with shipment
    const fulfillment = await this.prisma.fulfillment.create({
      data: {
        id: generateId('ful'),
        orderId: order.id,
        status: 'shipped',
        carrier: input.carrier,
        trackingNumber: input.trackingNumber,
        trackingUrl: this.buildTrackingUrl(input.carrier, input.trackingNumber),
        notes: input.notes,
        shippedAt: new Date(),
        createdBy: adminUserId,
        items: {
          create: input.items.map((item) => ({
            orderItemId: item.orderItemId,
            quantity: item.quantity,
          })),
        },
      },
      include: { items: true },
    });

    // Update order fulfillment status
    await this.updateOrderFulfillmentStatus(order.id);

    // Log timeline event
    await this.timelineService.addEvent({
      orderId: order.id,
      type: 'shipment_created',
      description: `Shipment created with ${input.carrier} - ${input.trackingNumber}`,
      metadata: {
        fulfillmentId: fulfillment.id,
        carrier: input.carrier,
        trackingNumber: input.trackingNumber,
        itemCount: input.items.reduce((sum, i) => sum + i.quantity, 0),
      },
      userId: adminUserId,
    });

    // Send shipping notification
    if (input.notifyCustomer) {
      await this.emailService.sendShippingNotification({
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerEmail: order.customerEmail,
        carrier: input.carrier,
        trackingNumber: input.trackingNumber,
        trackingUrl: fulfillment.trackingUrl,
      });
    }

    return this.mapToResponse(fulfillment);
  }

  protected async validateFulfillmentItems(
    order: Order & { items: OrderItem[]; fulfillments: Fulfillment[] },
    items: FulfillmentItemInput[],
  ): Promise<void> {
    const fulfilledQuantities = this.calculateFulfilledQuantities(order.fulfillments);

    for (const item of items) {
      const orderItem = order.items.find((oi) => oi.id === item.orderItemId);
      if (!orderItem) {
        throw new BadRequestException(`Order item ${item.orderItemId} not found`);
      }

      const alreadyFulfilled = fulfilledQuantities[item.orderItemId] ?? 0;
      const remaining = orderItem.quantity - alreadyFulfilled;

      if (item.quantity > remaining) {
        throw new BadRequestException(
          `Cannot fulfill ${item.quantity} of item ${orderItem.productName}. Only ${remaining} remaining.`,
        );
      }
    }
  }

  protected buildTrackingUrl(carrier: Carrier, trackingNumber: string): string | null {
    const TRACKING_URLS: Record<Carrier, string> = {
      colissimo: `https://www.laposte.fr/outils/suivre-vos-envois?code=${trackingNumber}`,
      chronopost: `https://www.chronopost.fr/tracking-cxf/tracking-experience-cxf?liession=${trackingNumber}`,
      dhl: `https://www.dhl.com/fr-fr/home/tracking.html?tracking-id=${trackingNumber}`,
      ups: `https://www.ups.com/track?tracknum=${trackingNumber}`,
      fedex: `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
      mondial_relay: `https://www.mondialrelay.fr/suivi-de-colis/?numeroExpedition=${trackingNumber}`,
      la_poste: `https://www.laposte.fr/outils/suivre-vos-envois?code=${trackingNumber}`,
      other: null,
    };
    return TRACKING_URLS[carrier];
  }

  protected async updateOrderFulfillmentStatus(orderId: string): Promise<void> {
    const order = await this.prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { items: true, fulfillments: { include: { items: true } } },
    });

    const fulfilledQuantities = this.calculateFulfilledQuantities(order.fulfillments);
    const totalOrdered = order.items.reduce((sum, i) => sum + i.quantity, 0);
    const totalFulfilled = Object.values(fulfilledQuantities).reduce((sum, q) => sum + q, 0);

    let newStatus: FulfillmentStatus;
    if (totalFulfilled === 0) {
      newStatus = 'unfulfilled';
    } else if (totalFulfilled < totalOrdered) {
      newStatus = 'partially_fulfilled';
    } else {
      newStatus = 'fulfilled';
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        fulfillmentStatus: newStatus,
        status: newStatus === 'fulfilled' ? 'shipped' : undefined,
      },
    });
  }
}
```

#### Server Action (`apps/dashboard/src/app/(dashboard)/orders/[orderId]/_actions/create-fulfillment.ts`)
```typescript
'use server';

import { createServerAction } from 'zsa';
import { CreateFulfillmentInputSchema } from '@trafi/validators';
import { trpc } from '@/lib/trpc/server';

export const createFulfillmentAction = createServerAction()
  .input(CreateFulfillmentInputSchema)
  .handler(async ({ input }) => {
    return trpc.fulfillment.create(input);
  });
```

#### Fulfillment Dialog (`apps/dashboard/src/app/(dashboard)/orders/[orderId]/_components/fulfillment-dialog.tsx`)
```typescript
'use client';

import { useServerAction } from 'zsa-react';
import { createFulfillmentAction } from '../_actions/create-fulfillment';

export function FulfillmentDialog({ order, open, onOpenChange }: Props) {
  const { execute, isPending } = useServerAction(createFulfillmentAction);

  const [selectedItems, setSelectedItems] = useState<FulfillmentItemInput[]>([]);
  const [carrier, setCarrier] = useState<Carrier>('colissimo');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [notifyCustomer, setNotifyCustomer] = useState(true);

  // Filter to unfulfilled items only
  const unfulfilledItems = order.items.filter(
    (item) => item.fulfilledQuantity < item.quantity,
  );

  const handleSelectAll = () => {
    setSelectedItems(
      unfulfilledItems.map((item) => ({
        orderItemId: item.id,
        quantity: item.quantity - item.fulfilledQuantity,
      })),
    );
  };

  const handleSubmit = async () => {
    const [result, error] = await execute({
      orderId: order.id,
      items: selectedItems,
      carrier,
      trackingNumber,
      notes: notes || undefined,
      notifyCustomer,
    });

    if (error) {
      toast.error('Fulfillment failed', { description: error.message });
      return;
    }

    toast.success('Shipment created', {
      description: `Tracking: ${trackingNumber}`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Fulfillment</DialogTitle>
          <DialogDescription>
            Select items to ship and enter tracking information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {/* Item Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Items to Fulfill</Label>
              <Button variant="link" size="sm" onClick={handleSelectAll}>
                Select All
              </Button>
            </div>
            <FulfillmentItemSelector
              items={unfulfilledItems}
              selected={selectedItems}
              onChange={setSelectedItems}
            />
          </div>

          {/* Carrier Selection */}
          <div className="space-y-2">
            <Label>Carrier</Label>
            <CarrierSelect value={carrier} onValueChange={setCarrier} />
          </div>

          {/* Tracking Number */}
          <div className="space-y-2">
            <Label>Tracking Number</Label>
            <Input
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Enter tracking number"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Internal Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes for your team..."
            />
          </div>

          {/* Notify Customer */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="notify-shipping"
              checked={notifyCustomer}
              onCheckedChange={setNotifyCustomer}
            />
            <Label htmlFor="notify-shipping">
              Send shipping notification to customer
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || selectedItems.length === 0 || !trackingNumber}
          >
            {isPending ? 'Creating...' : 'Create Shipment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

#### UX Implementation Notes
- **Partial Fulfillment**: Select specific items/quantities (UX-7)
- **Carrier Dropdown**: Pre-configured French carriers with tracking URLs
- **Tracking Link**: Auto-generated based on carrier
- **Item Selector**: Checkbox + quantity stepper for each item
- **Notification Toggle**: Customer receives shipping email by default

---

## Story 6.5: Shipping Notification Emails

As a **System**,
I want **to send shipping notifications with tracking**,
So that **customers can track their orders**.

**Acceptance Criteria:**

**Given** an order is marked as shipped
**When** fulfillment is completed
**Then** an email is sent to the customer with:
- Order summary
- Shipping carrier and tracking number
- Tracking link (carrier-specific)
- Estimated delivery date if available
**And** email uses store branding
**And** email sending is queued via job system

### Technical Implementation

#### File Structure
```
apps/api/src/
├── email/
│   ├── email.module.ts
│   ├── email.service.ts
│   ├── templates/
│   │   ├── shipping-notification.tsx      # React Email template
│   │   └── components/                    # Shared email components
│   └── jobs/
│       └── send-email.job.ts              # BullMQ job processor
```

#### Zod Schemas (`@trafi/validators`)
```typescript
// packages/validators/src/email.ts
export const ShippingNotificationDataSchema = z.object({
  orderId: OrderIdSchema,
  orderNumber: z.string(),
  customerEmail: z.string().email(),
  customerName: z.string(),
  carrier: CarrierSchema,
  carrierName: z.string(),
  trackingNumber: z.string(),
  trackingUrl: z.string().url().nullable(),
  estimatedDelivery: z.date().nullable(),
  items: z.array(z.object({
    name: z.string(),
    quantity: z.number(),
    imageUrl: z.string().nullable(),
  })),
  storeName: z.string(),
  storeLogoUrl: z.string().nullable(),
  primaryColor: z.string(),
});
```

#### Email Service (`apps/api/src/email/email.service.ts`)
```typescript
@Injectable()
export class EmailService {
  constructor(
    private resend: ResendService,
    private queue: QueueService,
    private prisma: PrismaService,
  ) {}

  // Protected for @trafi/core extensibility (RETRO-2)
  protected async sendShippingNotification(
    data: ShippingNotificationData,
  ): Promise<void> {
    // Queue email job for async processing
    await this.queue.add('send-email', {
      type: 'shipping_notification',
      data,
    });
  }

  protected async processShippingNotificationEmail(
    data: ShippingNotificationData,
  ): Promise<void> {
    // Get store branding
    const store = await this.prisma.store.findUniqueOrThrow({
      where: { id: data.storeId },
      select: {
        name: true,
        logoUrl: true,
        settings: { select: { primaryColor: true } },
      },
    });

    // Render React Email template
    const html = await render(
      ShippingNotificationEmail({
        ...data,
        storeName: store.name,
        storeLogoUrl: store.logoUrl,
        primaryColor: store.settings?.primaryColor ?? '#F97316',
      }),
    );

    // Send via Resend (RETRO-1: Context7 for Resend docs)
    await this.resend.emails.send({
      from: `${store.name} <orders@${process.env.EMAIL_DOMAIN}>`,
      to: data.customerEmail,
      subject: `Your order ${data.orderNumber} has shipped!`,
      html,
    });
  }
}
```

#### React Email Template (`apps/api/src/email/templates/shipping-notification.tsx`)
```typescript
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';

export function ShippingNotificationEmail({
  orderNumber,
  customerName,
  carrierName,
  trackingNumber,
  trackingUrl,
  estimatedDelivery,
  items,
  storeName,
  storeLogoUrl,
  primaryColor,
}: ShippingNotificationData) {
  return (
    <Html>
      <Head />
      <Preview>Your order {orderNumber} is on its way!</Preview>
      <Body style={{ fontFamily: 'General Sans, sans-serif', backgroundColor: '#f4f4f5' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
          {/* Header with logo */}
          {storeLogoUrl && (
            <Section style={{ textAlign: 'center', marginBottom: '32px' }}>
              <Img src={storeLogoUrl} alt={storeName} height="40" />
            </Section>
          )}

          {/* Main heading */}
          <Heading style={{ color: '#1a1a1a', fontSize: '24px', marginBottom: '16px' }}>
            Your order is on its way! 📦
          </Heading>

          <Text style={{ color: '#525252', fontSize: '16px', lineHeight: '24px' }}>
            Hi {customerName},
          </Text>

          <Text style={{ color: '#525252', fontSize: '16px', lineHeight: '24px' }}>
            Great news! Your order <strong>{orderNumber}</strong> has been shipped
            via <strong>{carrierName}</strong>.
          </Text>

          {/* Tracking info */}
          <Section style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '24px',
            marginTop: '24px',
          }}>
            <Text style={{ color: '#525252', fontSize: '14px', margin: '0 0 8px' }}>
              Tracking Number
            </Text>
            <Text style={{ color: '#1a1a1a', fontSize: '18px', fontWeight: '600', margin: '0 0 16px' }}>
              {trackingNumber}
            </Text>

            {estimatedDelivery && (
              <>
                <Text style={{ color: '#525252', fontSize: '14px', margin: '0 0 8px' }}>
                  Estimated Delivery
                </Text>
                <Text style={{ color: '#1a1a1a', fontSize: '16px', fontWeight: '500', margin: '0 0 16px' }}>
                  {format(estimatedDelivery, 'EEEE, MMMM d')}
                </Text>
              </>
            )}

            {trackingUrl && (
              <Button
                href={trackingUrl}
                style={{
                  backgroundColor: primaryColor,
                  color: '#ffffff',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                Track Your Package
              </Button>
            )}
          </Section>

          {/* Items shipped */}
          <Section style={{ marginTop: '32px' }}>
            <Heading as="h2" style={{ color: '#1a1a1a', fontSize: '18px', marginBottom: '16px' }}>
              Items Shipped
            </Heading>

            {items.map((item, index) => (
              <Section
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '8px',
                }}
              >
                {item.imageUrl && (
                  <Img
                    src={item.imageUrl}
                    alt={item.name}
                    width="60"
                    height="60"
                    style={{ borderRadius: '4px', marginRight: '16px' }}
                  />
                )}
                <div>
                  <Text style={{ color: '#1a1a1a', fontSize: '14px', fontWeight: '500', margin: 0 }}>
                    {item.name}
                  </Text>
                  <Text style={{ color: '#737373', fontSize: '14px', margin: '4px 0 0' }}>
                    Qty: {item.quantity}
                  </Text>
                </div>
              </Section>
            ))}
          </Section>

          {/* Footer */}
          <Section style={{ marginTop: '40px', textAlign: 'center' }}>
            <Text style={{ color: '#a1a1aa', fontSize: '12px' }}>
              Questions? Reply to this email or contact us at support@{storeName.toLowerCase()}.com
            </Text>
            <Text style={{ color: '#a1a1aa', fontSize: '12px' }}>
              © {new Date().getFullYear()} {storeName}. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
```

#### Job Processor (`apps/api/src/email/jobs/send-email.job.ts`)
```typescript
@Processor('email')
export class SendEmailProcessor {
  constructor(private emailService: EmailService) {}

  @Process('send-email')
  async handleSendEmail(job: Job<SendEmailJobData>) {
    const { type, data } = job.data;

    switch (type) {
      case 'shipping_notification':
        await this.emailService.processShippingNotificationEmail(data);
        break;
      // Other email types...
    }
  }
}
```

#### UX Implementation Notes
- **Store Branding**: Logo and primary color from store settings
- **React Email**: Type-safe email templates with good rendering
- **Async Queue**: BullMQ for reliable email delivery
- **Tracking Button**: CTA with carrier-specific tracking URL
- **Estimated Delivery**: Shown if available from carrier API

---

## Story 6.6: Fulfillment Webhooks for 3PL

As a **3PL Partner**,
I want **to receive order data via webhooks**,
So that **I can fulfill orders automatically**.

**Acceptance Criteria:**

**Given** a Merchant has configured 3PL webhook
**When** an order is ready for fulfillment
**Then** a webhook is sent with:
- Order details and line items
- Shipping address
- Requested shipping method
**And** webhooks are signed with HMAC-SHA256 (NFR-INT-6)
**And** failed deliveries retry with exponential backoff (NFR-INT-5)
**And** webhook events include `order.created`, `order.updated`

### Technical Implementation

#### File Structure
```
apps/api/src/
├── webhooks/
│   ├── outgoing/
│   │   ├── webhook-dispatcher.service.ts
│   │   ├── webhook-signer.service.ts
│   │   └── webhook-retry.job.ts
│   └── events/
│       └── order-webhook.events.ts

apps/dashboard/src/app/(dashboard)/settings/webhooks/
├── page.tsx
├── _components/
│   └── webhook-config-form.tsx
└── _actions/
    └── manage-webhooks.ts
```

#### Zod Schemas (`@trafi/validators`)
```typescript
export const WebhookEventTypeSchema = z.enum([
  'order.created',
  'order.updated',
  'order.fulfilled',
  'order.cancelled',
]);

export const WebhookConfigSchema = z.object({
  id: z.string().startsWith('whk_'),
  url: z.string().url(),
  secret: z.string().min(32),
  events: z.array(WebhookEventTypeSchema),
  isActive: z.boolean(),
});

export const WebhookDeliverySchema = z.object({
  id: z.string(),
  webhookId: z.string(),
  event: WebhookEventTypeSchema,
  payload: z.record(z.unknown()),
  status: z.enum(['pending', 'delivered', 'failed']),
  attempts: z.number(),
  lastAttemptAt: z.date().nullable(),
  responseCode: z.number().nullable(),
});
```

#### Webhook Dispatcher (`apps/api/src/webhooks/outgoing/webhook-dispatcher.service.ts`)
```typescript
@Injectable()
export class WebhookDispatcherService {
  constructor(
    private prisma: PrismaService,
    private signerService: WebhookSignerService,
    private queue: QueueService,
  ) {}

  // Protected for @trafi/core extensibility (RETRO-2)
  protected async dispatch(
    storeId: string,
    event: WebhookEventType,
    payload: Record<string, unknown>,
  ): Promise<void> {
    // Get active webhooks for this store and event
    const webhooks = await this.prisma.webhookConfig.findMany({
      where: { storeId, isActive: true, events: { has: event } },
    });

    for (const webhook of webhooks) {
      // Create delivery record
      const delivery = await this.prisma.webhookDelivery.create({
        data: {
          id: generateId('whdel'),
          webhookId: webhook.id,
          event,
          payload,
          status: 'pending',
          attempts: 0,
        },
      });

      // Queue delivery job
      await this.queue.add('webhook-delivery', {
        deliveryId: delivery.id,
        webhookUrl: webhook.url,
        secret: webhook.secret,
        payload,
        event,
      });
    }
  }

  protected async deliverWebhook(job: WebhookDeliveryJob): Promise<void> {
    const { deliveryId, webhookUrl, secret, payload, event } = job;

    // Sign payload (NFR-INT-6)
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = this.signerService.sign(payload, secret, timestamp);

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Trafi-Event': event,
          'X-Trafi-Timestamp': timestamp.toString(),
          'X-Trafi-Signature': signature,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000), // 30s timeout
      });

      await this.prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: response.ok ? 'delivered' : 'failed',
          responseCode: response.status,
          attempts: { increment: 1 },
          lastAttemptAt: new Date(),
        },
      });

      if (!response.ok) {
        throw new Error(`Webhook returned ${response.status}`);
      }
    } catch (error) {
      // Update failure and throw for retry (NFR-INT-5)
      await this.prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: 'failed',
          attempts: { increment: 1 },
          lastAttemptAt: new Date(),
        },
      });
      throw error;
    }
  }
}
```

#### Webhook Signer (`apps/api/src/webhooks/outgoing/webhook-signer.service.ts`)
```typescript
@Injectable()
export class WebhookSignerService {
  sign(payload: Record<string, unknown>, secret: string, timestamp: number): string {
    const signedPayload = `${timestamp}.${JSON.stringify(payload)}`;
    return crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');
  }

  verify(payload: string, signature: string, secret: string, timestamp: number): boolean {
    const expectedSignature = this.sign(JSON.parse(payload), secret, timestamp);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  }
}
```

#### UX Implementation Notes
- **HMAC-SHA256**: Signature includes timestamp to prevent replay attacks
- **Retry**: Exponential backoff (1s, 2s, 4s, 8s, 16s) up to 5 attempts
- **Timeout**: 30 second timeout per delivery attempt
- **Dashboard**: Configure webhook URLs and select event types

---

## Story 6.7: 3PL Tracking Update API

As a **3PL Partner**,
I want **to update tracking information via API**,
So that **the store has real-time shipping data**.

**Acceptance Criteria:**

**Given** a 3PL has an API key with fulfillment scope
**When** they POST tracking updates
**Then** the API accepts:
- Order ID or external reference
- Carrier code and tracking number
- Shipment status updates
**And** updates trigger customer notifications
**And** API validates the 3PL has access to the order
**And** duplicate updates are handled idempotently

### Technical Implementation

#### Zod Schemas (`@trafi/validators`)
```typescript
export const TrackingUpdateInputSchema = z.object({
  orderReference: z.string(), // Order ID or external ref
  carrier: CarrierSchema,
  trackingNumber: z.string(),
  status: z.enum(['in_transit', 'out_for_delivery', 'delivered', 'exception']),
  statusMessage: z.string().optional(),
  estimatedDelivery: z.date().optional(),
  location: z.string().optional(),
  idempotencyKey: z.string().min(16), // Required for idempotent updates
});
```

#### Backend API Controller (`apps/api/src/api/v1/fulfillment.controller.ts`)
```typescript
@Controller('api/v1/fulfillment')
@UseGuards(ApiKeyGuard)
export class FulfillmentApiController {
  constructor(
    private fulfillmentService: FulfillmentService,
    private idempotencyService: IdempotencyService,
  ) {}

  @Post('tracking')
  @ApiKeyScopes(['fulfillment:write'])
  async updateTracking(
    @Body() input: TrackingUpdateInput,
    @Headers('x-idempotency-key') idempotencyKey: string,
    @ApiKeyContext() apiKeyContext: { storeId: string },
  ) {
    // Check idempotency (NFR-INT-8)
    const existing = await this.idempotencyService.get(idempotencyKey);
    if (existing) return existing;

    // Find order by ID or external reference
    const order = await this.fulfillmentService.findOrderByReference(
      apiKeyContext.storeId,
      input.orderReference,
    );

    // Update tracking
    const result = await this.fulfillmentService.updateTracking(order.id, {
      carrier: input.carrier,
      trackingNumber: input.trackingNumber,
      status: input.status,
      statusMessage: input.statusMessage,
      estimatedDelivery: input.estimatedDelivery,
    });

    // Store for idempotency
    await this.idempotencyService.set(idempotencyKey, result, 86400); // 24h TTL

    return result;
  }
}
```

#### UX Implementation Notes
- **API Key Auth**: 3PL uses API key with `fulfillment:write` scope
- **Idempotency**: Header-based idempotency key prevents duplicate updates
- **External Reference**: Can use order ID or 3PL's own reference
- **Customer Notification**: Tracking updates trigger email if status changes

---

## Story 6.8: Return Authorization (RMA)

As a **Merchant**,
I want **to manage return requests**,
So that **I can handle returns systematically**.

**Acceptance Criteria:**

**Given** a delivered order
**When** the Merchant creates a return authorization
**Then** they can:
- Select items to be returned
- Specify return reason
- Generate RMA number
- Set return instructions
**And** RMA status tracks: Requested -> Approved -> Received -> Processed
**And** return can trigger refund when received
**And** inventory is optionally restocked on return

### Technical Implementation

#### File Structure
```
apps/dashboard/src/app/(dashboard)/orders/[orderId]/returns/
├── page.tsx                               # Returns tab content
├── _components/
│   ├── create-rma-dialog.tsx
│   ├── rma-list.tsx
│   ├── rma-status-timeline.tsx
│   └── process-return-dialog.tsx
└── _actions/
    ├── create-rma.ts
    ├── update-rma-status.ts
    └── process-return.ts

apps/api/src/
├── return/
│   ├── return.module.ts
│   ├── return.service.ts
│   └── rma-status.machine.ts
```

#### Zod Schemas (`@trafi/validators`)
```typescript
export const RmaIdSchema = z.string().startsWith('rma_');

export const RmaStatusSchema = z.enum([
  'requested',
  'approved',
  'rejected',
  'items_received',
  'processed',
  'closed',
]);

export const ReturnReasonSchema = z.enum([
  'defective',
  'wrong_item',
  'not_as_described',
  'changed_mind',
  'arrived_late',
  'other',
]);

export const CreateRmaInputSchema = z.object({
  orderId: OrderIdSchema,
  items: z.array(z.object({
    orderItemId: z.string().startsWith('oli_'),
    quantity: z.number().int().positive(),
    reason: ReturnReasonSchema,
    notes: z.string().optional(),
  })).min(1),
  customerComments: z.string().optional(),
});

export const RmaSchema = z.object({
  id: RmaIdSchema,
  rmaNumber: z.string(), // RMA-2024-001234
  orderId: OrderIdSchema,
  status: RmaStatusSchema,
  items: z.array(z.object({
    orderItemId: z.string(),
    productName: z.string(),
    quantity: z.number(),
    reason: ReturnReasonSchema,
    receivedQuantity: z.number(),
  })),
  returnInstructions: z.string().nullable(),
  refundAmount: z.number().nullable(),
  refundId: RefundIdSchema.nullable(),
  restockItems: z.boolean(),
  createdAt: z.date(),
  processedAt: z.date().nullable(),
});
```

#### Backend Return Service (`apps/api/src/return/return.service.ts`)
```typescript
@Injectable()
export class ReturnService {
  constructor(
    private prisma: PrismaService,
    private refundService: RefundService,
    private inventoryService: InventoryService,
    private emailService: EmailService,
  ) {}

  // Protected for @trafi/core extensibility (RETRO-2)
  protected async createRma(
    storeId: string,
    input: CreateRmaInput,
    adminUserId: string,
  ): Promise<Rma> {
    const order = await this.prisma.order.findUniqueOrThrow({
      where: { id: input.orderId, storeId },
      include: { items: true },
    });

    // Validate order is delivered
    if (order.status !== 'delivered') {
      throw new BadRequestException('Can only create RMA for delivered orders');
    }

    // Generate RMA number
    const rmaNumber = await this.generateRmaNumber(storeId);

    const rma = await this.prisma.rma.create({
      data: {
        id: generateId('rma'),
        rmaNumber,
        orderId: order.id,
        status: 'requested',
        customerComments: input.customerComments,
        createdBy: adminUserId,
        items: {
          create: input.items.map((item) => ({
            orderItemId: item.orderItemId,
            quantity: item.quantity,
            reason: item.reason,
            notes: item.notes,
            receivedQuantity: 0,
          })),
        },
      },
      include: { items: true },
    });

    return this.mapToResponse(rma, order);
  }

  protected async updateStatus(
    rmaId: string,
    newStatus: RmaStatus,
    data?: { returnInstructions?: string; refundAmount?: number; restockItems?: boolean },
  ): Promise<Rma> {
    // Validate transition
    const rma = await this.prisma.rma.findUniqueOrThrow({ where: { id: rmaId } });
    if (!isValidRmaTransition(rma.status as RmaStatus, newStatus)) {
      throw new BadRequestException(`Invalid RMA transition from ${rma.status} to ${newStatus}`);
    }

    return this.prisma.rma.update({
      where: { id: rmaId },
      data: {
        status: newStatus,
        returnInstructions: data?.returnInstructions,
        refundAmount: data?.refundAmount,
        restockItems: data?.restockItems,
        ...(newStatus === 'processed' ? { processedAt: new Date() } : {}),
      },
    });
  }

  protected async processReturn(
    rmaId: string,
    options: { issueRefund: boolean; restockItems: boolean },
  ): Promise<Rma> {
    const rma = await this.prisma.rma.findUniqueOrThrow({
      where: { id: rmaId },
      include: { items: true, order: true },
    });

    if (rma.status !== 'items_received') {
      throw new BadRequestException('Can only process RMA after items received');
    }

    // Issue refund if requested
    if (options.issueRefund && rma.refundAmount) {
      const refund = await this.refundService.processRefund({
        orderId: rma.orderId,
        type: 'partial',
        amount: rma.refundAmount,
        reason: 'customer_request',
        notes: `Refund for RMA ${rma.rmaNumber}`,
        restockItems: false, // Handle separately
      });

      await this.prisma.rma.update({
        where: { id: rmaId },
        data: { refundId: refund.id },
      });
    }

    // Restock inventory if requested
    if (options.restockItems) {
      for (const item of rma.items) {
        await this.inventoryService.adjustStock({
          variantId: item.variantId,
          quantity: item.receivedQuantity,
          reason: 'return',
          reference: rma.rmaNumber,
        });
      }
    }

    return this.updateStatus(rmaId, 'processed');
  }
}
```

#### UX Implementation Notes
- **RMA Number**: Auto-generated format RMA-YYYY-XXXXXX
- **Status Flow**: Requested → Approved → Items Received → Processed → Closed
- **Item Selection**: Checkbox + quantity for each returnable item
- **Refund Integration**: Optional automatic refund when processed
- **Restock Option**: Toggle to restore inventory on return receipt

---

## Story 6.9: Return Policy Configuration

As a **Merchant**,
I want **to configure return policies**,
So that **customers know the return rules**.

**Acceptance Criteria:**

**Given** a Merchant accesses Return Settings
**When** they configure policies
**Then** they can set:
- Return window (days after delivery)
- Eligible product categories
- Return shipping responsibility (customer/merchant)
- Restocking fees if applicable
**And** policies are displayed during checkout
**And** RMA creation validates against active policy

### Technical Implementation

#### File Structure
```
apps/dashboard/src/app/(dashboard)/settings/returns/
├── page.tsx                               # Return policy settings
├── _components/
│   ├── return-policy-form.tsx
│   ├── policy-preview.tsx
│   └── category-exclusions.tsx
└── _actions/
    └── update-return-policy.ts

apps/api/src/
├── return/
│   └── return-policy.service.ts
```

#### Zod Schemas (`@trafi/validators`)
```typescript
export const ShippingResponsibilitySchema = z.enum(['customer', 'merchant']);

export const ReturnPolicySchema = z.object({
  returnWindowDays: z.number().int().min(0).max(365),
  isEnabled: z.boolean(),
  excludedCategories: z.array(z.string()), // Category IDs
  shippingResponsibility: ShippingResponsibilitySchema,
  restockingFeePercent: z.number().min(0).max(100).default(0),
  requiresReceipt: z.boolean().default(false),
  allowExchanges: z.boolean().default(true),
  policyText: z.string().max(5000), // Rich text for storefront
});

export const UpdateReturnPolicyInputSchema = ReturnPolicySchema.partial().extend({
  storeId: z.string().optional(), // From context
});
```

#### Backend Policy Service (`apps/api/src/return/return-policy.service.ts`)
```typescript
@Injectable()
export class ReturnPolicyService {
  constructor(private prisma: PrismaService) {}

  // Protected for @trafi/core extensibility (RETRO-2)
  protected async getPolicy(storeId: string): Promise<ReturnPolicy> {
    const policy = await this.prisma.returnPolicy.findUnique({
      where: { storeId },
    });

    return policy ?? this.getDefaultPolicy();
  }

  protected async updatePolicy(
    storeId: string,
    input: UpdateReturnPolicyInput,
  ): Promise<ReturnPolicy> {
    return this.prisma.returnPolicy.upsert({
      where: { storeId },
      create: { storeId, ...input },
      update: input,
    });
  }

  protected async validateReturnEligibility(
    orderId: string,
    itemIds: string[],
  ): Promise<ReturnEligibility> {
    const order = await this.prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: {
        items: { include: { product: { include: { category: true } } } },
        store: { include: { returnPolicy: true } },
      },
    });

    const policy = order.store.returnPolicy ?? this.getDefaultPolicy();

    // Check return window
    const daysSinceDelivery = differenceInDays(new Date(), order.deliveredAt!);
    if (daysSinceDelivery > policy.returnWindowDays) {
      return { eligible: false, reason: 'Return window has expired' };
    }

    // Check excluded categories
    const excludedItems = order.items.filter(
      (item) => policy.excludedCategories.includes(item.product.categoryId),
    );
    if (excludedItems.length > 0) {
      return {
        eligible: false,
        reason: 'Some items are from non-returnable categories',
        excludedItemIds: excludedItems.map((i) => i.id),
      };
    }

    return { eligible: true };
  }

  private getDefaultPolicy(): ReturnPolicy {
    return {
      returnWindowDays: 30,
      isEnabled: true,
      excludedCategories: [],
      shippingResponsibility: 'customer',
      restockingFeePercent: 0,
      requiresReceipt: false,
      allowExchanges: true,
      policyText: 'You may return items within 30 days of delivery.',
    };
  }
}
```

#### Server Action (`apps/dashboard/src/app/(dashboard)/settings/returns/_actions/update-return-policy.ts`)
```typescript
'use server';

import { createServerAction } from 'zsa';
import { UpdateReturnPolicyInputSchema } from '@trafi/validators';
import { trpc } from '@/lib/trpc/server';

export const getReturnPolicyAction = createServerAction()
  .handler(async () => {
    return trpc.returnPolicy.get();
  });

export const updateReturnPolicyAction = createServerAction()
  .input(UpdateReturnPolicyInputSchema)
  .handler(async ({ input }) => {
    return trpc.returnPolicy.update(input);
  });
```

#### Return Policy Form (`apps/dashboard/src/app/(dashboard)/settings/returns/_components/return-policy-form.tsx`)
```typescript
'use client';

import { useServerAction, useServerActionQuery } from 'zsa-react';
import { getReturnPolicyAction, updateReturnPolicyAction } from '../_actions/update-return-policy';

export function ReturnPolicyForm() {
  const { data: policy, isLoading } = useServerActionQuery(
    getReturnPolicyAction,
    { queryKey: ['return-policy'] },
  );

  const { execute, isPending } = useServerAction(updateReturnPolicyAction);

  const form = useForm<ReturnPolicy>({
    resolver: zodResolver(ReturnPolicySchema),
    defaultValues: policy,
  });

  const onSubmit = async (values: ReturnPolicy) => {
    const [result, error] = await execute(values);
    if (error) {
      toast.error('Failed to update policy');
      return;
    }
    toast.success('Return policy updated');
  };

  if (isLoading) return <Skeleton className="h-96" />;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Enable Returns */}
        <FormField
          control={form.control}
          name="isEnabled"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between">
              <div>
                <FormLabel>Enable Returns</FormLabel>
                <FormDescription>Allow customers to request returns</FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Return Window */}
        <FormField
          control={form.control}
          name="returnWindowDays"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Return Window (days)</FormLabel>
              <FormControl>
                <Input type="number" {...field} min={0} max={365} />
              </FormControl>
              <FormDescription>
                Days after delivery that returns are accepted
              </FormDescription>
            </FormItem>
          )}
        />

        {/* Shipping Responsibility */}
        <FormField
          control={form.control}
          name="shippingResponsibility"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Return Shipping Paid By</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="merchant">Merchant (You)</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        {/* Restocking Fee */}
        <FormField
          control={form.control}
          name="restockingFeePercent"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Restocking Fee (%)</FormLabel>
              <FormControl>
                <Input type="number" {...field} min={0} max={100} />
              </FormControl>
              <FormDescription>
                Percentage deducted from refund (0 for no fee)
              </FormDescription>
            </FormItem>
          )}
        />

        {/* Category Exclusions */}
        <FormField
          control={form.control}
          name="excludedCategories"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Excluded Categories</FormLabel>
              <CategoryExclusions
                selected={field.value}
                onChange={field.onChange}
              />
              <FormDescription>
                Products in these categories cannot be returned
              </FormDescription>
            </FormItem>
          )}
        />

        {/* Policy Text */}
        <FormField
          control={form.control}
          name="policyText"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Policy Text (shown at checkout)</FormLabel>
              <FormControl>
                <Textarea {...field} rows={6} />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Policy'}
        </Button>
      </form>
    </Form>
  );
}
```

#### UX Implementation Notes
- **Return Window**: Slider or input for days (0 = no returns)
- **Category Exclusions**: Multi-select dropdown for categories
- **Policy Preview**: Live preview of policy text as displayed to customers
- **Restocking Fee**: Percentage input with explanation
- **Dark Mode**: Form uses #1A1A1A card backgrounds (UX-COLOR)
- **Breadcrumb**: Dashboard > Settings > Returns (UX-3)
