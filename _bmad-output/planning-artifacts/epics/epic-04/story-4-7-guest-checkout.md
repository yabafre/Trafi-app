## Story 4.7: Checkout Flow - Guest Checkout

As a **Buyer (Emma)**,
I want **to complete checkout without creating an account**,
So that **I can buy quickly without friction**.

**Acceptance Criteria:**

**Given** a buyer proceeds to checkout
**When** checkout loads
**Then** guest checkout is the default option (UX-10)
**And** the form requires only:
- Email address (for receipt)
- Shipping address
- Shipping method selection
- Payment information
**And** express checkout (Apple Pay/Google Pay) is above fold (UX-11)
**And** optional "create account" checkbox is available
**And** checkout can complete in < 90 seconds

### Technical Implementation

#### File Structure
```
apps/storefront/src/app/checkout/
├── page.tsx                           # Checkout page (RSC wrapper)
├── layout.tsx                         # Minimal layout (no header nav)
├── _components/
│   ├── checkout-form.tsx              # Main checkout form orchestrator
│   ├── express-checkout.tsx           # Apple Pay / Google Pay buttons
│   ├── email-step.tsx                 # Email + account option
│   ├── shipping-step.tsx              # Address + shipping method
│   ├── payment-step.tsx               # Payment details
│   ├── order-summary.tsx              # Cart summary sidebar
│   ├── checkout-steps-indicator.tsx   # Progress indicator
│   └── create-account-checkbox.tsx    # Optional account creation
├── _hooks/
│   ├── use-checkout.ts                # Checkout state management
│   └── use-express-checkout.ts        # Apple Pay / Google Pay hooks
└── _actions/
    ├── create-checkout-session.ts
    ├── update-checkout.ts
    └── complete-checkout.ts
```

#### Zod Schemas (`@trafi/validators`)
```typescript
// packages/validators/src/checkout.ts
export const CheckoutSessionIdSchema = z.string().startsWith('checkout_');

export const CheckoutEmailSchema = z.object({
  email: z.string().email(),
  createAccount: z.boolean().default(false),
  password: z.string().min(8).optional(), // Required if createAccount
});

export const CheckoutShippingAddressSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  address1: z.string().min(1).max(200),
  address2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  stateCode: z.string().optional(),
  postalCode: z.string().min(1).max(20),
  countryCode: z.string().length(2),
  phone: z.string().optional(),
});

export const CreateCheckoutSessionSchema = z.object({
  cartId: CartIdSchema,
});

export const UpdateCheckoutSchema = z.object({
  sessionId: CheckoutSessionIdSchema,
  email: CheckoutEmailSchema.optional(),
  shippingAddress: CheckoutShippingAddressSchema.optional(),
  shippingRateId: ShippingRateIdSchema.optional(),
  billingAddress: CheckoutShippingAddressSchema.optional(),
  sameAsShipping: z.boolean().optional(),
});

export const CheckoutSessionSchema = z.object({
  id: CheckoutSessionIdSchema,
  cartId: CartIdSchema,
  email: z.string().email().nullable(),
  shippingAddress: CheckoutShippingAddressSchema.nullable(),
  shippingRateId: ShippingRateIdSchema.nullable(),
  billingAddress: CheckoutShippingAddressSchema.nullable(),
  step: z.enum(['email', 'shipping', 'payment', 'complete']),
  stripeClientSecret: z.string().nullable(),
  expiresAt: z.date(),
});
```

