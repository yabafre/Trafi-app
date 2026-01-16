# Epic 5: Payment Processing

Systeme gere les paiements Stripe complets avec 3DS, webhooks, remboursements, et audit trail.

**FRs covered:** FR46, FR47, FR48, FR49, FR50

---

## Epic Implementation Guidelines

### Retrospective Learnings (MANDATORY)
- **RETRO-1:** Use Context7 MCP before implementing Stripe SDK, webhook handling
- **RETRO-2:** PaymentService, RefundService use `protected` methods for extensibility
- **RETRO-3:** PaymentModule exports explicit public API (ProcessPayment, HandleWebhook)
- **RETRO-4:** Dashboard payment components accept customization props
- **RETRO-5:** Payment settings page uses composition pattern
- **RETRO-6:** Code with @trafi/core override patterns (custom payment flows possible)

### UX Design Requirements (Storefront - Payment Flow - Digital Brutalism v2)

**Brutalist Manifesto:**
- The interface is a machine. No decoration, only data and action.
- Radius-zero everywhere — everything is a rectangle.
- High contrast — pure black background, pure white text.

**Storefront Payment Visual Design:**
- **UX-STORE-1:** Express checkout buttons (Apple Pay/Google Pay) above fold
- **UX-STORE-2:** Stripe Elements styled with radius-0, black background
- **UX-STORE-3:** Loading states during payment processing (skeleton + spinner)
- **UX-STORE-4:** Error messages inline, Risk Red (#FF3366), clear guidance
- **UX-STORE-5:** Success confirmation with order number, Success Green (#00FF94)
- **UX-COLOR-1:** Primary Acid Lime #CCFF00 for payment button
- **UX-COLOR-2:** Background #000000, borders #333333, text #FFFFFF
- **UX-RADIUS:** 0px everywhere — `border-radius: 0px !important`

### Dashboard UX (Payment Settings & Refunds - Digital Brutalism v2)

**Brutalist Manifesto:**
- The interface is a machine. No decoration, only data and action.
- Radius-zero everywhere — everything is a rectangle.
- Visible grid — 1px borders expose structure.

**Visual Design:**
- **UX-1:** Dark mode default for all payment pages
- **UX-2:** Rail (64px) + Sidebar (240px) + Main content layout
- **UX-3:** Breadcrumb: Dashboard > Settings > Payments
- **UX-4:** Connection status badge: connected (#00FF94), disconnected (#FF3366)
- **UX-8:** Shadcn UI: Dialog for refund modal, Badge for status (all radius-0)
- **UX-COLOR-1:** Primary Acid Lime #CCFF00 for action buttons, focus states
- **UX-COLOR-2:** Background #000000, borders #333333, text #FFFFFF
- **UX-COLOR-3:** Success #00FF94, Risk #FF3366
- **UX-RADIUS:** 0px everywhere — `border-radius: 0px !important`
- **UX-SHADOW:** None — elements sit firmly in the grid
- **UX-TYPE:** JetBrains Mono for amounts/numbers, system font for labels

---

## Story 5.1: Stripe Account Connection

As a **Merchant**,
I want **to connect my Stripe account to the store**,
So that **I can accept payments from customers**.

**Acceptance Criteria:**

**Given** a Merchant is in Payment Settings
**When** they initiate Stripe connection
**Then** they are redirected to Stripe OAuth flow
**And** upon authorization, Stripe credentials are securely stored
**And** credentials are encrypted at rest (NFR-SEC-1)
**And** connection status is visible in dashboard
**And** test mode vs live mode is clearly indicated

### Technical Implementation

#### File Structure
```
apps/dashboard/src/app/(dashboard)/settings/payments/
├── page.tsx                           # Payment settings page (RSC)
├── _components/
│   ├── stripe-connection-card.tsx     # Connection status + connect button
│   ├── stripe-mode-toggle.tsx         # Test/Live mode switch
│   └── payment-methods-list.tsx       # Enabled payment methods
├── _hooks/
│   └── use-stripe-connection.ts
└── _actions/
    ├── initiate-stripe-connect.ts
    └── disconnect-stripe.ts

apps/api/src/
├── payment/
│   ├── payment.module.ts
│   ├── stripe/
│   │   ├── stripe.service.ts          # Core Stripe operations
│   │   ├── stripe-connect.service.ts  # OAuth connection flow
│   │   └── stripe-webhook.service.ts  # Webhook handling
│   └── encryption/
│       └── credential-encryption.service.ts
```

#### Zod Schemas (`@trafi/validators`)
```typescript
// packages/validators/src/payment.ts
export const StripeConnectionStatusSchema = z.enum([
  'not_connected',
  'pending',
  'connected',
  'error',
]);

export const StripeModeSchema = z.enum(['test', 'live']);

export const StripeConnectionSchema = z.object({
  status: StripeConnectionStatusSchema,
  mode: StripeModeSchema,
  stripeAccountId: z.string().nullable(),
  connectedAt: z.date().nullable(),
  accountName: z.string().nullable(),
  chargesEnabled: z.boolean(),
  payoutsEnabled: z.boolean(),
});

export const InitiateStripeConnectSchema = z.object({
  mode: StripeModeSchema,
  returnUrl: z.string().url(),
});

export const StripeConnectCallbackSchema = z.object({
  code: z.string(),
  state: z.string(),
});
```

#### Backend Service (`apps/api/src/payment/stripe/stripe-connect.service.ts`)
```typescript
@Injectable()
export class StripeConnectService {
  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
    private encryptionService: CredentialEncryptionService,
    private configService: ConfigService,
  ) {}

  // Protected for @trafi/core extensibility (RETRO-2)
  protected async initiateConnection(
    storeId: string,
    mode: StripeMode,
    returnUrl: string,
  ): Promise<string> {
    // Generate state token for CSRF protection
    const state = crypto.randomUUID();
    await this.prisma.stripeConnectState.create({
      data: {
        state,
        storeId,
        mode,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
      },
    });

    // Build Stripe Connect OAuth URL
    const clientId = mode === 'live'
      ? this.configService.get('STRIPE_LIVE_CLIENT_ID')
      : this.configService.get('STRIPE_TEST_CLIENT_ID');

    const authUrl = new URL('https://connect.stripe.com/oauth/authorize');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('scope', 'read_write');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('redirect_uri', `${returnUrl}/api/stripe/callback`);

    return authUrl.toString();
  }

  protected async handleCallback(
    code: string,
    state: string,
  ): Promise<StripeConnection> {
    // Verify state token
    const stateRecord = await this.prisma.stripeConnectState.findUnique({
      where: { state },
    });

    if (!stateRecord || stateRecord.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired state token');
    }

    // Exchange code for access token
    const stripe = this.stripeService.getClient(stateRecord.mode);
    const response = await stripe.oauth.token({
      grant_type: 'authorization_code',
      code,
    });

    // Encrypt credentials before storage (NFR-SEC-1)
    const encryptedAccessToken = await this.encryptionService.encrypt(
      response.access_token,
    );
    const encryptedRefreshToken = await this.encryptionService.encrypt(
      response.refresh_token,
    );

    // Get account details
    const account = await stripe.accounts.retrieve(response.stripe_user_id);

    // Store connection
    const connection = await this.prisma.stripeConnection.upsert({
      where: { storeId_mode: { storeId: stateRecord.storeId, mode: stateRecord.mode } },
      create: {
        storeId: stateRecord.storeId,
        mode: stateRecord.mode,
        stripeAccountId: response.stripe_user_id,
        encryptedAccessToken,
        encryptedRefreshToken,
        accountName: account.business_profile?.name ?? account.email,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        status: 'connected',
      },
      update: {
        encryptedAccessToken,
        encryptedRefreshToken,
        accountName: account.business_profile?.name ?? account.email,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        status: 'connected',
        connectedAt: new Date(),
      },
    });

    // Clean up state token
    await this.prisma.stripeConnectState.delete({ where: { state } });

    return this.mapToResponse(connection);
  }

  protected async getConnectionStatus(
    storeId: string,
    mode: StripeMode,
  ): Promise<StripeConnection> {
    const connection = await this.prisma.stripeConnection.findUnique({
      where: { storeId_mode: { storeId, mode } },
    });

    if (!connection) {
      return {
        status: 'not_connected',
        mode,
        stripeAccountId: null,
        connectedAt: null,
        accountName: null,
        chargesEnabled: false,
        payoutsEnabled: false,
      };
    }

    return this.mapToResponse(connection);
  }

  protected async disconnect(storeId: string, mode: StripeMode): Promise<void> {
    await this.prisma.stripeConnection.delete({
      where: { storeId_mode: { storeId, mode } },
    });
  }
}
```

#### Encryption Service (`apps/api/src/payment/encryption/credential-encryption.service.ts`)
```typescript
@Injectable()
export class CredentialEncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor(private configService: ConfigService) {
    // Key derived from environment secret
    this.key = crypto.scryptSync(
      configService.get('ENCRYPTION_SECRET'),
      'salt',
      32,
    );
  }

  async encrypt(plaintext: string): Promise<string> {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Return iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  async decrypt(ciphertext: string): Promise<string> {
    const [ivHex, authTagHex, encrypted] = ciphertext.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
```

#### tRPC Router (`apps/api/src/trpc/routers/payment.router.ts`)
```typescript
export const paymentRouter = router({
  getConnectionStatus: protectedProcedure
    .input(z.object({ mode: StripeModeSchema }))
    .query(async ({ ctx, input }) => {
      return ctx.stripeConnectService.getConnectionStatus(ctx.storeId, input.mode);
    }),

  initiateConnect: protectedProcedure
    .input(InitiateStripeConnectSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.stripeConnectService.initiateConnection(
        ctx.storeId,
        input.mode,
        input.returnUrl,
      );
    }),

  disconnect: protectedProcedure
    .input(z.object({ mode: StripeModeSchema }))
    .mutation(async ({ ctx, input }) => {
      return ctx.stripeConnectService.disconnect(ctx.storeId, input.mode);
    }),
});
```

#### Dashboard Data Flow
```
┌─────────────────────────────────────────────────────────────────────┐
│ Settings > Payments Page (RSC)                                      │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ StripeModeToggle (Client Component)                             │ │
│ │   ├─ Switch between Test and Live mode                          │ │
│ │   └─ Warning dialog when switching to Live                      │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ StripeConnectionCard (Client Component)                         │ │
│ │   ├─ useStripeConnection(mode) hook                             │ │
│ │   │   └─ useServerActionQuery(getConnectionStatusAction)        │ │
│ │   │                                                             │ │
│ │   ├─ If connected:                                              │ │
│ │   │   ├─ Green badge "Connected"                                │ │
│ │   │   ├─ Account name display                                   │ │
│ │   │   ├─ Charges/Payouts enabled status                         │ │
│ │   │   └─ "Disconnect" button                                    │ │
│ │   │                                                             │ │
│ │   └─ If not connected:                                          │ │
│ │       ├─ Red badge "Not Connected"                              │ │
│ │       └─ "Connect with Stripe" button                           │ │
│ │           └─ onClick → initiateConnectAction → redirect         │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

#### Stripe Connection Card (`apps/dashboard/src/app/(dashboard)/settings/payments/_components/stripe-connection-card.tsx`)
```typescript
'use client';

export function StripeConnectionCard({ mode }: { mode: StripeMode }) {
  const { data: connection, isLoading } = useStripeConnection(mode);

  const initiateConnect = useServerActionMutation(initiateConnectAction);
  const disconnect = useServerActionMutation(disconnectAction);

  const handleConnect = async () => {
    const authUrl = await initiateConnect.mutateAsync({
      mode,
      returnUrl: window.location.origin,
    });
    window.location.href = authUrl;
  };

  if (isLoading) return <Skeleton className="h-48" />;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Stripe Connection</CardTitle>
          <Badge variant={connection?.status === 'connected' ? 'success' : 'destructive'}>
            {connection?.status === 'connected' ? 'Connected' : 'Not Connected'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {connection?.status === 'connected' ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Account</p>
              <p className="font-medium">{connection.accountName}</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                {connection.chargesEnabled ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm">Charges</span>
              </div>
              <div className="flex items-center gap-2">
                {connection.payoutsEnabled ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm">Payouts</span>
              </div>
            </div>
            <Button variant="destructive" onClick={() => disconnect.mutate({ mode })}>
              Disconnect
            </Button>
          </div>
        ) : (
          <Button onClick={handleConnect} disabled={initiateConnect.isPending}>
            <StripeIcon className="mr-2 h-4 w-4" />
            Connect with Stripe
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
```

#### UX Implementation Notes
- **Mode Toggle**: Test mode has yellow accent, Live mode has green accent
- **Connection Status**: Green badge for connected, red for disconnected (UX-4)
- **OAuth Flow**: Redirect to Stripe, return to `/settings/payments?connected=true`
- **Security**: Access tokens encrypted with AES-256-GCM before storage
- **Breadcrumb**: Dashboard > Settings > Payments (UX-3)
- **Dark Mode**: Card uses #1A1A1A background (UX-COLOR)

---

## Story 5.2: Stripe Elements Integration

As a **Buyer (Emma)**,
I want **to enter payment details securely**,
So that **my card information is protected**.

**Acceptance Criteria:**

**Given** a buyer is at the payment step
**When** the payment form loads
**Then** Stripe Elements is rendered for card input
**And** card data never touches our servers (PCI SAQ-A)
**And** real-time validation shows card errors
**And** supported card brands are displayed
**And** the form is accessible via keyboard (NFR-A11Y-3)

### Technical Implementation

#### File Structure
```
apps/storefront/src/
├── components/
│   └── checkout/
│       ├── payment-form.tsx              # Payment step wrapper
│       ├── stripe-card-element.tsx       # Card input component
│       └── payment-method-icons.tsx      # Visa, MC, Amex icons
├── lib/
│   └── stripe/
│       ├── stripe-provider.tsx           # Elements provider
│       ├── use-stripe-appearance.ts      # Theme configuration
│       └── stripe-client.ts              # loadStripe utility
```

#### Zod Schemas (`@trafi/validators`)
```typescript
// packages/validators/src/payment.ts
export const PaymentMethodTypeSchema = z.enum(['card', 'apple_pay', 'google_pay']);

export const CreatePaymentIntentInputSchema = z.object({
  checkoutSessionId: CheckoutSessionIdSchema,
  amount: z.number().int().positive(), // Cents
  currency: z.string().length(3),
});

export const ConfirmPaymentInputSchema = z.object({
  paymentIntentId: z.string(),
  paymentMethodId: z.string().optional(),
});
```

#### Stripe Provider (`apps/storefront/src/lib/stripe/stripe-provider.tsx`)
```typescript
'use client';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export function StripeProvider({ children, clientSecret }: StripeProviderProps) {
  const appearance = useStripeAppearance();

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance,
        loader: 'auto',
      }}
    >
      {children}
    </Elements>
  );
}
```

#### Stripe Appearance Hook (`apps/storefront/src/lib/stripe/use-stripe-appearance.ts`)
```typescript
'use client';

export function useStripeAppearance(): Appearance {
  // Match storefront theme (UX-STORE-2)
  return {
    theme: 'stripe',
    variables: {
      colorPrimary: '#F97316',        // Primary orange
      colorBackground: '#FFFFFF',
      colorText: '#1A1A1A',
      colorDanger: '#EF4444',
      fontFamily: 'General Sans, system-ui, sans-serif',
      borderRadius: '8px',
      spacingUnit: '4px',
    },
    rules: {
      '.Input': {
        border: '1px solid #E5E7EB',
        boxShadow: 'none',
        padding: '12px',
      },
      '.Input:focus': {
        border: '1px solid #F97316',
        boxShadow: '0 0 0 1px #F97316',
      },
      '.Input--invalid': {
        border: '1px solid #EF4444',
      },
      '.Label': {
        fontWeight: '500',
        marginBottom: '8px',
      },
      '.Error': {
        color: '#EF4444',
        fontSize: '14px',
      },
    },
  };
}
```

#### Payment Form (`apps/storefront/src/components/checkout/payment-form.tsx`)
```typescript
'use client';

export function PaymentForm({ clientSecret, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);
    setErrorMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/confirmation`,
      },
      redirect: 'if_required', // Handle 3DS inline if possible
    });

    if (error) {
      setErrorMessage(error.message ?? 'Payment failed');
      setIsProcessing(false);
      onError?.(error);
    } else if (paymentIntent?.status === 'succeeded') {
      onSuccess(paymentIntent);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label>Card Details</Label>
        <PaymentElement
          options={{
            layout: 'tabs',
            wallets: { applePay: 'auto', googlePay: 'auto' },
          }}
        />
      </div>

      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2 text-sm text-muted-foreground">
        <Lock className="h-4 w-4" />
        <span>Secured by Stripe. Card data never touches our servers.</span>
      </div>

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full h-12"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Pay Now'
        )}
      </Button>
    </form>
  );
}
```

#### UX Implementation Notes
- **PCI Compliance**: Stripe Elements handles all card data (SAQ-A compliant)
- **Styling**: Elements styled to match storefront theme via Appearance API
- **Validation**: Real-time card validation with clear error messages (UX-STORE-4)
- **Card Icons**: Show detected card brand (Visa, MC, Amex) as user types
- **Accessibility**: Full keyboard navigation, ARIA labels (NFR-A11Y-3)
- **Loading State**: Button shows spinner during processing (UX-ANIM)

---

## Story 5.3: Express Checkout (Apple Pay / Google Pay)

As a **Buyer (Emma)**,
I want **to pay with Apple Pay or Google Pay**,
So that **I can complete purchase in seconds**.

**Acceptance Criteria:**

**Given** a buyer is on a supported device/browser
**When** checkout loads
**Then** Apple Pay / Google Pay buttons appear above fold (UX-11)
**And** clicking triggers native payment sheet
**And** successful authorization creates the payment
**And** unsupported devices gracefully hide these options
**And** express checkout includes shipping address collection

### Technical Implementation

#### File Structure
```
apps/storefront/src/
├── app/checkout/
│   └── _components/
│       └── express-checkout.tsx        # Express checkout buttons
├── lib/stripe/
│   ├── use-payment-request.ts          # PaymentRequest hook
│   └── express-checkout-events.ts      # Event handlers
```

#### Storefront Component (`apps/storefront/src/app/checkout/_components/express-checkout.tsx`)
```typescript
'use client';

import { PaymentRequestButtonElement, useStripe } from '@stripe/react-stripe-js';
import { useState, useEffect } from 'react';

export function ExpressCheckout({
  total,
  currency,
  onShippingAddressChange,
  onPaymentComplete,
}: ExpressCheckoutProps) {
  const stripe = useStripe();
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [canMakePayment, setCanMakePayment] = useState(false);

  useEffect(() => {
    if (!stripe) return;

    const pr = stripe.paymentRequest({
      country: 'FR',
      currency: currency.toLowerCase(),
      total: {
        label: 'Total',
        amount: total, // Cents
      },
      requestPayerEmail: true,
      requestPayerName: true,
      requestShipping: true,
      shippingOptions: [], // Updated dynamically
    });

    // Check if Apple Pay / Google Pay is available
    pr.canMakePayment().then((result) => {
      if (result) {
        setPaymentRequest(pr);
        setCanMakePayment(true);
      }
    });

    // Handle shipping address changes
    pr.on('shippingaddresschange', async (event) => {
      const { shippingAddress } = event;
      const shippingOptions = await onShippingAddressChange(shippingAddress);

      if (shippingOptions.length) {
        event.updateWith({
          status: 'success',
          shippingOptions,
          total: {
            label: 'Total',
            amount: total + shippingOptions[0].amount,
          },
        });
      } else {
        event.updateWith({ status: 'invalid_shipping_address' });
      }
    });

    // Handle payment method
    pr.on('paymentmethod', async (event) => {
      try {
        await onPaymentComplete(event.paymentMethod, event.shippingAddress);
        event.complete('success');
      } catch (error) {
        event.complete('fail');
      }
    });
  }, [stripe, total, currency]);

  if (!canMakePayment || !paymentRequest) {
    return null; // Gracefully hide if not supported
  }

  return (
    <div className="space-y-4 pb-6 border-b">
      <PaymentRequestButtonElement
        options={{
          paymentRequest,
          style: {
            paymentRequestButton: {
              type: 'default',
              theme: 'dark',
              height: '48px',
            },
          },
        }}
      />
      <div className="text-center text-sm text-muted-foreground">
        Or continue with card below
      </div>
    </div>
  );
}
```

#### UX Implementation Notes
- **Above Fold**: Express checkout buttons rendered first (UX-STORE-1)
- **Availability Check**: Uses `canMakePayment()` to detect support
- **Native Sheet**: Triggers iOS/Android native payment sheet
- **Shipping Collection**: Collects address via native UI, validates with backend
- **Graceful Degradation**: Hidden on unsupported browsers/devices

---

## Story 5.4: Payment Processing with 3DS

As a **System**,
I want **to process payments with 3DS when required**,
So that **transactions are secure and compliant**.

**Acceptance Criteria:**

**Given** a buyer submits payment
**When** 3DS authentication is required
**Then** the buyer is redirected to 3DS challenge
**And** upon successful authentication, payment completes
**And** failed 3DS shows appropriate error message
**And** payment intent uses idempotency keys (NFR-INT-9)
**And** the entire flow handles redirects gracefully

### Technical Implementation

#### Backend Service (`apps/api/src/payment/stripe/payment.service.ts`)
```typescript
@Injectable()
export class PaymentService {
  constructor(
    private stripeService: StripeService,
    private encryptionService: CredentialEncryptionService,
  ) {}

  // Protected for @trafi/core extensibility (RETRO-2)
  protected async createPaymentIntent(
    checkoutSessionId: string,
    amount: number,
    currency: string,
    metadata: Record<string, string>,
  ): Promise<PaymentIntentResult> {
    const stripe = await this.stripeService.getClientForStore();

    // Generate idempotency key from checkout session (NFR-INT-9)
    const idempotencyKey = `pi_${checkoutSessionId}_${Date.now()}`;

    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount, // Cents
        currency,
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          checkoutSessionId,
          ...metadata,
        },
      },
      { idempotencyKey },
    );

    return {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
    };
  }

  protected async confirmPayment(
    paymentIntentId: string,
  ): Promise<PaymentConfirmationResult> {
    const stripe = await this.stripeService.getClientForStore();
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    return {
      status: paymentIntent.status,
      requiresAction: paymentIntent.status === 'requires_action',
      nextAction: paymentIntent.next_action,
    };
  }
}
```

#### Storefront 3DS Handling (`apps/storefront/src/app/checkout/_components/payment-form.tsx`)
```typescript
'use client';

export function PaymentForm({ clientSecret, checkoutSessionId }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);

    // confirmPayment handles 3DS automatically
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/confirmation?session=${checkoutSessionId}`,
      },
      redirect: 'if_required', // Only redirect if 3DS required
    });

    if (error) {
      // Handle 3DS failure or card error
      if (error.type === 'card_error' || error.type === 'validation_error') {
        setErrorMessage(error.message ?? 'Payment failed');
      } else if (error.code === 'payment_intent_authentication_failure') {
        setErrorMessage('Authentication failed. Please try another payment method.');
      } else {
        setErrorMessage('An unexpected error occurred.');
      }
      setIsProcessing(false);
      return;
    }

    // Payment succeeded without redirect (3DS frictionless)
    if (paymentIntent?.status === 'succeeded') {
      router.push(`/checkout/confirmation?session=${checkoutSessionId}`);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <Button type="submit" disabled={!stripe || isProcessing}>
        {isProcessing ? 'Processing...' : 'Pay Now'}
      </Button>
    </form>
  );
}
```

#### UX Implementation Notes
- **3DS Redirect**: Stripe handles redirect to bank's 3DS page automatically
- **Return URL**: After 3DS, user returns to `/checkout/confirmation`
- **Frictionless Flow**: When 3DS not required, payment completes inline
- **Error Messages**: Clear, user-friendly messages for authentication failures
- **Idempotency**: Prevents duplicate charges on retry (NFR-INT-9)

---

## Story 5.5: Payment Webhook Handler

As a **System**,
I want **to receive and process Stripe webhooks**,
So that **order status stays synchronized with payment status**.

**Acceptance Criteria:**

**Given** Stripe sends a webhook event
**When** the webhook endpoint receives it
**Then** signature is verified via HMAC-SHA256 (NFR-INT-6)
**And** events are processed idempotently by event_id (NFR-INT-8)
**And** handled events include:
- `payment_intent.succeeded` -> order confirmed
- `payment_intent.payment_failed` -> order marked failed
- `charge.refunded` -> order updated with refund
**And** unhandled events are logged but don't error

### Technical Implementation

#### File Structure
```
apps/api/src/
├── webhooks/
│   ├── webhooks.module.ts
│   ├── stripe-webhook.controller.ts
│   └── stripe-webhook.service.ts
├── payment/
│   └── stripe/
│       └── stripe-event-handlers.service.ts
```

#### Webhook Controller (`apps/api/src/webhooks/stripe-webhook.controller.ts`)
```typescript
@Controller('webhooks')
export class StripeWebhookController {
  constructor(private stripeWebhookService: StripeWebhookService) {}

  @Post('stripe')
  @HttpCode(200)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    // Signature verification (NFR-INT-6)
    const event = await this.stripeWebhookService.verifyAndParse(
      req.rawBody!,
      signature,
    );

    // Idempotent processing (NFR-INT-8)
    await this.stripeWebhookService.processEvent(event);

    return { received: true };
  }
}
```

#### Webhook Service (`apps/api/src/webhooks/stripe-webhook.service.ts`)
```typescript
@Injectable()
export class StripeWebhookService {
  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
    private eventHandlers: StripeEventHandlersService,
    private configService: ConfigService,
  ) {}

  // Protected for @trafi/core extensibility (RETRO-2)
  protected async verifyAndParse(
    rawBody: Buffer,
    signature: string,
  ): Promise<Stripe.Event> {
    const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');

    try {
      return this.stripeService.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch (err) {
      throw new BadRequestException('Invalid webhook signature');
    }
  }

  protected async processEvent(event: Stripe.Event): Promise<void> {
    // Check for duplicate processing (NFR-INT-8)
    const existingEvent = await this.prisma.processedWebhookEvent.findUnique({
      where: { eventId: event.id },
    });

    if (existingEvent) {
      this.logger.log(`Event ${event.id} already processed, skipping`);
      return;
    }

    // Process based on event type
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.eventHandlers.handlePaymentSucceeded(
            event.data.object as Stripe.PaymentIntent,
          );
          break;

        case 'payment_intent.payment_failed':
          await this.eventHandlers.handlePaymentFailed(
            event.data.object as Stripe.PaymentIntent,
          );
          break;

        case 'charge.refunded':
          await this.eventHandlers.handleChargeRefunded(
            event.data.object as Stripe.Charge,
          );
          break;

        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }

      // Mark event as processed
      await this.prisma.processedWebhookEvent.create({
        data: {
          eventId: event.id,
          type: event.type,
          processedAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Failed to process event ${event.id}`, error);
      throw error; // Stripe will retry
    }
  }
}
```

#### Event Handlers (`apps/api/src/payment/stripe/stripe-event-handlers.service.ts`)
```typescript
@Injectable()
export class StripeEventHandlersService {
  constructor(
    private orderService: OrderService,
    private emailService: EmailService,
    private auditService: PaymentAuditService,
  ) {}

  // Protected for @trafi/core extensibility (RETRO-2)
  protected async handlePaymentSucceeded(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    const { checkoutSessionId } = paymentIntent.metadata;

    // Create order from checkout
    const order = await this.orderService.createFromCheckout(
      checkoutSessionId,
      paymentIntent.id,
    );

    // Send confirmation email
    await this.emailService.sendOrderConfirmation(order);

    // Log audit event
    await this.auditService.log({
      type: 'payment_succeeded',
      orderId: order.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      stripePaymentIntentId: paymentIntent.id,
    });
  }

  protected async handlePaymentFailed(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    const { checkoutSessionId } = paymentIntent.metadata;

    // Update checkout session status
    await this.prisma.checkoutSession.update({
      where: { id: checkoutSessionId },
      data: {
        paymentStatus: 'failed',
        paymentError: paymentIntent.last_payment_error?.message,
      },
    });

    // Log audit event
    await this.auditService.log({
      type: 'payment_failed',
      checkoutSessionId,
      amount: paymentIntent.amount,
      error: paymentIntent.last_payment_error?.message,
      stripePaymentIntentId: paymentIntent.id,
    });
  }

  protected async handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
    const order = await this.prisma.order.findFirst({
      where: { stripePaymentIntentId: charge.payment_intent as string },
    });

    if (!order) return;

    // Update order with refund info
    await this.orderService.applyRefund(order.id, {
      amount: charge.amount_refunded,
      stripeRefundId: charge.refunds?.data[0]?.id,
    });

    // Log audit event
    await this.auditService.log({
      type: 'refund_processed',
      orderId: order.id,
      amount: charge.amount_refunded,
      stripeChargeId: charge.id,
    });
  }
}
```

#### UX Implementation Notes
- **Raw Body**: Must use raw body for signature verification (not parsed JSON)
- **Idempotency**: Store processed event IDs to prevent duplicate processing
- **Retry Logic**: Return 5xx to trigger Stripe retry, 2xx to acknowledge
- **Logging**: All events logged for debugging, unhandled events not errors

---

## Story 5.6: Payment Failure Handling

As a **Buyer (Emma)**,
I want **clear feedback when payment fails**,
So that **I can fix the issue and try again**.

**Acceptance Criteria:**

**Given** a payment attempt fails
**When** the error is returned
**Then** user-friendly error message is displayed
**And** specific guidance is given (e.g., "Card declined - try another card")
**And** the buyer can retry without re-entering all details
**And** failed attempts are logged for merchant visibility
**And** repeated failures trigger rate limiting

### Technical Implementation

#### File Structure
```
apps/storefront/src/
├── app/checkout/
│   └── _components/
│       ├── payment-error-display.tsx      # Error UI with guidance
│       └── retry-payment-form.tsx         # Retry without re-entry
├── lib/
│   └── stripe/
│       └── error-messages.ts              # Error code to message mapping

apps/api/src/
├── payment/
│   ├── rate-limiter/
│   │   └── payment-rate-limiter.service.ts
│   └── audit/
│       └── payment-failure-logger.service.ts
```

#### Zod Schemas (`@trafi/validators`)
```typescript
// packages/validators/src/payment.ts
export const PaymentErrorCodeSchema = z.enum([
  'card_declined',
  'insufficient_funds',
  'expired_card',
  'incorrect_cvc',
  'processing_error',
  'authentication_required',
  'rate_limited',
]);

export const PaymentErrorSchema = z.object({
  code: PaymentErrorCodeSchema,
  message: z.string(),
  guidance: z.string(),
  canRetry: z.boolean(),
  retryAfter: z.number().nullable(), // Seconds until retry allowed
});

export const PaymentFailureLogSchema = z.object({
  checkoutSessionId: CheckoutSessionIdSchema,
  errorCode: PaymentErrorCodeSchema,
  stripeErrorMessage: z.string().nullable(),
  cardLast4: z.string().length(4).nullable(),
  cardBrand: z.string().nullable(),
  attemptNumber: z.number().int().positive(),
});
```

#### Error Message Mapping (`apps/storefront/src/lib/stripe/error-messages.ts`)
```typescript
interface ErrorMapping {
  message: string;
  guidance: string;
  canRetry: boolean;
}

const ERROR_MAPPINGS: Record<string, ErrorMapping> = {
  card_declined: {
    message: 'Your card was declined',
    guidance: 'Please try a different card or contact your bank.',
    canRetry: true,
  },
  insufficient_funds: {
    message: 'Insufficient funds',
    guidance: 'Please use a different card or add funds to your account.',
    canRetry: true,
  },
  expired_card: {
    message: 'Your card has expired',
    guidance: 'Please use a card with a valid expiration date.',
    canRetry: true,
  },
  incorrect_cvc: {
    message: 'Incorrect security code',
    guidance: 'Please check the 3-digit code on the back of your card.',
    canRetry: true,
  },
  processing_error: {
    message: 'Payment processing error',
    guidance: 'Please wait a moment and try again.',
    canRetry: true,
  },
  authentication_required: {
    message: 'Additional authentication required',
    guidance: 'Please complete the verification with your bank.',
    canRetry: true,
  },
  rate_limited: {
    message: 'Too many payment attempts',
    guidance: 'Please wait before trying again.',
    canRetry: false,
  },
};

export function mapStripeError(stripeError: Stripe.Error): PaymentError {
  const declineCode = stripeError.decline_code ?? stripeError.code ?? 'processing_error';
  const mapping = ERROR_MAPPINGS[declineCode] ?? ERROR_MAPPINGS.processing_error;

  return {
    code: declineCode as PaymentErrorCode,
    message: mapping.message,
    guidance: mapping.guidance,
    canRetry: mapping.canRetry,
    retryAfter: null,
  };
}
```

#### Rate Limiter Service (`apps/api/src/payment/rate-limiter/payment-rate-limiter.service.ts`)
```typescript
@Injectable()
export class PaymentRateLimiterService {
  private readonly maxAttempts = 5;
  private readonly windowMinutes = 30;

  constructor(
    private redis: RedisService,
    private prisma: PrismaService,
  ) {}

  // Protected for @trafi/core extensibility (RETRO-2)
  protected async checkRateLimit(
    checkoutSessionId: string,
    customerIdentifier: string, // IP or customer ID
  ): Promise<RateLimitResult> {
    const key = `payment_attempts:${customerIdentifier}`;

    const attempts = await this.redis.incr(key);
    if (attempts === 1) {
      await this.redis.expire(key, this.windowMinutes * 60);
    }

    if (attempts > this.maxAttempts) {
      const ttl = await this.redis.ttl(key);
      return {
        allowed: false,
        retryAfter: ttl,
        attemptsRemaining: 0,
      };
    }

    return {
      allowed: true,
      retryAfter: null,
      attemptsRemaining: this.maxAttempts - attempts,
    };
  }

  protected async logFailedAttempt(data: PaymentFailureLog): Promise<void> {
    await this.prisma.paymentFailureLog.create({
      data: {
        checkoutSessionId: data.checkoutSessionId,
        errorCode: data.errorCode,
        stripeErrorMessage: data.stripeErrorMessage,
        cardLast4: data.cardLast4,
        cardBrand: data.cardBrand,
        attemptNumber: data.attemptNumber,
        createdAt: new Date(),
      },
    });
  }
}
```

#### Payment Error Display (`apps/storefront/src/app/checkout/_components/payment-error-display.tsx`)
```typescript
'use client';

export function PaymentErrorDisplay({
  error,
  onRetry,
  canRetry,
}: PaymentErrorDisplayProps) {
  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-5 w-5" />
      <div className="flex-1">
        <AlertTitle className="text-base font-semibold">
          {error.message}
        </AlertTitle>
        <AlertDescription className="mt-1 text-sm">
          {error.guidance}
        </AlertDescription>
      </div>
      {error.canRetry && canRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="ml-4 shrink-0"
        >
          Try Again
        </Button>
      )}
      {error.retryAfter && (
        <p className="text-sm text-muted-foreground mt-2">
          You can retry in {Math.ceil(error.retryAfter / 60)} minutes
        </p>
      )}
    </Alert>
  );
}
```

#### Retry Payment Form (`apps/storefront/src/app/checkout/_components/retry-payment-form.tsx`)
```typescript
'use client';

export function RetryPaymentForm({
  checkoutSessionId,
  clientSecret,
  previousError,
}: RetryPaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<PaymentError | null>(previousError);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRetry = async () => {
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError(null);

    // Elements retain the card data for retry
    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/confirmation?session=${checkoutSessionId}`,
      },
      redirect: 'if_required',
    });

    if (submitError) {
      setError(mapStripeError(submitError));
      setIsProcessing(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      window.location.href = `/checkout/confirmation?session=${checkoutSessionId}`;
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <PaymentErrorDisplay
          error={error}
          onRetry={handleRetry}
          canRetry={error.canRetry}
        />
      )}

      {/* Card element retains entered data */}
      <PaymentElement
        options={{
          layout: 'tabs',
          readOnly: isProcessing,
        }}
      />

      <Button
        onClick={handleRetry}
        disabled={!stripe || isProcessing || !error?.canRetry}
        className="w-full"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Try Again'
        )}
      </Button>
    </div>
  );
}
```

#### UX Implementation Notes
- **Error Messages**: User-friendly, not raw Stripe errors (UX-STORE-4)
- **Guidance**: Each error includes actionable next steps
- **Retry Without Re-entry**: Stripe Elements preserves card data
- **Rate Limiting**: 5 attempts per 30 minutes per customer/IP
- **Logging**: All failures logged for merchant support dashboard
- **Animation**: Error fade-in 150ms, button state change 200ms (UX-ANIM)

---

## Story 5.7: Refund Processing

As a **Merchant**,
I want **to issue full or partial refunds**,
So that **I can handle returns and disputes**.

**Acceptance Criteria:**

**Given** a Merchant views a paid order
**When** they initiate a refund
**Then** they can specify:
- Full refund or partial amount
- Reason for refund
- Whether to restock inventory
**And** refund is processed via Stripe API
**And** order status updates to reflect refund
**And** customer receives refund confirmation email
**And** refund amount cannot exceed original payment

### Technical Implementation

#### File Structure
```
apps/dashboard/src/app/(dashboard)/orders/[orderId]/
├── page.tsx                               # Order detail page (RSC)
├── _components/
│   ├── refund-dialog.tsx                  # Refund modal
│   ├── refund-amount-input.tsx            # Amount input with validation
│   ├── refund-reason-select.tsx           # Reason dropdown
│   └── refund-history.tsx                 # List of previous refunds
├── _hooks/
│   └── use-order-refunds.ts
└── _actions/
    ├── process-refund.ts                  # Server action
    └── get-refund-history.ts

