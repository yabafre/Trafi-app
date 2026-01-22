## Story 4.9: Order Creation and Confirmation

As a **System**,
I want **to create an order from a completed checkout**,
So that **the purchase is recorded and fulfillment can begin**.

**Acceptance Criteria:**

**Given** payment is successfully processed
**When** the order is created
**Then** the system:
- Creates order record with all line items
- Reserves/decrements inventory
- Associates with customer (guest or registered)
- Generates order number with `ord_` prefix
- Sends confirmation email with order details
**And** buyer sees confirmation page with order summary
**And** order status is set to "confirmed"

### Technical Implementation

#### File Structure
```
apps/storefront/src/app/checkout/
├── confirmation/
│   ├── page.tsx                       # Order confirmation page
│   └── _components/
│       ├── order-summary.tsx          # Order details display
│       ├── next-steps.tsx             # What to expect next
│       └── create-account-prompt.tsx  # For guest checkouts

apps/api/src/
├── order/
│   ├── order.module.ts
│   ├── order.service.ts               # Order creation & management
│   ├── order-number.service.ts        # Order number generation
│   ├── dto/
│   │   ├── create-order.dto.ts
│   │   └── order-confirmation.dto.ts
│   └── entities/
│       ├── order.entity.ts
│       └── order-line-item.entity.ts
├── webhooks/
│   └── stripe-webhook.controller.ts   # Handle payment confirmation
```

#### Zod Schemas (`@trafi/validators`)
```typescript
// packages/validators/src/order.ts
export const OrderIdSchema = z.string().startsWith('ord_');
export const OrderLineItemIdSchema = z.string().startsWith('oli_');

export const OrderStatusSchema = z.enum([
  'pending',           // Payment not yet confirmed
  'confirmed',         // Payment confirmed, ready for fulfillment
  'processing',        // Being prepared
  'shipped',           // In transit
  'delivered',         // Delivered to customer
  'cancelled',         // Cancelled
  'refunded',          // Fully refunded
]);

export const CreateOrderFromCheckoutSchema = z.object({
  checkoutSessionId: CheckoutSessionIdSchema,
  stripePaymentIntentId: z.string(),
});

export const OrderLineItemSchema = z.object({
  id: OrderLineItemIdSchema,
  productId: z.string().startsWith('prod_'),
  variantId: z.string().startsWith('var_'),
  title: z.string(),
  variantTitle: z.string().optional(),
  sku: z.string().optional(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().int(),          // Cents (ARCH-25)
  totalPrice: z.number().int(),         // Cents
  taxAmount: z.number().int(),          // Cents
});

export const OrderSchema = z.object({
  id: OrderIdSchema,
  orderNumber: z.string(),              // Human-readable (e.g., "TRF-1001")
  status: OrderStatusSchema,
  email: z.string().email(),
  customerId: z.string().startsWith('cust_').nullable(),
  shippingAddress: CheckoutShippingAddressSchema,
  billingAddress: CheckoutShippingAddressSchema,
  lineItems: z.array(OrderLineItemSchema),
  subtotal: z.number().int(),           // Cents
  shippingPrice: z.number().int(),      // Cents
  shippingMethod: z.string(),
  taxTotal: z.number().int(),           // Cents
  total: z.number().int(),              // Cents
  currency: z.string().length(3),
  stripePaymentIntentId: z.string(),
  createdAt: z.date(),
});

export const OrderConfirmationSchema = z.object({
  order: OrderSchema,
  estimatedDelivery: z.object({
    min: z.date(),
    max: z.date(),
  }),
  trackingAvailable: z.boolean(),
});
```