#### Backend Service (`apps/api/src/checkout/checkout.service.ts`)
```typescript
@Injectable()
export class CheckoutService {
  constructor(
    private prisma: PrismaService,
    private cartService: CartService,
    private shippingService: ShippingService,
    private taxService: TaxService,
    private stripeService: StripeService,
  ) {}

  // Protected for @trafi/core extensibility (RETRO-2)
  protected async createSession(cartId: string): Promise<CheckoutSession> {
    const cart = await this.cartService.getCartWithItems(cartId);

    if (!cart.items.length) {
      throw new BadRequestException('Cart is empty');
    }

    // Create checkout session with 30 minute expiration
    const session = await this.prisma.checkoutSession.create({
      data: {
        id: generateId('checkout'),
        cartId,
        step: 'email',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    });

    return session;
  }

  protected async updateSession(
    sessionId: string,
    input: UpdateCheckoutInput,
  ): Promise<CheckoutSession> {
    const session = await this.getSession(sessionId);

    // Validate session not expired
    if (session.expiresAt < new Date()) {
      throw new BadRequestException('Checkout session expired');
    }

    // Update session with new data
    const updated = await this.prisma.checkoutSession.update({
      where: { id: sessionId },
      data: {
        email: input.email?.email,
        shippingAddress: input.shippingAddress,
        shippingRateId: input.shippingRateId,
        billingAddress: input.sameAsShipping
          ? input.shippingAddress
          : input.billingAddress,
        step: this.calculateNextStep(session, input),
      },
    });

    // If shipping address changed, recalculate shipping and tax
    if (input.shippingAddress) {
      await this.recalculateTotals(updated);
    }

    return updated;
  }

  protected async preparePayment(sessionId: string): Promise<string> {
    const session = await this.getSession(sessionId);

    // Calculate final totals
    const cart = await this.cartService.getCartWithItems(session.cartId);
    const shipping = await this.shippingService.getRateById(session.shippingRateId!);
    const tax = await this.taxService.calculateTax({
      cartId: session.cartId,
      shippingAddress: session.shippingAddress!,
      shippingPrice: shipping.price,
    });

    const total = cart.summary.subtotal + shipping.price + tax.totalTax;

    // Create Stripe PaymentIntent
    const paymentIntent = await this.stripeService.createPaymentIntent({
      amount: total,
      currency: 'eur', // From store settings
      metadata: {
        checkoutSessionId: sessionId,
        cartId: session.cartId,
      },
    });

    // Store client secret on session
    await this.prisma.checkoutSession.update({
      where: { id: sessionId },
      data: {
        stripePaymentIntentId: paymentIntent.id,
        stripeClientSecret: paymentIntent.client_secret,
        step: 'payment',
      },
    });

    return paymentIntent.client_secret!;
  }

  protected calculateNextStep(
    session: CheckoutSession,
    input: UpdateCheckoutInput,
  ): CheckoutStep {
    if (input.email && !session.shippingAddress) return 'shipping';
    if (input.shippingAddress && input.shippingRateId) return 'payment';
    return session.step;
  }
}
```

#### tRPC Router (`apps/api/src/trpc/routers/checkout.router.ts`)
```typescript
export const checkoutRouter = router({
  createSession: publicProcedure
    .input(CreateCheckoutSessionSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.checkoutService.createSession(input.cartId);
    }),

  getSession: publicProcedure
    .input(z.object({ sessionId: CheckoutSessionIdSchema }))
    .query(async ({ ctx, input }) => {
      return ctx.checkoutService.getSession(input.sessionId);
    }),

  update: publicProcedure
    .input(UpdateCheckoutSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.checkoutService.updateSession(input.sessionId, input);
    }),

  preparePayment: publicProcedure
    .input(z.object({ sessionId: CheckoutSessionIdSchema }))
    .mutation(async ({ ctx, input }) => {
      return ctx.checkoutService.preparePayment(input.sessionId);
    }),
});
```