apps/api/src/
├── payment/
│   └── refund/
│       └── refund.service.ts
├── order/
│   └── order.service.ts
```

#### Zod Schemas (`@trafi/validators`)
```typescript
// packages/validators/src/refund.ts
export const RefundIdSchema = z.string().startsWith('ref_');

export const RefundReasonSchema = z.enum([
  'customer_request',
  'duplicate_charge',
  'fraudulent',
  'product_not_received',
  'product_defective',
  'other',
]);

export const RefundTypeSchema = z.enum(['full', 'partial']);

export const CreateRefundInputSchema = z.object({
  orderId: OrderIdSchema,
  type: RefundTypeSchema,
  amount: z.number().int().positive().optional(), // Required for partial
  reason: RefundReasonSchema,
  notes: z.string().max(500).optional(),
  restockItems: z.boolean().default(false),
});

export const RefundSchema = z.object({
  id: RefundIdSchema,
  orderId: OrderIdSchema,
  amount: z.number().int().positive(), // Cents
  currency: z.string().length(3),
  reason: RefundReasonSchema,
  status: z.enum(['pending', 'succeeded', 'failed']),
  stripeRefundId: z.string(),
  createdAt: z.date(),
  createdBy: z.string(), // Admin user ID
});

export const RefundHistorySchema = z.array(RefundSchema);
```

#### Backend Refund Service (`apps/api/src/payment/refund/refund.service.ts`)
```typescript
@Injectable()
export class RefundService {
  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
    private emailService: EmailService,
    private inventoryService: InventoryService,
    private auditService: PaymentAuditService,
  ) {}

  // Protected for @trafi/core extensibility (RETRO-2)
  protected async processRefund(
    input: CreateRefundInput,
    adminUserId: string,
  ): Promise<Refund> {
    const order = await this.prisma.order.findUniqueOrThrow({
      where: { id: input.orderId },
      include: { payment: true, items: true },
    });

    // Validate refund amount
    const refundAmount = input.type === 'full'
      ? order.payment.amount
      : input.amount!;

    const totalRefunded = await this.getTotalRefunded(order.id);
    const maxRefundable = order.payment.amount - totalRefunded;

    if (refundAmount > maxRefundable) {
      throw new BadRequestException(
        `Refund amount (${refundAmount}) exceeds maximum refundable (${maxRefundable})`,
      );
    }

    // Create Stripe refund
    const stripe = await this.stripeService.getClientForStore();
    const stripeRefund = await stripe.refunds.create({
      payment_intent: order.payment.stripePaymentIntentId,
      amount: refundAmount,
      reason: this.mapRefundReason(input.reason),
      metadata: {
        orderId: order.id,
        adminUserId,
        reason: input.reason,
      },
    });

    // Create refund record
    const refund = await this.prisma.refund.create({
      data: {
        id: generateId('ref'),
        orderId: order.id,
        amount: refundAmount,
        currency: order.payment.currency,
        reason: input.reason,
        notes: input.notes,
        status: stripeRefund.status === 'succeeded' ? 'succeeded' : 'pending',
        stripeRefundId: stripeRefund.id,
        createdBy: adminUserId,
      },
    });

    // Update order status
    await this.updateOrderStatus(order, refundAmount, totalRefunded + refundAmount);

    // Restock inventory if requested
    if (input.restockItems) {
      await this.inventoryService.restockOrderItems(order.items);
    }

    // Send refund confirmation email
    await this.emailService.sendRefundConfirmation({
      orderId: order.id,
      orderNumber: order.orderNumber,
      refundAmount,
      currency: order.payment.currency,
      customerEmail: order.customerEmail,
    });

    // Audit log
    await this.auditService.log({
      type: 'refund_processed',
      orderId: order.id,
      refundId: refund.id,
      amount: refundAmount,
      reason: input.reason,
      adminUserId,
      stripeRefundId: stripeRefund.id,
    });

    return refund;
  }

  protected async getTotalRefunded(orderId: string): Promise<number> {
    const result = await this.prisma.refund.aggregate({
      where: { orderId, status: 'succeeded' },
      _sum: { amount: true },
    });
    return result._sum.amount ?? 0;
  }

  protected async updateOrderStatus(
    order: Order,
    newRefundAmount: number,
    totalRefunded: number,
  ): Promise<void> {
    const newStatus = totalRefunded >= order.payment.amount
      ? 'fully_refunded'
      : 'partially_refunded';

    await this.prisma.order.update({
      where: { id: order.id },
      data: { status: newStatus },
    });
  }

  private mapRefundReason(reason: RefundReason): Stripe.RefundCreateParams.Reason {
    const mapping: Record<RefundReason, Stripe.RefundCreateParams.Reason> = {
      customer_request: 'requested_by_customer',
      duplicate_charge: 'duplicate',
      fraudulent: 'fraudulent',
      product_not_received: 'requested_by_customer',
      product_defective: 'requested_by_customer',
      other: 'requested_by_customer',
    };
    return mapping[reason];
  }
}
```

#### tRPC Router (`apps/api/src/trpc/routers/refund.router.ts`)
```typescript
export const refundRouter = router({
  processRefund: protectedProcedure
    .input(CreateRefundInputSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.refundService.processRefund(input, ctx.user.id);
    }),

  getRefundHistory: protectedProcedure
    .input(z.object({ orderId: OrderIdSchema }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.refund.findMany({
        where: { orderId: input.orderId },
        orderBy: { createdAt: 'desc' },
      });
    }),

  getRefundableAmount: protectedProcedure
    .input(z.object({ orderId: OrderIdSchema }))
    .query(async ({ ctx, input }) => {
      const order = await ctx.prisma.order.findUniqueOrThrow({
        where: { id: input.orderId },
        include: { payment: true },
      });
      const totalRefunded = await ctx.refundService.getTotalRefunded(input.orderId);
      return {
        originalAmount: order.payment.amount,
        totalRefunded,
        refundableAmount: order.payment.amount - totalRefunded,
        currency: order.payment.currency,
      };
    }),
});
```

#### Server Action (`apps/dashboard/src/app/(dashboard)/orders/[orderId]/_actions/process-refund.ts`)
```typescript
'use server';