#### Backend Service (`apps/api/src/order/order.service.ts`)
```typescript
@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    private orderNumberService: OrderNumberService,
    private inventoryService: InventoryService,
    private emailService: EmailService,
    private eventEmitter: EventEmitter2,
  ) {}

  // Protected for @trafi/core extensibility (RETRO-2)
  protected async createFromCheckout(
    checkoutSessionId: string,
    stripePaymentIntentId: string,
  ): Promise<Order> {
    return this.prisma.$transaction(async (tx) => {
      // 1. Get checkout session with cart
      const checkout = await tx.checkoutSession.findUnique({
        where: { id: checkoutSessionId },
        include: {
          cart: {
            include: {
              items: {
                include: {
                  variant: {
                    include: { product: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!checkout) {
        throw new NotFoundException('Checkout session not found');
      }

      // 2. Generate order number
      const orderNumber = await this.orderNumberService.generate();

      // 3. Calculate final totals
      const lineItems = checkout.cart.items.map((item) => ({
        id: generateId('oli'),
        productId: item.variant.productId,
        variantId: item.variantId,
        title: item.variant.product.title,
        variantTitle: item.variant.title,
        sku: item.variant.sku,
        quantity: item.quantity,
        unitPrice: item.priceAtAddition,
        totalPrice: item.priceAtAddition * item.quantity,
        taxAmount: 0, // Calculated below
      }));

      const subtotal = lineItems.reduce((sum, li) => sum + li.totalPrice, 0);
      const shippingRate = await this.getShippingRate(checkout.shippingRateId);
      const tax = await this.calculateTax(checkout, subtotal, shippingRate.price);

      // 4. Create order
      const order = await tx.order.create({
        data: {
          id: generateId('ord'),
          orderNumber,
          status: 'confirmed',
          email: checkout.email!,
          customerId: checkout.cart.customerId,
          shippingAddress: checkout.shippingAddress,
          billingAddress: checkout.billingAddress ?? checkout.shippingAddress,
          subtotal,
          shippingPrice: shippingRate.price,
          shippingMethod: shippingRate.name,
          taxTotal: tax.totalTax,
          total: subtotal + shippingRate.price + tax.totalTax,
          currency: 'EUR', // From store settings
          stripePaymentIntentId,
          lineItems: {
            create: lineItems.map((li) => ({
              ...li,
              taxAmount: tax.lineItems.find(
                (t) => t.variantId === li.variantId,
              )?.taxAmount ?? 0,
            })),
          },
        },
        include: { lineItems: true },
      });

      // 5. Decrement inventory
      for (const item of checkout.cart.items) {
        await this.inventoryService.decrement(
          tx,
          item.variantId,
          item.quantity,
          `Order ${orderNumber}`,
        );
      }

      // 6. Create customer if opted in
      if (checkout.createAccount && checkout.password) {
        await this.createCustomerAccount(tx, checkout);
      }

      // 7. Clear the cart
      await tx.cart.delete({ where: { id: checkout.cartId } });

      // 8. Mark checkout as complete
      await tx.checkoutSession.update({
        where: { id: checkoutSessionId },
        data: { step: 'complete', orderId: order.id },
      });

      // 9. Emit order created event (for email, analytics, etc.)
      this.eventEmitter.emit('order.created', { order });

      return order;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  }

  protected async sendConfirmationEmail(order: Order): Promise<void> {
    await this.emailService.send({
      to: order.email,
      template: 'order-confirmation',
      data: {
        orderNumber: order.orderNumber,
        lineItems: order.lineItems,
        subtotal: formatCents(order.subtotal),
        shipping: formatCents(order.shippingPrice),
        tax: formatCents(order.taxTotal),
        total: formatCents(order.total),
        shippingAddress: order.shippingAddress,
        estimatedDelivery: this.calculateEstimatedDelivery(order),
      },
    });
  }

  protected async getOrderConfirmation(
    orderId: string,
  ): Promise<OrderConfirmation> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { lineItems: true },
    });

    if (!order) throw new NotFoundException('Order not found');

    return {
      order,
      estimatedDelivery: this.calculateEstimatedDelivery(order),
      trackingAvailable: false, // Until shipping label created
    };
  }
}
```

#### Order Number Service (`apps/api/src/order/order-number.service.ts`)
```typescript
@Injectable()
export class OrderNumberService {
  constructor(private prisma: PrismaService) {}

  // Protected for @trafi/core extensibility (RETRO-2)
  protected async generate(): Promise<string> {
    // Format: TRF-XXXX where XXXX is sequential per store
    const counter = await this.prisma.orderCounter.upsert({
      where: { id: 'default' },
      update: { value: { increment: 1 } },
      create: { id: 'default', value: 1001 },
    });

    return `TRF-${counter.value}`;
  }
}
```

#### Stripe Webhook Controller (`apps/api/src/webhooks/stripe-webhook.controller.ts`)
```typescript
@Controller('webhooks')
export class StripeWebhookController {
  constructor(
    private orderService: OrderService,
    private stripeService: StripeService,
  ) {}

  @Post('stripe')
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const event = this.stripeService.verifyWebhook(req.rawBody, signature);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object);
        break;
    }

    return { received: true };
  }

  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    const { checkoutSessionId } = paymentIntent.metadata;

    // Create order from successful payment
    const order = await this.orderService.createFromCheckout(
      checkoutSessionId,
      paymentIntent.id,
    );

    // Send confirmation email
    await this.orderService.sendConfirmationEmail(order);
  }
}
```