#### Storefront Data Flow
```
┌────────────────────────────────────────────────────────────────────────┐
│ Checkout Page (RSC) - Creates session, passes to client               │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ ExpressCheckout (Client - Above Fold)                   UX-STORE-5 │ │
│ │   ├─ Apple Pay button (PaymentRequestButton)                       │ │
│ │   ├─ Google Pay button                                             │ │
│ │   └─ "Or continue below"                                           │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ CheckoutForm (Client Component)                                    │ │
│ │   ├─ useCheckout() hook - manages multi-step state                 │ │
│ │   │                                                                │ │
│ │   ├─ Step 1: EmailStep                                             │ │
│ │   │   ├─ Email input                                               │ │
│ │   │   ├─ "Create account" checkbox (optional)                      │ │
│ │   │   └─ Continue → checkout.update({ email })                     │ │
│ │   │                                                                │ │
│ │   ├─ Step 2: ShippingStep                                          │ │
│ │   │   ├─ AddressForm with autocomplete                             │ │
│ │   │   ├─ ShippingMethodSelector (from Story 4.5)                   │ │
│ │   │   └─ Continue → checkout.update({ shippingAddress, rateId })   │ │
│ │   │                                                                │ │
│ │   └─ Step 3: PaymentStep                                           │ │
│ │       ├─ Stripe Elements (Card input)                              │ │
│ │       ├─ Billing address (same as shipping checkbox)               │ │
│ │       └─ Pay Now → stripe.confirmPayment()                         │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ OrderSummary (Client - Sidebar)                                    │ │
│ │   ├─ Cart items preview                                            │ │
│ │   ├─ Subtotal, Shipping, Tax, Total                                │ │
│ │   └─ Updates as checkout progresses                                │ │
│ └────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

#### Checkout Hook (`apps/storefront/src/app/checkout/_hooks/use-checkout.ts`)
```typescript
'use client';

export function useCheckout(initialSession: CheckoutSession) {
  const [session, setSession] = useState(initialSession);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateCheckout = trpc.checkout.update.useMutation({
    onSuccess: (updated) => setSession(updated),
  });

  const preparePayment = trpc.checkout.preparePayment.useMutation();

  const submitEmail = async (data: EmailFormData) => {
    setIsSubmitting(true);
    await updateCheckout.mutateAsync({
      sessionId: session.id,
      email: data,
    });
    setIsSubmitting(false);
  };

  const submitShipping = async (data: ShippingFormData) => {
    setIsSubmitting(true);
    await updateCheckout.mutateAsync({
      sessionId: session.id,
      shippingAddress: data.address,
      shippingRateId: data.shippingRateId,
    });
    // Prepare payment after shipping
    const clientSecret = await preparePayment.mutateAsync({
      sessionId: session.id,
    });
    setSession((s) => ({ ...s, stripeClientSecret: clientSecret }));
    setIsSubmitting(false);
  };

  return {
    session,
    step: session.step,
    isSubmitting,
    submitEmail,
    submitShipping,
  };
}
```

#### Express Checkout (`apps/storefront/src/app/checkout/_components/express-checkout.tsx`)
```typescript
'use client';

export function ExpressCheckout({ sessionId, cart }: ExpressCheckoutProps) {
  const stripe = useStripe();
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);

  useEffect(() => {
    if (!stripe) return;

    const pr = stripe.paymentRequest({
      country: 'FR',
      currency: 'eur',
      total: {
        label: 'Total',
        amount: cart.summary.total,
      },
      requestPayerEmail: true,
      requestShipping: true,
    });

    pr.canMakePayment().then((result) => {
      if (result) setPaymentRequest(pr);
    });
  }, [stripe, cart.summary.total]);

  if (!paymentRequest) return null;

  return (
    <div className="space-y-4 pb-6 border-b">
      <PaymentRequestButtonElement
        options={{ paymentRequest }}
        className="w-full"
      />
      <div className="text-center text-sm text-muted-foreground">
        Or continue below
      </div>
    </div>
  );
}
```

#### UX Implementation Notes
- **Express Checkout**: Apple Pay/Google Pay above fold (UX-STORE-5), detect availability first
- **Guest Default**: No login required, email-only first step (UX-10)
- **Progress Indicator**: Show steps: Contact → Shipping → Payment
- **Address Autocomplete**: Use Google Places API for address suggestions
- **90 Second Target**: Minimize form fields, auto-advance on completion (UX-11)
- **Mobile Optimized**: Single column layout, large touch targets (48x48px)
- **Error Handling**: Inline validation, clear error messages, retry options
- **Session Expiry**: Show warning at 25 minutes, auto-redirect at 30

---