import { createServerAction } from 'zsa';
import { CreateRefundInputSchema } from '@trafi/validators';
import { trpc } from '@/lib/trpc/server';

export const processRefundAction = createServerAction()
  .input(CreateRefundInputSchema)
  .handler(async ({ input }) => {
    const refund = await trpc.refund.processRefund(input);
    return refund;
  });

export const getRefundHistoryAction = createServerAction()
  .input(z.object({ orderId: OrderIdSchema }))
  .handler(async ({ input }) => {
    return trpc.refund.getRefundHistory(input);
  });

export const getRefundableAmountAction = createServerAction()
  .input(z.object({ orderId: OrderIdSchema }))
  .handler(async ({ input }) => {
    return trpc.refund.getRefundableAmount(input);
  });
```

#### Dashboard Data Flow
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Order Detail Page (RSC)                                                      │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ RefundButton (Client Component)                                          │ │
│ │   └─ Opens RefundDialog                                                  │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ RefundDialog (Client Component)                                          │ │
│ │   ├─ useServerActionQuery(getRefundableAmountAction)                     │ │
│ │   │                                                                      │ │
│ │   ├─ RefundTypeSelect: Full / Partial                                    │ │
│ │   ├─ RefundAmountInput (if partial)                                      │ │
│ │   │   └─ Max validation against refundableAmount                         │ │
│ │   ├─ RefundReasonSelect (dropdown)                                       │ │
│ │   ├─ RestockCheckbox                                                     │ │
│ │   ├─ NotesTextarea (optional)                                            │ │
│ │   │                                                                      │ │
│ │   └─ Submit → useServerAction(processRefundAction)                       │ │
│ │       └─ On success: toast + refresh + close dialog                      │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ RefundHistory (Client Component)                                         │ │
│ │   └─ useServerActionQuery(getRefundHistoryAction)                        │ │
│ │       └─ Table: Date, Amount, Reason, Status, Admin                      │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Refund Dialog (`apps/dashboard/src/app/(dashboard)/orders/[orderId]/_components/refund-dialog.tsx`)
```typescript
'use client';