#### tRPC Router (`apps/api/src/trpc/routers/order.router.ts`)
```typescript
export const orderRouter = router({
  getConfirmation: publicProcedure
    .input(z.object({ orderId: OrderIdSchema }))
    .query(async ({ ctx, input }) => {
      return ctx.orderService.getOrderConfirmation(input.orderId);
    }),

  getByCheckoutSession: publicProcedure
    .input(z.object({ checkoutSessionId: CheckoutSessionIdSchema }))
    .query(async ({ ctx, input }) => {
      return ctx.orderService.getByCheckoutSession(input.checkoutSessionId);
    }),
});
```

#### Storefront Data Flow
```
┌────────────────────────────────────────────────────────────────────────┐
│ Payment Step → Stripe confirmPayment()                                 │
│   │                                                                    │
│   ├─ SUCCESS: Redirect to /checkout/confirmation?session=...          │
│   │                                                                    │
│   ▼                                                                    │
│ Confirmation Page (RSC)                                                │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ Server: trpc.order.getByCheckoutSession                            │ │
│ │   └─ Waits for webhook to create order (polling if needed)         │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ OrderSummary (Server Component)                                    │ │
│ │   ├─ Success icon + "Thank you for your order!"                    │ │
│ │   ├─ Order number (TRF-1001)                                       │ │
│ │   ├─ Order items with images                                       │ │
│ │   ├─ Shipping address                                              │ │
│ │   ├─ Estimated delivery date                                       │ │
│ │   └─ Total breakdown                                               │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ NextSteps (Server Component)                                       │ │
│ │   ├─ "Confirmation email sent to {email}"                          │ │
│ │   ├─ "You'll receive tracking info when your order ships"          │ │
│ │   └─ Link to track order (if registered)                           │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ CreateAccountPrompt (Client - for guest orders)                    │ │
│ │   ├─ "Create an account to track your order"                       │ │
│ │   └─ Email pre-filled, just need password                          │ │
│ └────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

#### Confirmation Page (`apps/storefront/src/app/checkout/confirmation/page.tsx`)
```typescript
export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: { session?: string };
}) {
  if (!searchParams.session) {
    redirect('/');
  }

  // Get order from checkout session
  const confirmation = await trpc.order.getByCheckoutSession({
    checkoutSessionId: searchParams.session,
  });

  if (!confirmation) {
    // Order not yet created, show loading state
    return <OrderPendingState sessionId={searchParams.session} />;
  }

  return (
    <div className="container max-w-2xl py-12">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold">Thank you for your order!</h1>
        <p className="text-muted-foreground">
          Order #{confirmation.order.orderNumber}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {confirmation.order.lineItems.map((item) => (
            <div key={item.id} className="flex gap-4">
              <div className="w-16 h-16 bg-muted rounded" />
              <div className="flex-1">
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-muted-foreground">
                  {item.variantTitle} × {item.quantity}
                </p>
              </div>
              <p className="font-medium">{formatCents(item.totalPrice)}</p>
            </div>
          ))}

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCents(confirmation.order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping ({confirmation.order.shippingMethod})</span>
              <span>{formatCents(confirmation.order.shippingPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span>{formatCents(confirmation.order.taxTotal)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>{formatCents(confirmation.order.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <NextSteps
        email={confirmation.order.email}
        estimatedDelivery={confirmation.estimatedDelivery}
      />

      {!confirmation.order.customerId && (
        <CreateAccountPrompt email={confirmation.order.email} />
      )}
    </div>
  );
}
```

#### UX Implementation Notes
- **Success State**: Large green checkmark, clear "Thank you" message
- **Order Number**: Prominently displayed, easy to copy
- **Email Confirmation**: Sent immediately via webhook handler
- **Estimated Delivery**: Based on shipping method selected
- **Guest Account Prompt**: Optional, email pre-filled, single password field
- **Print-friendly**: Confirmation page styled for printing
- **Error Recovery**: If payment fails mid-checkout, show retry option
- **Loading State**: If webhook hasn't fired yet, poll every 2s for order creation

---