import { useServerAction, useServerActionQuery } from 'zsa-react';
import { processRefundAction, getRefundableAmountAction } from '../_actions/process-refund';

export function RefundDialog({ orderId, open, onOpenChange }: RefundDialogProps) {
  const { data: refundable, isLoading } = useServerActionQuery(
    getRefundableAmountAction,
    { input: { orderId }, queryKey: ['refundable', orderId] },
  );

  const { execute, isPending } = useServerAction(processRefundAction);

  const [type, setType] = useState<RefundType>('full');
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState<RefundReason>('customer_request');
  const [restockItems, setRestockItems] = useState(false);
  const [notes, setNotes] = useState('');

  const handleSubmit = async () => {
    const [result, error] = await execute({
      orderId,
      type,
      amount: type === 'partial' ? amount : undefined,
      reason,
      restockItems,
      notes: notes || undefined,
    });

    if (error) {
      toast.error('Refund failed', { description: error.message });
      return;
    }

    toast.success('Refund processed', {
      description: `${formatCurrency(result.amount, result.currency)} refunded`,
    });
    onOpenChange(false);
  };

  if (isLoading) return <Skeleton className="h-64" />;

  const maxAmount = refundable?.refundableAmount ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Issue Refund</DialogTitle>
          <DialogDescription>
            Maximum refundable: {formatCurrency(maxAmount, refundable?.currency)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Refund Type */}
          <div className="space-y-2">
            <Label>Refund Type</Label>
            <RadioGroup value={type} onValueChange={setType}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="full" id="full" />
                <Label htmlFor="full">
                  Full Refund ({formatCurrency(maxAmount, refundable?.currency)})
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="partial" id="partial" />
                <Label htmlFor="partial">Partial Refund</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Amount Input (partial only) */}
          {type === 'partial' && (
            <div className="space-y-2">
              <Label>Amount</Label>
              <RefundAmountInput
                value={amount}
                onChange={setAmount}
                max={maxAmount}
                currency={refundable?.currency}
              />
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label>Reason</Label>
            <RefundReasonSelect value={reason} onValueChange={setReason} />
          </div>

          {/* Restock */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="restock"
              checked={restockItems}
              onCheckedChange={setRestockItems}
            />
            <Label htmlFor="restock">Restock items to inventory</Label>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes about this refund..."
              maxLength={500}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || (type === 'partial' && amount <= 0)}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Process Refund'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

#### UX Implementation Notes
- **Dark Mode**: Dialog uses #1A1A1A background (UX-COLOR)
- **Validation**: Amount cannot exceed refundable balance
- **Loading State**: Spinner during Stripe API call (UX-ANIM)
- **Toast**: Success/error feedback with amount formatted
- **Restock Option**: Checkbox to automatically restore inventory
- **Audit Trail**: All refunds logged with admin user

---

## Story 5.8: Payment Audit Trail

As a **System**,
I want **to log all payment events**,
So that **there's a complete audit trail for compliance**.

**Acceptance Criteria:**

**Given** any payment-related action occurs
**When** the action completes
**Then** an audit log entry is created with:
- Timestamp
- Actor (system, admin, or customer reference)
- Action type (payment, refund, failure, etc.)
- Amount and currency
- Stripe event/transaction ID
- Order reference
**And** logs are immutable and retained per policy
**And** logs are queryable for merchant support

### Technical Implementation

#### File Structure
```
apps/dashboard/src/app/(dashboard)/orders/[orderId]/
├── _components/
│   └── payment-audit-log.tsx              # Audit log display
└── _actions/
    └── get-audit-log.ts

apps/api/src/
├── payment/
│   └── audit/
│       ├── payment-audit.service.ts       # Audit logging service
│       ├── payment-audit.types.ts         # Type definitions
│       └── payment-audit.module.ts
├── prisma/
│   └── schema.prisma                      # PaymentAuditLog model
```

#### Zod Schemas (`@trafi/validators`)
```typescript
// packages/validators/src/audit.ts
export const PaymentAuditEventTypeSchema = z.enum([
  'payment_intent_created',
  'payment_succeeded',
  'payment_failed',
  'payment_requires_action',
  'refund_initiated',
  'refund_processed',
  'refund_failed',
  'webhook_received',
  'webhook_processed',
  'webhook_failed',
  'stripe_connected',
  'stripe_disconnected',
]);

export const PaymentAuditActorTypeSchema = z.enum([
  'system',
  'admin',
  'customer',
  'webhook',
]);

export const PaymentAuditLogSchema = z.object({
  id: z.string().startsWith('audit_'),
  eventType: PaymentAuditEventTypeSchema,
  actorType: PaymentAuditActorTypeSchema,
  actorId: z.string().nullable(),         // User ID or null for system
  orderId: OrderIdSchema.nullable(),
  checkoutSessionId: CheckoutSessionIdSchema.nullable(),
  refundId: RefundIdSchema.nullable(),
  amount: z.number().int().nullable(),    // Cents
  currency: z.string().length(3).nullable(),
  stripeEventId: z.string().nullable(),
  stripePaymentIntentId: z.string().nullable(),
  stripeRefundId: z.string().nullable(),
  metadata: z.record(z.unknown()).nullable(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  createdAt: z.date(),
});

export const PaymentAuditLogInputSchema = PaymentAuditLogSchema.omit({
  id: true,
  createdAt: true,
});

export const AuditLogQuerySchema = z.object({
  orderId: OrderIdSchema.optional(),
  eventTypes: z.array(PaymentAuditEventTypeSchema).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  cursor: z.string().optional(),
});
```

#### Prisma Schema (`apps/api/prisma/schema.prisma`)
```prisma
model PaymentAuditLog {
  id                    String   @id @default(cuid())
  eventType             String
  actorType             String
  actorId               String?
  orderId               String?
  checkoutSessionId     String?
  refundId              String?
  amount                Int?
  currency              String?  @db.Char(3)
  stripeEventId         String?  @unique
  stripePaymentIntentId String?
  stripeRefundId        String?
  metadata              Json?
  ipAddress             String?
  userAgent             String?
  createdAt             DateTime @default(now())

  // Relations
  order Order? @relation(fields: [orderId], references: [id])

  // Indexes for query performance
  @@index([orderId])
  @@index([eventType])
  @@index([createdAt])
  @@index([stripePaymentIntentId])

  // Immutable - no update/delete operations allowed via application
  @@map("payment_audit_logs")
}
```

#### Backend Audit Service (`apps/api/src/payment/audit/payment-audit.service.ts`)
```typescript
@Injectable()
export class PaymentAuditService {
  private readonly logger = new Logger(PaymentAuditService.name);

  constructor(private prisma: PrismaService) {}

  // Protected for @trafi/core extensibility (RETRO-2)
  protected async log(input: PaymentAuditLogInput): Promise<void> {
    try {
      await this.prisma.paymentAuditLog.create({
        data: {
          id: generateId('audit'),
          eventType: input.eventType,
          actorType: input.actorType,
          actorId: input.actorId,
          orderId: input.orderId,
          checkoutSessionId: input.checkoutSessionId,
          refundId: input.refundId,
          amount: input.amount,
          currency: input.currency,
          stripeEventId: input.stripeEventId,
          stripePaymentIntentId: input.stripePaymentIntentId,
          stripeRefundId: input.stripeRefundId,
          metadata: input.metadata,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
        },
      });
    } catch (error) {
      // Log but don't throw - audit failure shouldn't block payments
      this.logger.error('Failed to create audit log', { error, input });
    }
  }

  // Convenience methods for common events
  protected async logPaymentSucceeded(data: {
    orderId: string;
    amount: number;
    currency: string;
    stripePaymentIntentId: string;
    stripeEventId?: string;
  }): Promise<void> {
    await this.log({
      eventType: 'payment_succeeded',
      actorType: 'system',
      actorId: null,
      orderId: data.orderId,
      checkoutSessionId: null,
      refundId: null,
      amount: data.amount,
      currency: data.currency,
      stripeEventId: data.stripeEventId ?? null,
      stripePaymentIntentId: data.stripePaymentIntentId,
      stripeRefundId: null,
      metadata: null,
      ipAddress: null,
      userAgent: null,
    });
  }

  protected async logPaymentFailed(data: {
    checkoutSessionId: string;
    amount: number;
    currency: string;
    stripePaymentIntentId: string;
    error: string;
    stripeEventId?: string;
  }): Promise<void> {
    await this.log({
      eventType: 'payment_failed',
      actorType: 'system',
      actorId: null,
      orderId: null,
      checkoutSessionId: data.checkoutSessionId,
      refundId: null,
      amount: data.amount,
      currency: data.currency,
      stripeEventId: data.stripeEventId ?? null,
      stripePaymentIntentId: data.stripePaymentIntentId,
      stripeRefundId: null,
      metadata: { error: data.error },
      ipAddress: null,
      userAgent: null,
    });
  }

  protected async logRefundProcessed(data: {
    orderId: string;
    refundId: string;
    amount: number;
    currency: string;
    stripeRefundId: string;
    adminUserId: string;
    reason: string;
  }): Promise<void> {
    await this.log({
      eventType: 'refund_processed',
      actorType: 'admin',
      actorId: data.adminUserId,
      orderId: data.orderId,
      checkoutSessionId: null,
      refundId: data.refundId,
      amount: data.amount,
      currency: data.currency,
      stripeEventId: null,
      stripePaymentIntentId: null,
      stripeRefundId: data.stripeRefundId,
      metadata: { reason: data.reason },
      ipAddress: null,
      userAgent: null,
    });
  }

  protected async logWebhookReceived(data: {
    stripeEventId: string;
    eventType: string;
    stripePaymentIntentId?: string;
  }): Promise<void> {
    await this.log({
      eventType: 'webhook_received',
      actorType: 'webhook',
      actorId: null,
      orderId: null,
      checkoutSessionId: null,
      refundId: null,
      amount: null,
      currency: null,
      stripeEventId: data.stripeEventId,
      stripePaymentIntentId: data.stripePaymentIntentId ?? null,
      stripeRefundId: null,
      metadata: { webhookEventType: data.eventType },
      ipAddress: null,
      userAgent: null,
    });
  }

  // Query methods
  protected async getAuditLog(
    query: AuditLogQuery,
  ): Promise<{ logs: PaymentAuditLog[]; nextCursor: string | null }> {
    const where: Prisma.PaymentAuditLogWhereInput = {};

    if (query.orderId) {
      where.orderId = query.orderId;
    }
    if (query.eventTypes?.length) {
      where.eventType = { in: query.eventTypes };
    }
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = query.startDate;
      if (query.endDate) where.createdAt.lte = query.endDate;
    }

    const logs = await this.prisma.paymentAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: query.limit + 1,
      cursor: query.cursor ? { id: query.cursor } : undefined,
      skip: query.cursor ? 1 : 0,
    });

    const hasMore = logs.length > query.limit;
    const results = hasMore ? logs.slice(0, -1) : logs;
    const nextCursor = hasMore ? results[results.length - 1]?.id : null;

    return { logs: results, nextCursor };
  }
}
```

#### tRPC Router (`apps/api/src/trpc/routers/audit.router.ts`)
```typescript
export const auditRouter = router({
  getPaymentAuditLog: protectedProcedure
    .input(AuditLogQuerySchema)
    .query(async ({ ctx, input }) => {
      return ctx.paymentAuditService.getAuditLog(input);
    }),
});
```

#### Server Action (`apps/dashboard/src/app/(dashboard)/orders/[orderId]/_actions/get-audit-log.ts`)
```typescript
'use server';

import { createServerAction } from 'zsa';
import { AuditLogQuerySchema } from '@trafi/validators';
import { trpc } from '@/lib/trpc/server';

export const getPaymentAuditLogAction = createServerAction()
  .input(AuditLogQuerySchema)
  .handler(async ({ input }) => {
    return trpc.audit.getPaymentAuditLog(input);
  });
```

#### Dashboard Data Flow
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Order Detail Page - Payment Audit Section                                   │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ PaymentAuditLog (Client Component)                                       │ │
│ │   ├─ useServerActionQuery(getPaymentAuditLogAction)                      │ │
│ │   │   └─ { orderId, limit: 20 }                                          │ │
│ │   │                                                                      │ │
│ │   ├─ Timeline View:                                                      │ │
│ │   │   ├─ EventIcon (colored by type)                                     │ │
│ │   │   ├─ Timestamp (relative + absolute on hover)                        │ │
│ │   │   ├─ Event Description                                               │ │
│ │   │   ├─ Amount (if applicable)                                          │ │
│ │   │   └─ Actor Badge (System / Admin / Webhook)                          │ │
│ │   │                                                                      │ │
│ │   └─ "Load More" → fetch with cursor pagination                          │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Payment Audit Log Component (`apps/dashboard/src/app/(dashboard)/orders/[orderId]/_components/payment-audit-log.tsx`)
```typescript
'use client';

import { useServerActionQuery } from 'zsa-react';
import { getPaymentAuditLogAction } from '../_actions/get-audit-log';
import { formatDistanceToNow, format } from 'date-fns';

const EVENT_ICONS: Record<string, { icon: LucideIcon; color: string }> = {
  payment_succeeded: { icon: CheckCircle, color: 'text-green-500' },
  payment_failed: { icon: XCircle, color: 'text-red-500' },
  payment_requires_action: { icon: AlertCircle, color: 'text-yellow-500' },
  refund_processed: { icon: ArrowLeftRight, color: 'text-blue-500' },
  refund_failed: { icon: XCircle, color: 'text-red-500' },
  webhook_received: { icon: Webhook, color: 'text-gray-500' },
  webhook_processed: { icon: CheckCircle, color: 'text-gray-500' },
};

const EVENT_DESCRIPTIONS: Record<string, (log: PaymentAuditLog) => string> = {
  payment_succeeded: (log) =>
    `Payment of ${formatCurrency(log.amount!, log.currency!)} succeeded`,
  payment_failed: (log) =>
    `Payment of ${formatCurrency(log.amount!, log.currency!)} failed: ${log.metadata?.error}`,
  refund_processed: (log) =>
    `Refund of ${formatCurrency(log.amount!, log.currency!)} processed`,
  webhook_received: (log) =>
    `Stripe webhook received: ${log.metadata?.webhookEventType}`,
};

export function PaymentAuditLog({ orderId }: { orderId: string }) {
  const [cursor, setCursor] = useState<string | undefined>(undefined);

  const { data, isLoading, refetch } = useServerActionQuery(
    getPaymentAuditLogAction,
    {
      input: { orderId, limit: 20, cursor },
      queryKey: ['audit-log', orderId, cursor],
    },
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Payment Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

          <div className="space-y-4">
            {data?.logs.map((log) => {
              const config = EVENT_ICONS[log.eventType] ?? {
                icon: Circle,
                color: 'text-gray-400',
              };
              const Icon = config.icon;

              return (
                <div key={log.id} className="relative pl-10">
                  {/* Icon */}
                  <div
                    className={cn(
                      'absolute left-0 w-8 h-8 rounded-full bg-background border flex items-center justify-center',
                      config.color,
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Content */}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {EVENT_DESCRIPTIONS[log.eventType]?.(log) ?? log.eventType}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="text-xs text-muted-foreground"
                          title={format(log.createdAt, 'PPpp')}
                        >
                          {formatDistanceToNow(log.createdAt, { addSuffix: true })}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {log.actorType}
                        </Badge>
                      </div>
                    </div>

                    {/* Stripe ID for support */}
                    {log.stripePaymentIntentId && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="secondary" className="text-xs font-mono">
                              {log.stripePaymentIntentId.slice(0, 12)}...
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-mono text-xs">{log.stripePaymentIntentId}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load More */}
          {data?.nextCursor && (
            <Button
              variant="ghost"
              className="w-full mt-4"
              onClick={() => setCursor(data.nextCursor!)}
            >
              Load More
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

#### UX Implementation Notes
- **Timeline UI**: Vertical timeline with event icons (color-coded by type)
- **Relative Time**: "2 minutes ago" with full datetime on hover
- **Actor Badges**: System (gray), Admin (blue), Webhook (purple)
- **Stripe IDs**: Truncated with full ID in tooltip for support
- **Pagination**: Cursor-based "Load More" for performance
- **Immutability**: No edit/delete actions - logs are read-only
- **Dark Mode**: Uses dark background (#0A0A0A) with subtle border colors
- **Retention**: Logs retained per policy (typically 7 years for PCI compliance)
