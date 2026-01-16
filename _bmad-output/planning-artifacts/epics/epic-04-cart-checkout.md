# Epic 4: Shopping Cart & Checkout

Buyer peut ajouter au panier, voir les frais de livraison en temps reel, et finaliser son achat en guest checkout.

**FRs covered:** FR13, FR14, FR15, FR16, FR17, FR21, FR22

---

## Epic Implementation Guidelines

### Retrospective Learnings (MANDATORY)
- **RETRO-1:** Use Context7 MCP before implementing Stripe Elements, address autocomplete
- **RETRO-2:** CartService, CheckoutService, ShippingService use `protected` methods
- **RETRO-3:** CheckoutModule exports explicit public API for custom checkout flows
- **RETRO-4:** Storefront checkout components accept customization props
- **RETRO-5:** Checkout page uses composition pattern (wrappable steps)
- **RETRO-6:** Code with @trafi/core override patterns (custom checkout steps possible)

### UX Design Requirements (Storefront - Digital Brutalism v2)

**Brutalist Manifesto:**
- The interface is a machine. No decoration, only data and action.
- Radius-zero everywhere — everything is a rectangle.
- Visible grid — 1px borders expose structure.
- High contrast — pure black background, pure white text.

**Storefront Visual Design:**
- **UX-STORE-1:** Fixed header with solid black background, 1px border bottom
- **UX-STORE-2:** Cart slide-over from right (400px width, solid black background)
- **UX-STORE-3:** Product cards with border highlight on hover (no transforms)
- **UX-STORE-4:** Mobile-first responsive (touch targets 48x48px minimum)
- **UX-STORE-5:** Express checkout (Apple Pay/Google Pay) above fold
- **UX-10:** Guest checkout as default, shipping visible from cart
- **UX-11:** Checkout flow < 90 seconds target
- **UX-COLOR-1:** Primary Acid Lime #CCFF00 for CTAs, focus states
- **UX-COLOR-2:** Background #000000, borders #333333, text #FFFFFF
- **UX-COLOR-3:** Success #00FF94, Risk #FF3366
- **UX-RADIUS:** 0px everywhere — `border-radius: 0px !important`
- **UX-SHADOW:** None — elements sit firmly in the grid
- **UX-TYPE:** JetBrains Mono for prices/quantities, system font for body

### Dashboard UX (Merchant Shipping Configuration - Digital Brutalism v2)

**Visual Design:**
- **UX-2:** Rail (64px) + Sidebar (240px) + Main content layout
- **UX-3:** Breadcrumb: Dashboard > Settings > Shipping
- **UX-8:** Shadcn UI: DataTable for zones, Dialog for rate editing (all radius-0)
- **UX-COLOR-1:** Primary Acid Lime #CCFF00 for action buttons, focus states
- **UX-COLOR-2:** Background #000000, borders #333333, text #FFFFFF
- **UX-RADIUS:** 0px everywhere

---

## Story 4.1: Cart Model and Session Management

As a **Buyer (Emma)**,
I want **my cart to persist across browser sessions**,
So that **I don't lose my selections when I return**.

**Acceptance Criteria:**

**Given** a buyer visits the storefront
**When** they add items to cart
**Then** the cart is persisted via:
- Cookie-based cart ID for anonymous users
- Account-linked cart for authenticated users
**And** cart survives browser close and return
**And** cart has a configurable expiration (default 30 days)
**And** cart merges on login if items exist in both

### Technical Implementation

#### File Structure
```
apps/storefront/src/
├── lib/
│   ├── cart/
│   │   ├── cart-context.tsx       # React context for cart state
│   │   ├── cart-provider.tsx      # Provider with persistence logic
│   │   └── use-cart.ts            # Cart hook for components
│   └── cookies.ts                 # Cookie utilities (cart_id)
├── app/
│   └── api/
│       └── cart/
│           └── route.ts           # Cart API route (GET/POST)

apps/api/src/
├── cart/
│   ├── cart.module.ts
│   ├── cart.service.ts            # Cart CRUD + merge logic
│   ├── cart.controller.ts
│   ├── dto/
│   │   ├── create-cart.dto.ts
│   │   └── merge-cart.dto.ts
│   └── entities/
│       └── cart.entity.ts
```

#### Zod Schemas (`@trafi/validators`)
```typescript
// packages/validators/src/cart.ts
export const CartIdSchema = z.string().startsWith('cart_');

export const CartItemSchema = z.object({
  id: z.string().startsWith('citem_'),
  variantId: z.string().startsWith('var_'),
  quantity: z.number().int().positive(),
  priceAtAddition: z.number().int().nonnegative(), // Cents (ARCH-25)
});

export const CartSchema = z.object({
  id: CartIdSchema,
  customerId: z.string().startsWith('cust_').nullable(),
  items: z.array(CartItemSchema),
  expiresAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const MergeCartSchema = z.object({
  sourceCartId: CartIdSchema,       // Anonymous cart
  targetCustomerId: z.string().startsWith('cust_'),
});
```

#### Backend Service (`apps/api/src/cart/cart.service.ts`)
```typescript
@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  // Protected for @trafi/core extensibility (RETRO-2)
  protected async getOrCreateCart(cartId?: string, customerId?: string): Promise<Cart> {
    if (customerId) {
      // Return customer's cart or create new one
      return this.findOrCreateCustomerCart(customerId);
    }
    if (cartId) {
      const cart = await this.prisma.cart.findUnique({ where: { id: cartId } });
      if (cart && cart.expiresAt > new Date()) return cart;
    }
    return this.createAnonymousCart();
  }

  protected async mergeCartsOnLogin(
    anonymousCartId: string,
    customerId: string,
  ): Promise<Cart> {
    return this.prisma.$transaction(async (tx) => {
      const [anonymousCart, customerCart] = await Promise.all([
        tx.cart.findUnique({ where: { id: anonymousCartId }, include: { items: true } }),
        tx.cart.findFirst({ where: { customerId }, include: { items: true } }),
      ]);

      if (!anonymousCart?.items.length) {
        return customerCart ?? this.createCartForCustomer(tx, customerId);
      }

      const targetCart = customerCart ?? await this.createCartForCustomer(tx, customerId);

      // Merge items, preferring higher quantities
      for (const item of anonymousCart.items) {
        const existing = targetCart.items.find(i => i.variantId === item.variantId);
        if (existing) {
          await tx.cartItem.update({
            where: { id: existing.id },
            data: { quantity: Math.max(existing.quantity, item.quantity) },
          });
        } else {
          await tx.cartItem.create({
            data: { ...item, id: generateId('citem'), cartId: targetCart.id },
          });
        }
      }

      // Delete anonymous cart
      await tx.cart.delete({ where: { id: anonymousCartId } });
      return this.getCartWithItems(tx, targetCart.id);
    });
  }

  protected calculateExpiration(): Date {
    const days = 30; // Configurable via store settings
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }
}
```

#### tRPC Router (`apps/api/src/trpc/routers/cart.router.ts`)
```typescript
export const cartRouter = router({
  get: publicProcedure
    .input(z.object({ cartId: CartIdSchema.optional() }))
    .query(async ({ ctx, input }) => {
      return ctx.cartService.getOrCreateCart(input.cartId, ctx.customerId);
    }),

  merge: publicProcedure
    .input(MergeCartSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.cartService.mergeCartsOnLogin(
        input.sourceCartId,
        input.targetCustomerId,
      );
    }),
});
```

#### Storefront Data Flow
```
┌─────────────────────────────────────────────────────────────────┐
│ Storefront Layout (RSC)                                         │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ CartProvider (Client - reads cart_id cookie)                │ │
│ │ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ │ useCart() hook                                          │ │ │
│ │ │   → Initial fetch from tRPC (cart.get)                  │ │ │
│ │ │   → Sets cart_id cookie if new cart                     │ │ │
│ │ │   → On login: calls cart.merge mutation                 │ │ │
│ │ └─────────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

#### Cart Provider (`apps/storefront/src/lib/cart/cart-provider.tsx`)
```typescript
'use client';

export function CartProvider({ children, initialCartId }: CartProviderProps) {
  const [cartId, setCartId] = useState<string | null>(initialCartId);
  const { data: cart, refetch } = trpc.cart.get.useQuery(
    { cartId: cartId ?? undefined },
    { enabled: true },
  );

  // Set cookie when cart is created
  useEffect(() => {
    if (cart?.id && cart.id !== cartId) {
      setCartId(cart.id);
      setCookie('cart_id', cart.id, { maxAge: 30 * 24 * 60 * 60 });
    }
  }, [cart?.id]);

  // Handle login merge
  const mergeOnLogin = useCallback(async (customerId: string) => {
    if (cartId) {
      await trpc.cart.merge.mutate({ sourceCartId: cartId, targetCustomerId: customerId });
      refetch();
    }
  }, [cartId, refetch]);

  return (
    <CartContext.Provider value={{ cart, cartId, mergeOnLogin, refetch }}>
      {children}
    </CartContext.Provider>
  );
}
```

#### UX Implementation Notes
- **Cookie Security**: `cart_id` cookie is HttpOnly, Secure, SameSite=Lax
- **Expiration Visual**: Show "Cart expires in X days" if cart is old
- **Merge UX**: On login, show toast "Items from your previous session have been added"
- **Performance**: Cart state cached in React context, hydrated from cookie on SSR

---

## Story 4.2: Add to Cart Functionality

As a **Buyer (Emma)**,
I want **to add products to my cart quickly**,
So that **I can continue shopping without friction**.

**Acceptance Criteria:**

**Given** a buyer is viewing a product
**When** they click "Add to Cart"
**Then** the selected variant and quantity are added
**And** a cart slide-over opens showing the added item
**And** shipping estimate is visible immediately (UX-10)
**And** the operation completes in < 500ms (NFR-PERF-1)
**And** out-of-stock items show appropriate messaging

### Technical Implementation

#### File Structure
```
apps/storefront/src/
├── app/
│   └── products/
│       └── [slug]/
│           ├── page.tsx                    # Product detail (RSC)
│           └── _components/
│               ├── add-to-cart-button.tsx  # Add to cart CTA
│               ├── variant-selector.tsx    # Size/color selection
│               └── quantity-input.tsx      # Quantity controls
├── components/
│   └── cart/
│       ├── cart-slide-over.tsx             # Slide-over panel
│       ├── cart-item.tsx                   # Item row in cart
│       └── shipping-estimate.tsx           # Quick shipping preview
```

#### Zod Schemas (`@trafi/validators`)
```typescript
// packages/validators/src/cart.ts
export const AddToCartSchema = z.object({
  variantId: z.string().startsWith('var_'),
  quantity: z.number().int().positive().max(99),
  cartId: CartIdSchema.optional(),
});

export const AddToCartResponseSchema = z.object({
  cart: CartSchema,
  addedItem: CartItemSchema,
  shippingEstimate: z.object({
    minDays: z.number(),
    maxDays: z.number(),
    price: z.number().int(), // Cents
  }).nullable(),
});
```

#### Backend Service (`apps/api/src/cart/cart.service.ts`)
```typescript
@Injectable()
export class CartService {
  // Protected for @trafi/core extensibility (RETRO-2)
  protected async addToCart(
    input: AddToCartInput,
    customerId?: string,
  ): Promise<AddToCartResult> {
    return this.prisma.$transaction(async (tx) => {
      // 1. Validate variant exists and has stock
      const variant = await tx.productVariant.findUnique({
        where: { id: input.variantId },
        include: { product: true, inventory: true },
      });

      if (!variant || variant.product.status !== 'active') {
        throw new NotFoundException('Product not available');
      }

      if (variant.inventory && variant.inventory.quantity < input.quantity) {
        throw new BadRequestException('Insufficient stock');
      }

      // 2. Get or create cart
      const cart = await this.getOrCreateCart(input.cartId, customerId);

      // 3. Add or update cart item
      const existingItem = await tx.cartItem.findFirst({
        where: { cartId: cart.id, variantId: input.variantId },
      });

      let addedItem: CartItem;
      if (existingItem) {
        addedItem = await tx.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + input.quantity },
        });
      } else {
        addedItem = await tx.cartItem.create({
          data: {
            id: generateId('citem'),
            cartId: cart.id,
            variantId: input.variantId,
            quantity: input.quantity,
            priceAtAddition: variant.price,
          },
        });
      }

      // 4. Get updated cart with shipping estimate
      const updatedCart = await this.getCartWithItems(tx, cart.id);
      const shippingEstimate = await this.shippingService.getQuickEstimate(cart.id);

      return { cart: updatedCart, addedItem, shippingEstimate };
    });
  }

  protected async validateStock(variantId: string, quantity: number): Promise<boolean> {
    const inventory = await this.prisma.inventory.findFirst({
      where: { variantId },
    });
    return !inventory || inventory.quantity >= quantity;
  }
}
```

#### tRPC Router (`apps/api/src/trpc/routers/cart.router.ts`)
```typescript
export const cartRouter = router({
  addItem: publicProcedure
    .input(AddToCartSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.cartService.addToCart(input, ctx.customerId);
    }),

  validateStock: publicProcedure
    .input(z.object({ variantId: z.string(), quantity: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.cartService.validateStock(input.variantId, input.quantity);
    }),
});
```

#### Storefront Data Flow
```
┌────────────────────────────────────────────────────────────────────┐
│ Product Page (RSC) - Fetches product data server-side              │
│ ┌────────────────────────────────────────────────────────────────┐ │
│ │ AddToCartButton (Client Component)                             │ │
│ │   ├─ Selected variant from VariantSelector                     │ │
│ │   ├─ Quantity from QuantityInput                               │ │
│ │   └─ onClick:                                                  │ │
│ │       │                                                        │ │
│ │       ▼                                                        │ │
│ │   trpc.cart.addItem.mutate({ variantId, quantity, cartId })    │ │
│ │       │                                                        │ │
│ │       ▼                                                        │ │
│ │   onSuccess: openCartSlideOver() + updateCartContext()         │ │
│ └────────────────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────────────────┐ │
│ │ CartSlideOver (Client Component) - Sheet from right            │ │
│ │   ├─ Shows added item with success animation                   │ │
│ │   ├─ ShippingEstimate component with delivery dates            │ │
│ │   └─ "Continue Shopping" or "Checkout" CTAs                    │ │
│ └────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

#### Add to Cart Button (`apps/storefront/src/app/products/[slug]/_components/add-to-cart-button.tsx`)
```typescript
'use client';

export function AddToCartButton({ variant, product }: AddToCartButtonProps) {
  const { cartId, refetch } = useCart();
  const { openCart } = useCartSlideOver();
  const [quantity, setQuantity] = useState(1);

  const addToCart = trpc.cart.addItem.useMutation({
    onSuccess: (data) => {
      refetch();
      openCart({ highlightItem: data.addedItem.id });
      toast.success(`${product.title} added to cart`);
    },
    onError: (error) => {
      if (error.data?.code === 'BAD_REQUEST') {
        toast.error('Not enough stock available');
      }
    },
  });

  const isOutOfStock = variant.inventory?.quantity === 0;
  const isLoading = addToCart.isPending;

  return (
    <div className="flex gap-3">
      <QuantityInput value={quantity} onChange={setQuantity} max={99} />
      <Button
        onClick={() => addToCart.mutate({ variantId: variant.id, quantity, cartId })}
        disabled={isOutOfStock || isLoading}
        className="flex-1 h-12"
      >
        {isLoading ? (
          <Loader2 className="animate-spin" />
        ) : isOutOfStock ? (
          'Out of Stock'
        ) : (
          'Add to Cart'
        )}
      </Button>
    </div>
  );
}
```

#### Cart Slide-Over (`apps/storefront/src/components/cart/cart-slide-over.tsx`)
```typescript
'use client';

export function CartSlideOver() {
  const { isOpen, close, highlightItemId } = useCartSlideOver();
  const { cart } = useCart();

  return (
    <Sheet open={isOpen} onOpenChange={close}>
      <SheetContent
        side="right"
        className="w-[400px] bg-white/80 backdrop-blur-xl" // UX-STORE-2
      >
        <SheetHeader>
          <SheetTitle>Your Cart ({cart?.items.length ?? 0})</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 py-4">
          {cart?.items.map((item) => (
            <CartItem
              key={item.id}
              item={item}
              isHighlighted={item.id === highlightItemId}
            />
          ))}
        </div>

        <ShippingEstimate cartId={cart?.id} /> {/* UX-10 */}

        <SheetFooter>
          <Button variant="outline" onClick={close}>
            Continue Shopping
          </Button>
          <Button asChild>
            <Link href="/checkout">Checkout</Link>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
```

#### UX Implementation Notes
- **Animation**: Add to cart triggers 200-300ms scale animation on button (UX-ANIM)
- **Slide-over**: 400px width, frosted glass background (backdrop-filter: blur(12px)) per UX-STORE-2
- **Touch targets**: All buttons minimum 48x48px for mobile (UX-STORE-4)
- **Performance**: Mutation is optimistic - cart updates immediately, server confirms
- **Error states**: Out of stock shows disabled button with clear messaging
- **Shipping estimate**: Updates in real-time as items are added

---

## Story 4.3: Cart Management and Updates

As a **Buyer (Emma)**,
I want **to view and modify my cart contents**,
So that **I can adjust my order before checkout**.

**Acceptance Criteria:**

**Given** a buyer has items in cart
**When** they view the cart
**Then** they can:
- See all items with images, titles, variants, prices
- Update quantities (with inventory validation)
- Remove items from cart
- See subtotal, estimated shipping, and estimated tax
**And** cart updates happen in real-time without page reload
**And** quantity changes validate against available inventory

### Technical Implementation

#### File Structure
```
apps/storefront/src/
├── app/
│   └── cart/
│       ├── page.tsx                  # Full cart page (RSC)
│       └── _components/
│           ├── cart-items-list.tsx   # Items with edit controls
│           ├── cart-summary.tsx      # Subtotal, shipping, tax
│           └── empty-cart.tsx        # Empty state
├── components/
│   └── cart/
│       ├── quantity-stepper.tsx      # +/- quantity controls
│       └── remove-item-button.tsx    # Remove with confirmation
```

#### Zod Schemas (`@trafi/validators`)
```typescript
// packages/validators/src/cart.ts
export const UpdateCartItemSchema = z.object({
  cartItemId: z.string().startsWith('citem_'),
  quantity: z.number().int().positive().max(99),
});

export const RemoveCartItemSchema = z.object({
  cartItemId: z.string().startsWith('citem_'),
});

export const CartSummarySchema = z.object({
  subtotal: z.number().int(),           // Cents
  shippingEstimate: z.number().int(),   // Cents
  taxEstimate: z.number().int(),        // Cents
  total: z.number().int(),              // Cents
  itemCount: z.number().int(),
});
```

#### Backend Service (`apps/api/src/cart/cart.service.ts`)
```typescript
@Injectable()
export class CartService {
  // Protected for @trafi/core extensibility (RETRO-2)
  protected async updateItemQuantity(
    cartItemId: string,
    quantity: number,
  ): Promise<CartWithSummary> {
    return this.prisma.$transaction(async (tx) => {
      const cartItem = await tx.cartItem.findUnique({
        where: { id: cartItemId },
        include: { variant: { include: { inventory: true } } },
      });

      if (!cartItem) throw new NotFoundException('Cart item not found');

      // Validate stock
      if (cartItem.variant.inventory &&
          cartItem.variant.inventory.quantity < quantity) {
        throw new BadRequestException(
          `Only ${cartItem.variant.inventory.quantity} available`,
        );
      }

      await tx.cartItem.update({
        where: { id: cartItemId },
        data: { quantity },
      });

      return this.getCartWithSummary(tx, cartItem.cartId);
    });
  }

  protected async removeItem(cartItemId: string): Promise<CartWithSummary> {
    const cartItem = await this.prisma.cartItem.findUnique({
      where: { id: cartItemId },
    });
    if (!cartItem) throw new NotFoundException('Cart item not found');

    await this.prisma.cartItem.delete({ where: { id: cartItemId } });
    return this.getCartWithSummary(this.prisma, cartItem.cartId);
  }

  protected async getCartWithSummary(
    tx: Prisma.TransactionClient,
    cartId: string,
  ): Promise<CartWithSummary> {
    const cart = await tx.cart.findUnique({
      where: { id: cartId },
      include: {
        items: {
          include: {
            variant: {
              include: { product: true, media: { take: 1 } },
            },
          },
        },
      },
    });

    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.priceAtAddition * item.quantity,
      0,
    );

    const shippingEstimate = await this.shippingService.estimateForCart(cartId);
    const taxEstimate = await this.taxService.estimateForCart(cartId, subtotal);

    return {
      ...cart,
      summary: {
        subtotal,
        shippingEstimate,
        taxEstimate,
        total: subtotal + shippingEstimate + taxEstimate,
        itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
      },
    };
  }
}
```

#### tRPC Router (`apps/api/src/trpc/routers/cart.router.ts`)
```typescript
export const cartRouter = router({
  getWithSummary: publicProcedure
    .input(z.object({ cartId: CartIdSchema }))
    .query(async ({ ctx, input }) => {
      return ctx.cartService.getCartWithSummary(ctx.prisma, input.cartId);
    }),

  updateQuantity: publicProcedure
    .input(UpdateCartItemSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.cartService.updateItemQuantity(input.cartItemId, input.quantity);
    }),

  removeItem: publicProcedure
    .input(RemoveCartItemSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.cartService.removeItem(input.cartItemId);
    }),
});
```

#### Storefront Data Flow
```
┌────────────────────────────────────────────────────────────────────┐
│ Cart Page (RSC) - Initial cart fetch server-side                   │
│ ┌────────────────────────────────────────────────────────────────┐ │
│ │ CartItemsList (Client Component)                               │ │
│ │   └─ Each CartItemRow:                                         │ │
│ │       ├─ Product image, title, variant, price                  │ │
│ │       ├─ QuantityStepper (Client)                              │ │
│ │       │   └─ onChange → trpc.cart.updateQuantity.mutate()      │ │
│ │       │   └─ debounced 300ms to prevent spam                   │ │
│ │       └─ RemoveItemButton                                      │ │
│ │           └─ onClick → trpc.cart.removeItem.mutate()           │ │
│ └────────────────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────────────────┐ │
│ │ CartSummary (Client Component) - Updates on cart change        │ │
│ │   ├─ Subtotal                                                  │ │
│ │   ├─ Estimated Shipping                                        │ │
│ │   ├─ Estimated Tax                                             │ │
│ │   └─ Total                                                     │ │
│ └────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

#### Quantity Stepper (`apps/storefront/src/components/cart/quantity-stepper.tsx`)
```typescript
'use client';

export function QuantityStepper({ item, onUpdate }: QuantityStepperProps) {
  const [quantity, setQuantity] = useState(item.quantity);
  const [error, setError] = useState<string | null>(null);

  const updateQuantity = trpc.cart.updateQuantity.useMutation({
    onError: (err) => {
      setError(err.message);
      setQuantity(item.quantity); // Revert on error
    },
    onSuccess: () => setError(null),
  });

  const debouncedUpdate = useDebouncedCallback((newQty: number) => {
    updateQuantity.mutate({ cartItemId: item.id, quantity: newQty });
  }, 300);

  const handleChange = (delta: number) => {
    const newQty = Math.max(1, Math.min(99, quantity + delta));
    setQuantity(newQty);
    debouncedUpdate(newQty);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => handleChange(-1)}
        disabled={quantity <= 1}
        className="h-8 w-8" // Touch-friendly but compact
      >
        <Minus className="h-4 w-4" />
      </Button>
      <span className="w-8 text-center font-medium">{quantity}</span>
      <Button
        variant="outline"
        size="icon"
        onClick={() => handleChange(1)}
        disabled={quantity >= 99}
        className="h-8 w-8"
      >
        <Plus className="h-4 w-4" />
      </Button>
      {error && <span className="text-sm text-red-500">{error}</span>}
    </div>
  );
}
```

#### Cart Summary (`apps/storefront/src/app/cart/_components/cart-summary.tsx`)
```typescript
'use client';

export function CartSummary({ summary }: CartSummaryProps) {
  return (
    <div className="bg-muted/50 rounded-lg p-6 space-y-4">
      <div className="flex justify-between">
        <span>Subtotal</span>
        <span>{formatCents(summary.subtotal)}</span>
      </div>
      <div className="flex justify-between text-muted-foreground">
        <span>Shipping estimate</span>
        <span>{formatCents(summary.shippingEstimate)}</span>
      </div>
      <div className="flex justify-between text-muted-foreground">
        <span>Tax estimate</span>
        <span>{formatCents(summary.taxEstimate)}</span>
      </div>
      <Separator />
      <div className="flex justify-between font-semibold text-lg">
        <span>Total</span>
        <span>{formatCents(summary.total)}</span>
      </div>
      <Button asChild className="w-full h-12">
        <Link href="/checkout">Proceed to Checkout</Link>
      </Button>
    </div>
  );
}
```

#### UX Implementation Notes
- **Real-time updates**: All mutations update cart state immediately via React Query cache
- **Debouncing**: Quantity changes debounced 300ms to prevent API spam
- **Error recovery**: On stock validation failure, revert quantity and show error message
- **Empty state**: Show empty cart illustration with "Continue Shopping" CTA
- **Price display**: All prices formatted from cents using `formatCents()` utility
- **Accessibility**: Stepper buttons have aria-labels, keyboard navigation works

---

## Story 4.4: Shipping Zones and Rates Configuration

As a **Merchant**,
I want **to configure shipping zones and rates**,
So that **customers see accurate shipping costs**.

**Acceptance Criteria:**

**Given** a Merchant is in Settings
**When** they configure shipping
**Then** they can:
- Create shipping zones by country/region
- Define shipping methods per zone (standard, express, etc.)
- Set flat rates or weight-based rates
- Configure free shipping thresholds
**And** zones can have multiple methods with different prices
**And** a default/fallback zone handles unconfigured regions

### Technical Implementation

#### File Structure
```
apps/dashboard/src/app/(dashboard)/settings/shipping/
├── page.tsx                          # Shipping settings page (RSC)
├── _components/
│   ├── shipping-zones-table.tsx      # DataTable of zones
│   ├── zone-dialog.tsx               # Create/edit zone
│   ├── rate-dialog.tsx               # Create/edit shipping rate
│   └── countries-select.tsx          # Multi-select for countries
├── _hooks/
│   ├── use-shipping-zones.ts
│   └── use-shipping-rates.ts
└── _actions/
    ├── create-zone.ts
    ├── update-zone.ts
    ├── create-rate.ts
    └── update-rate.ts

apps/api/src/
├── shipping/
│   ├── shipping.module.ts
│   ├── shipping.service.ts
│   ├── dto/
│   │   ├── create-zone.dto.ts
│   │   ├── create-rate.dto.ts
│   │   └── rate-calculation.dto.ts
│   └── entities/
│       ├── shipping-zone.entity.ts
│       └── shipping-rate.entity.ts
```

#### Zod Schemas (`@trafi/validators`)
```typescript
// packages/validators/src/shipping.ts
export const ShippingZoneIdSchema = z.string().startsWith('zone_');
export const ShippingRateIdSchema = z.string().startsWith('rate_');

export const RateTypeSchema = z.enum(['flat', 'weight_based', 'price_based']);

export const CreateShippingZoneSchema = z.object({
  name: z.string().min(1).max(100),
  countries: z.array(z.string().length(2)), // ISO 3166-1 alpha-2
  regions: z.array(z.string()).optional(),   // State/province codes
  isDefault: z.boolean().default(false),
});

export const CreateShippingRateSchema = z.object({
  zoneId: ShippingZoneIdSchema,
  name: z.string().min(1).max(100),          // e.g., "Standard", "Express"
  type: RateTypeSchema,
  price: z.number().int().nonnegative(),      // Cents (ARCH-25)
  minOrderValue: z.number().int().optional(), // Free shipping threshold
  minWeight: z.number().optional(),           // For weight-based
  maxWeight: z.number().optional(),
  estimatedDaysMin: z.number().int().positive(),
  estimatedDaysMax: z.number().int().positive(),
});

export const ShippingZoneWithRatesSchema = z.object({
  id: ShippingZoneIdSchema,
  name: z.string(),
  countries: z.array(z.string()),
  isDefault: z.boolean(),
  rates: z.array(z.object({
    id: ShippingRateIdSchema,
    name: z.string(),
    type: RateTypeSchema,
    price: z.number(),
    estimatedDaysMin: z.number(),
    estimatedDaysMax: z.number(),
  })),
});
```

#### Backend Service (`apps/api/src/shipping/shipping.service.ts`)
```typescript
@Injectable()
export class ShippingService {
  constructor(private prisma: PrismaService) {}

  // Protected for @trafi/core extensibility (RETRO-2)
  protected async createZone(input: CreateZoneInput): Promise<ShippingZone> {
    // Ensure only one default zone exists
    if (input.isDefault) {
      await this.prisma.shippingZone.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.shippingZone.create({
      data: {
        id: generateId('zone'),
        ...input,
      },
    });
  }

  protected async createRate(input: CreateRateInput): Promise<ShippingRate> {
    return this.prisma.shippingRate.create({
      data: {
        id: generateId('rate'),
        ...input,
      },
    });
  }

  protected async getZonesWithRates(): Promise<ShippingZoneWithRates[]> {
    return this.prisma.shippingZone.findMany({
      include: { rates: true },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  protected async findZoneForCountry(countryCode: string): Promise<ShippingZone | null> {
    // First try to find specific zone
    const specificZone = await this.prisma.shippingZone.findFirst({
      where: { countries: { has: countryCode } },
      include: { rates: true },
    });

    if (specificZone) return specificZone;

    // Fallback to default zone
    return this.prisma.shippingZone.findFirst({
      where: { isDefault: true },
      include: { rates: true },
    });
  }
}
```

#### tRPC Router (`apps/api/src/trpc/routers/shipping.router.ts`)
```typescript
export const shippingRouter = router({
  listZones: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.shippingService.getZonesWithRates();
    }),

  createZone: protectedProcedure
    .input(CreateShippingZoneSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.shippingService.createZone(input);
    }),

  updateZone: protectedProcedure
    .input(CreateShippingZoneSchema.extend({ id: ShippingZoneIdSchema }))
    .mutation(async ({ ctx, input }) => {
      return ctx.shippingService.updateZone(input.id, input);
    }),

  createRate: protectedProcedure
    .input(CreateShippingRateSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.shippingService.createRate(input);
    }),

  deleteZone: protectedProcedure
    .input(z.object({ id: ShippingZoneIdSchema }))
    .mutation(async ({ ctx, input }) => {
      return ctx.shippingService.deleteZone(input.id);
    }),
});
```

#### Dashboard Data Flow
```
┌─────────────────────────────────────────────────────────────────────┐
│ Settings > Shipping Page (RSC)                                      │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ ShippingZonesTable (Client Component)                           │ │
│ │   ├─ useShippingZones() hook                                    │ │
│ │   │   └─ useServerActionQuery(getZonesAction)                   │ │
│ │   │       └─ Server Action → tRPC → ShippingService             │ │
│ │   │                                                             │ │
│ │   └─ DataTable with columns:                                    │ │
│ │       [Zone Name] [Countries] [Methods] [Actions]               │ │
│ │                                                                 │ │
│ │   Actions: Edit Zone | Add Rate | Delete Zone                   │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ ZoneDialog (Client - opens on Create/Edit)                      │ │
│ │   ├─ Zone name input                                            │ │
│ │   ├─ CountriesSelect (searchable multi-select)                  │ │
│ │   ├─ "Set as default zone" checkbox                             │ │
│ │   └─ Save → createZoneAction/updateZoneAction                   │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ RateDialog (Client - opens on Add Rate)                         │ │
│ │   ├─ Rate name (e.g., "Standard Shipping")                      │ │
│ │   ├─ Rate type: Flat / Weight-based / Price-based               │ │
│ │   ├─ Price input (cents converted for display)                  │ │
│ │   ├─ Free shipping threshold (optional)                         │ │
│ │   ├─ Estimated delivery days (min/max)                          │ │
│ │   └─ Save → createRateAction                                    │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

#### Server Action (`apps/dashboard/src/app/(dashboard)/settings/shipping/_actions/create-zone.ts`)
```typescript
'use server';

import { createServerActionProcedure } from 'zsa';
import { CreateShippingZoneSchema } from '@trafi/validators';
import { trpc } from '@/lib/trpc/server';

export const createZoneAction = createServerActionProcedure()
  .input(CreateShippingZoneSchema)
  .handler(async ({ input }) => {
    const zone = await trpc.shipping.createZone(input);
    revalidatePath('/settings/shipping');
    return zone;
  });
```

#### Custom Hook (`apps/dashboard/src/app/(dashboard)/settings/shipping/_hooks/use-shipping-zones.ts`)
```typescript
'use client';

import { useServerActionQuery, useServerActionMutation } from 'zsa-react';
import { getZonesAction, createZoneAction, deleteZoneAction } from '../_actions';

export function useShippingZones() {
  const { data: zones, isLoading, refetch } = useServerActionQuery(getZonesAction);

  const createZone = useServerActionMutation(createZoneAction, {
    onSuccess: () => refetch(),
  });

  const deleteZone = useServerActionMutation(deleteZoneAction, {
    onSuccess: () => refetch(),
  });

  return { zones, isLoading, createZone, deleteZone, refetch };
}
```

#### UX Implementation Notes
- **Breadcrumb**: Dashboard > Settings > Shipping (UX-3)
- **Layout**: Rail + Sidebar + Main content (UX-2)
- **DataTable**: Sortable columns, expandable rows to show rates (UX-8)
- **Countries Select**: Searchable with flag icons, grouped by continent
- **Default Zone**: Visual indicator (badge) for the fallback zone
- **Rate Display**: Show price formatted from cents, delivery estimate range
- **Validation**: Prevent deleting default zone, require at least one zone

---

## Story 4.5: Shipping Rate Calculation

As a **System**,
I want **to calculate shipping rates based on cart and destination**,
So that **buyers see accurate shipping costs early**.

**Acceptance Criteria:**

**Given** a cart with items and a destination address
**When** shipping rates are requested
**Then** the system returns:
- All available shipping methods for the zone
- Calculated price per method
- Estimated delivery timeframe per method
**And** rates are calculated based on cart weight/value
**And** free shipping is applied when threshold is met
**And** calculation completes in < 200ms

### Technical Implementation

#### Zod Schemas (`@trafi/validators`)
```typescript
// packages/validators/src/shipping.ts
export const ShippingCalculationInputSchema = z.object({
  cartId: CartIdSchema,
  countryCode: z.string().length(2),
  postalCode: z.string().optional(),
});

export const CalculatedShippingRateSchema = z.object({
  rateId: ShippingRateIdSchema,
  name: z.string(),
  price: z.number().int(),              // Cents (ARCH-25)
  originalPrice: z.number().int(),       // Before free shipping discount
  isFree: z.boolean(),
  estimatedDaysMin: z.number().int(),
  estimatedDaysMax: z.number().int(),
  estimatedDeliveryDate: z.object({
    min: z.date(),
    max: z.date(),
  }),
});

export const ShippingCalculationResultSchema = z.object({
  zoneId: ShippingZoneIdSchema,
  zoneName: z.string(),
  availableRates: z.array(CalculatedShippingRateSchema),
  recommendedRateId: ShippingRateIdSchema.optional(), // Cheapest or fastest
});
```

#### Backend Service (`apps/api/src/shipping/shipping.service.ts`)
```typescript
@Injectable()
export class ShippingService {
  // Protected for @trafi/core extensibility (RETRO-2)
  protected async calculateRates(
    input: ShippingCalculationInput,
  ): Promise<ShippingCalculationResult> {
    const [cart, zone] = await Promise.all([
      this.cartService.getCartWithItems(input.cartId),
      this.findZoneForCountry(input.countryCode),
    ]);

    if (!zone) {
      throw new BadRequestException('Shipping not available to this location');
    }

    const cartValue = this.calculateCartValue(cart);
    const cartWeight = this.calculateCartWeight(cart);

    const availableRates = zone.rates.map((rate) => {
      const calculatedPrice = this.calculateRatePrice(rate, cartValue, cartWeight);
      const isFree = rate.minOrderValue && cartValue >= rate.minOrderValue;

      return {
        rateId: rate.id,
        name: rate.name,
        price: isFree ? 0 : calculatedPrice,
        originalPrice: calculatedPrice,
        isFree,
        estimatedDaysMin: rate.estimatedDaysMin,
        estimatedDaysMax: rate.estimatedDaysMax,
        estimatedDeliveryDate: this.calculateDeliveryDate(
          rate.estimatedDaysMin,
          rate.estimatedDaysMax,
        ),
      };
    });

    // Sort by price, recommend cheapest
    availableRates.sort((a, b) => a.price - b.price);

    return {
      zoneId: zone.id,
      zoneName: zone.name,
      availableRates,
      recommendedRateId: availableRates[0]?.rateId,
    };
  }

  protected calculateRatePrice(
    rate: ShippingRate,
    cartValue: number,
    cartWeight: number,
  ): number {
    switch (rate.type) {
      case 'flat':
        return rate.price;

      case 'weight_based':
        // Price per kg, rounded up
        const weightKg = Math.ceil(cartWeight / 1000);
        return rate.price * weightKg;

      case 'price_based':
        // Percentage of cart value
        return Math.round(cartValue * (rate.price / 10000));

      default:
        return rate.price;
    }
  }

  protected calculateDeliveryDate(
    minDays: number,
    maxDays: number,
  ): { min: Date; max: Date } {
    const today = new Date();
    return {
      min: addBusinessDays(today, minDays),
      max: addBusinessDays(today, maxDays),
    };
  }

  // Quick estimate without full address (for cart preview)
  protected async getQuickEstimate(cartId: string): Promise<QuickEstimate | null> {
    // Use GeoIP or default zone for rough estimate
    const defaultZone = await this.prisma.shippingZone.findFirst({
      where: { isDefault: true },
      include: { rates: { take: 1, orderBy: { price: 'asc' } } },
    });

    if (!defaultZone?.rates[0]) return null;

    return {
      minDays: defaultZone.rates[0].estimatedDaysMin,
      maxDays: defaultZone.rates[0].estimatedDaysMax,
      price: defaultZone.rates[0].price,
    };
  }
}
```

#### tRPC Router (`apps/api/src/trpc/routers/shipping.router.ts`)
```typescript
export const shippingRouter = router({
  calculateRates: publicProcedure
    .input(ShippingCalculationInputSchema)
    .query(async ({ ctx, input }) => {
      return ctx.shippingService.calculateRates(input);
    }),

  quickEstimate: publicProcedure
    .input(z.object({ cartId: CartIdSchema }))
    .query(async ({ ctx, input }) => {
      return ctx.shippingService.getQuickEstimate(input.cartId);
    }),
});
```

#### Storefront Data Flow
```
┌────────────────────────────────────────────────────────────────────┐
│ Checkout Page - Shipping Step                                       │
│ ┌────────────────────────────────────────────────────────────────┐ │
│ │ AddressForm (Client Component)                                 │ │
│ │   └─ onCountryChange/onPostalCodeChange:                       │ │
│ │       │                                                        │ │
│ │       ▼                                                        │ │
│ │   trpc.shipping.calculateRates.useQuery({                      │ │
│ │     cartId, countryCode, postalCode                            │ │
│ │   })                                                           │ │
│ │       │                                                        │ │
│ │       ▼                                                        │ │
│ │   ShippingMethodSelector updates with available rates          │ │
│ └────────────────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────────────────┐ │
│ │ ShippingMethodSelector (Client Component)                      │ │
│ │   ├─ Radio group of available shipping methods                 │ │
│ │   ├─ Each option shows: name, price, delivery estimate         │ │
│ │   ├─ Free shipping badge when threshold met                    │ │
│ │   └─ Recommended rate pre-selected                             │ │
│ └────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

#### Shipping Method Selector (`apps/storefront/src/components/checkout/shipping-method-selector.tsx`)
```typescript
'use client';

export function ShippingMethodSelector({
  cartId,
  countryCode,
  postalCode,
  onSelect,
}: ShippingMethodSelectorProps) {
  const { data, isLoading } = trpc.shipping.calculateRates.useQuery(
    { cartId, countryCode, postalCode },
    { enabled: !!countryCode },
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Auto-select recommended rate
  useEffect(() => {
    if (data?.recommendedRateId && !selectedId) {
      setSelectedId(data.recommendedRateId);
      onSelect(data.recommendedRateId);
    }
  }, [data?.recommendedRateId]);

  if (isLoading) {
    return <Skeleton className="h-32" />;
  }

  if (!data?.availableRates.length) {
    return <p className="text-muted-foreground">No shipping available</p>;
  }

  return (
    <RadioGroup value={selectedId} onValueChange={(id) => {
      setSelectedId(id);
      onSelect(id);
    }}>
      {data.availableRates.map((rate) => (
        <div key={rate.rateId} className="flex items-center space-x-3 p-4 border rounded-lg">
          <RadioGroupItem value={rate.rateId} id={rate.rateId} />
          <Label htmlFor={rate.rateId} className="flex-1 cursor-pointer">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{rate.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDeliveryDate(rate.estimatedDeliveryDate)}
                </p>
              </div>
              <div className="text-right">
                {rate.isFree ? (
                  <Badge variant="success">Free</Badge>
                ) : (
                  <span className="font-medium">{formatCents(rate.price)}</span>
                )}
              </div>
            </div>
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}
```

#### UX Implementation Notes
- **Performance**: Calculation cached for 5 minutes per cart+destination combo
- **Free Shipping**: Strike through original price, show "Free" badge in green
- **Delivery Dates**: Show range like "Wed, Jan 15 - Fri, Jan 17"
- **Loading State**: Skeleton while calculating (max 200ms target)
- **Error State**: "Shipping not available to this location" with support link
- **Recommended**: Pre-select cheapest option, but show all available

---

## Story 4.6: Tax Calculation Engine

As a **System**,
I want **to calculate applicable taxes based on buyer location**,
So that **prices are legally compliant and transparent**.

**Acceptance Criteria:**

**Given** a cart and buyer location
**When** taxes are calculated
**Then** the system applies:
- Tax rules based on destination country/region
- Product-specific tax categories
- Tax-inclusive or tax-exclusive display per store config
**And** tax breakdown is visible in cart and checkout
**And** calculation handles EU VAT requirements
**And** tax amounts are stored in cents

### Technical Implementation

#### File Structure
```
apps/api/src/
├── tax/
│   ├── tax.module.ts
│   ├── tax.service.ts                 # Tax calculation engine
│   ├── tax-rates.service.ts           # Tax rate lookups
│   ├── dto/
│   │   ├── calculate-tax.dto.ts
│   │   └── tax-breakdown.dto.ts
│   └── data/
│       └── tax-rates.ts               # Default tax rates by region

apps/dashboard/src/app/(dashboard)/settings/taxes/
├── page.tsx
├── _components/
│   ├── tax-settings-form.tsx          # Tax display configuration
│   ├── tax-rates-table.tsx            # Custom tax rate overrides
│   └── tax-categories-list.tsx        # Product tax categories
```

#### Zod Schemas (`@trafi/validators`)
```typescript
// packages/validators/src/tax.ts
export const TaxCategorySchema = z.enum([
  'standard',
  'reduced',
  'zero',
  'exempt',
  'digital_goods',
  'food_beverage',
]);

export const TaxCalculationInputSchema = z.object({
  cartId: CartIdSchema,
  shippingAddress: z.object({
    countryCode: z.string().length(2),
    stateCode: z.string().optional(),
    postalCode: z.string().optional(),
  }),
  shippingPrice: z.number().int().optional(), // Cents
});

export const TaxLineItemSchema = z.object({
  productId: z.string().startsWith('prod_'),
  variantId: z.string().startsWith('var_'),
  taxCategory: TaxCategorySchema,
  taxableAmount: z.number().int(),       // Cents (ARCH-25)
  taxRate: z.number(),                    // Decimal (e.g., 0.20 for 20%)
  taxAmount: z.number().int(),            // Cents
  taxName: z.string(),                    // e.g., "VAT", "Sales Tax"
});

export const TaxCalculationResultSchema = z.object({
  subtotal: z.number().int(),             // Cents
  shippingTax: z.number().int(),          // Cents
  lineItems: z.array(TaxLineItemSchema),
  totalTax: z.number().int(),             // Cents
  taxInclusive: z.boolean(),              // Whether prices include tax
  taxBreakdown: z.array(z.object({
    name: z.string(),
    rate: z.number(),
    amount: z.number().int(),
  })),
});
```

#### Backend Service (`apps/api/src/tax/tax.service.ts`)
```typescript
@Injectable()
export class TaxService {
  constructor(
    private prisma: PrismaService,
    private taxRatesService: TaxRatesService,
  ) {}

  // Protected for @trafi/core extensibility (RETRO-2)
  protected async calculateTax(
    input: TaxCalculationInput,
  ): Promise<TaxCalculationResult> {
    const cart = await this.prisma.cart.findUnique({
      where: { id: input.cartId },
      include: {
        items: {
          include: {
            variant: {
              include: { product: { select: { taxCategory: true } } },
            },
          },
        },
      },
    });

    const store = await this.getStoreSettings();
    const taxInclusive = store.pricesIncludeTax;

    // Get applicable tax rate for destination
    const taxRate = await this.taxRatesService.getRateForLocation(
      input.shippingAddress,
    );

    const lineItems: TaxLineItem[] = [];
    let totalTax = 0;

    for (const item of cart.items) {
      const category = item.variant.product.taxCategory ?? 'standard';
      const categoryRate = this.getCategoryRate(taxRate, category);

      const taxableAmount = item.priceAtAddition * item.quantity;
      const taxAmount = this.calculateTaxAmount(
        taxableAmount,
        categoryRate,
        taxInclusive,
      );

      lineItems.push({
        productId: item.variant.productId,
        variantId: item.variantId,
        taxCategory: category,
        taxableAmount,
        taxRate: categoryRate,
        taxAmount,
        taxName: taxRate.name,
      });

      totalTax += taxAmount;
    }

    // Calculate shipping tax (if applicable)
    const shippingTax = input.shippingPrice
      ? this.calculateTaxAmount(input.shippingPrice, taxRate.shippingRate, taxInclusive)
      : 0;

    totalTax += shippingTax;

    // Build tax breakdown for display
    const taxBreakdown = this.buildTaxBreakdown(lineItems, shippingTax);

    return {
      subtotal: cart.items.reduce((sum, i) => sum + i.priceAtAddition * i.quantity, 0),
      shippingTax,
      lineItems,
      totalTax,
      taxInclusive,
      taxBreakdown,
    };
  }

  protected calculateTaxAmount(
    amount: number,
    rate: number,
    inclusive: boolean,
  ): number {
    if (inclusive) {
      // Extract tax from inclusive price: price / (1 + rate) * rate
      return Math.round(amount - amount / (1 + rate));
    } else {
      // Add tax to exclusive price: price * rate
      return Math.round(amount * rate);
    }
  }

  protected getCategoryRate(taxRate: TaxRate, category: TaxCategory): number {
    switch (category) {
      case 'exempt':
      case 'zero':
        return 0;
      case 'reduced':
        return taxRate.reducedRate ?? taxRate.standardRate;
      case 'digital_goods':
        return taxRate.digitalRate ?? taxRate.standardRate;
      case 'food_beverage':
        return taxRate.foodRate ?? taxRate.reducedRate ?? taxRate.standardRate;
      default:
        return taxRate.standardRate;
    }
  }

  // Quick estimate for cart display (before address known)
  protected async estimateForCart(
    cartId: string,
    subtotal: number,
  ): Promise<number> {
    const store = await this.getStoreSettings();
    // Use store's default tax rate for estimate
    const defaultRate = store.defaultTaxRate ?? 0;
    return Math.round(subtotal * defaultRate);
  }
}
```

#### Tax Rates Service (`apps/api/src/tax/tax-rates.service.ts`)
```typescript
@Injectable()
export class TaxRatesService {
  // EU VAT rates built-in
  private readonly EU_VAT_RATES: Record<string, TaxRate> = {
    FR: { name: 'TVA', standardRate: 0.20, reducedRate: 0.055, shippingRate: 0.20 },
    DE: { name: 'MwSt', standardRate: 0.19, reducedRate: 0.07, shippingRate: 0.19 },
    ES: { name: 'IVA', standardRate: 0.21, reducedRate: 0.10, shippingRate: 0.21 },
    IT: { name: 'IVA', standardRate: 0.22, reducedRate: 0.10, shippingRate: 0.22 },
    // ... other EU countries
  };

  // Protected for @trafi/core extensibility (RETRO-2)
  protected async getRateForLocation(
    address: { countryCode: string; stateCode?: string },
  ): Promise<TaxRate> {
    // 1. Check for custom rate override in store settings
    const customRate = await this.prisma.taxRateOverride.findFirst({
      where: {
        countryCode: address.countryCode,
        stateCode: address.stateCode ?? null,
      },
    });

    if (customRate) {
      return customRate;
    }

    // 2. Use built-in EU VAT rates
    if (this.EU_VAT_RATES[address.countryCode]) {
      return this.EU_VAT_RATES[address.countryCode];
    }

    // 3. US sales tax (would need Avalara/TaxJar integration for accuracy)
    if (address.countryCode === 'US') {
      return this.getUSSalesTax(address.stateCode);
    }

    // 4. Default: no tax
    return { name: 'Tax', standardRate: 0, shippingRate: 0 };
  }
}
```

#### tRPC Router (`apps/api/src/trpc/routers/tax.router.ts`)
```typescript
export const taxRouter = router({
  calculate: publicProcedure
    .input(TaxCalculationInputSchema)
    .query(async ({ ctx, input }) => {
      return ctx.taxService.calculateTax(input);
    }),

  estimate: publicProcedure
    .input(z.object({ cartId: CartIdSchema, subtotal: z.number().int() }))
    .query(async ({ ctx, input }) => {
      return ctx.taxService.estimateForCart(input.cartId, input.subtotal);
    }),
});
```

#### Dashboard Data Flow (Tax Settings)
```
┌─────────────────────────────────────────────────────────────────────┐
│ Settings > Taxes Page (RSC)                                         │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ TaxSettingsForm (Client Component)                              │ │
│ │   ├─ "Prices include tax" toggle                                │ │
│ │   ├─ Default tax rate input                                     │ │
│ │   ├─ Tax display format (e.g., "incl. VAT", "excl. tax")        │ │
│ │   └─ Save → updateTaxSettingsAction                             │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ TaxRatesTable (Client Component)                                │ │
│ │   ├─ DataTable of tax rate overrides                            │ │
│ │   ├─ Add custom rate for specific country/region                │ │
│ │   └─ Built-in EU VAT rates shown (read-only)                    │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ TaxCategoriesList (Client Component)                            │ │
│ │   ├─ List of available tax categories                           │ │
│ │   └─ Products can be assigned to categories                     │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

#### Tax Display Component (`apps/storefront/src/components/checkout/tax-breakdown.tsx`)
```typescript
'use client';

export function TaxBreakdown({ taxResult }: TaxBreakdownProps) {
  if (!taxResult.totalTax) {
    return null;
  }

  return (
    <div className="space-y-2">
      {taxResult.taxBreakdown.map((tax, index) => (
        <div key={index} className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {tax.name} ({(tax.rate * 100).toFixed(0)}%)
          </span>
          <span>{formatCents(tax.amount)}</span>
        </div>
      ))}
      {taxResult.taxInclusive && (
        <p className="text-xs text-muted-foreground">
          Prices include tax
        </p>
      )}
    </div>
  );
}
```

#### UX Implementation Notes
- **Tax Inclusive Display**: When prices include tax, show "(incl. VAT)" next to prices
- **Tax Breakdown**: In checkout summary, show each tax type separately (e.g., VAT 20%, Reduced 5.5%)
- **EU Compliance**: Support MOSS (Mini One-Stop Shop) for digital goods
- **Rounding**: All tax amounts rounded to nearest cent, with rounding adjustments tracked
- **Performance**: Tax rates cached per country/state combo, recalculated when cart changes
- **Error Handling**: If tax cannot be calculated, show estimate with disclaimer

---

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

## Story 4.8: Checkout Flow - Address and Shipping Selection

As a **Buyer (Emma)**,
I want **to enter my shipping address and select delivery method**,
So that **I know when and how my order will arrive**.

**Acceptance Criteria:**

**Given** a buyer is in checkout
**When** they enter shipping address
**Then** address autocomplete helps speed entry
**And** available shipping methods update based on address
**And** shipping costs and delivery estimates are shown
**And** selected method is highlighted with price and timeframe
**And** address validation prevents invalid submissions

### Technical Implementation

#### File Structure
```
apps/storefront/src/app/checkout/_components/
├── shipping-step.tsx                  # Step 2: Address + Shipping
├── address-form.tsx                   # Address input with autocomplete
├── address-autocomplete.tsx           # Google Places integration
└── saved-addresses-list.tsx           # For logged-in users

apps/api/src/
├── address/
│   ├── address.module.ts
│   ├── address-validation.service.ts  # Address verification
│   └── google-places.service.ts       # Places API integration
```

#### Zod Schemas (`@trafi/validators`)
```typescript
// packages/validators/src/address.ts
export const AddressAutocompleteInputSchema = z.object({
  query: z.string().min(3),
  countryCode: z.string().length(2).optional(),
  sessionToken: z.string(), // Google Places session token
});

export const AddressAutocompleteResultSchema = z.object({
  placeId: z.string(),
  description: z.string(),
  mainText: z.string(),
  secondaryText: z.string(),
});

export const AddressValidationInputSchema = z.object({
  address: CheckoutShippingAddressSchema,
});

export const AddressValidationResultSchema = z.object({
  isValid: z.boolean(),
  normalizedAddress: CheckoutShippingAddressSchema.optional(),
  suggestions: z.array(CheckoutShippingAddressSchema).optional(),
  errors: z.array(z.object({
    field: z.string(),
    message: z.string(),
  })).optional(),
});
```

#### Backend Service (`apps/api/src/address/address-validation.service.ts`)
```typescript
@Injectable()
export class AddressValidationService {
  constructor(private googlePlaces: GooglePlacesService) {}

  // Protected for @trafi/core extensibility (RETRO-2)
  protected async validateAddress(
    address: ShippingAddress,
  ): Promise<AddressValidationResult> {
    // Basic format validation
    const formatErrors = this.validateFormat(address);
    if (formatErrors.length) {
      return { isValid: false, errors: formatErrors };
    }

    // Validate postal code format for country
    const postalValid = this.validatePostalCode(
      address.postalCode,
      address.countryCode,
    );
    if (!postalValid) {
      return {
        isValid: false,
        errors: [{ field: 'postalCode', message: 'Invalid postal code format' }],
      };
    }

    // Optional: Use Google Address Validation API for accuracy
    if (this.googlePlaces.isEnabled()) {
      const normalized = await this.googlePlaces.validateAddress(address);
      if (normalized) {
        return {
          isValid: true,
          normalizedAddress: normalized,
        };
      }
    }

    return { isValid: true };
  }

  protected async autocomplete(
    input: AddressAutocompleteInput,
  ): Promise<AddressAutocompleteResult[]> {
    return this.googlePlaces.autocomplete({
      input: input.query,
      sessionToken: input.sessionToken,
      types: ['address'],
      componentRestrictions: input.countryCode
        ? { country: input.countryCode }
        : undefined,
    });
  }

  protected async getPlaceDetails(
    placeId: string,
    sessionToken: string,
  ): Promise<ShippingAddress> {
    const details = await this.googlePlaces.getPlaceDetails(placeId, sessionToken);
    return this.mapPlaceToAddress(details);
  }

  private validatePostalCode(postalCode: string, countryCode: string): boolean {
    const patterns: Record<string, RegExp> = {
      FR: /^\d{5}$/,
      US: /^\d{5}(-\d{4})?$/,
      GB: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i,
      DE: /^\d{5}$/,
      // Add more as needed
    };
    const pattern = patterns[countryCode];
    return !pattern || pattern.test(postalCode);
  }
}
```

#### tRPC Router (`apps/api/src/trpc/routers/address.router.ts`)
```typescript
export const addressRouter = router({
  autocomplete: publicProcedure
    .input(AddressAutocompleteInputSchema)
    .query(async ({ ctx, input }) => {
      return ctx.addressValidationService.autocomplete(input);
    }),

  getPlaceDetails: publicProcedure
    .input(z.object({ placeId: z.string(), sessionToken: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.addressValidationService.getPlaceDetails(
        input.placeId,
        input.sessionToken,
      );
    }),

  validate: publicProcedure
    .input(AddressValidationInputSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.addressValidationService.validateAddress(input.address);
    }),
});
```

#### Storefront Data Flow
```
┌────────────────────────────────────────────────────────────────────────┐
│ ShippingStep (Client Component)                                        │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ AddressForm                                                        │ │
│ │   ├─ AddressAutocomplete (first name, address line 1)              │ │
│ │   │   └─ On type: trpc.address.autocomplete.useQuery()             │ │
│ │   │   └─ On select: trpc.address.getPlaceDetails.useQuery()        │ │
│ │   │       └─ Auto-fills: address1, city, stateCode, postalCode     │ │
│ │   │                                                                │ │
│ │   ├─ Manual fields (editable after autocomplete):                  │ │
│ │   │   [First Name] [Last Name]                                     │ │
│ │   │   [Address 1] (with autocomplete)                              │ │
│ │   │   [Address 2] (optional)                                       │ │
│ │   │   [City] [State] [Postal Code]                                 │ │
│ │   │   [Country] (dropdown)                                         │ │
│ │   │   [Phone] (optional)                                           │ │
│ │   │                                                                │ │
│ │   └─ onBlur: trpc.address.validate.useMutation()                   │ │
│ │       └─ Shows normalized address suggestion if different          │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ ShippingMethodSelector (appears after valid address)               │ │
│ │   └─ Uses trpc.shipping.calculateRates (from Story 4.5)            │ │
│ │   └─ Auto-selects recommended (cheapest) option                    │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ Continue to Payment Button                                          │ │
│ │   └─ Disabled until address valid + shipping selected              │ │
│ └────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

#### Address Form (`apps/storefront/src/app/checkout/_components/address-form.tsx`)
```typescript
'use client';

export function AddressForm({ onSubmit, defaultValues }: AddressFormProps) {
  const form = useForm<ShippingAddress>({
    resolver: zodResolver(CheckoutShippingAddressSchema),
    defaultValues,
  });

  const [sessionToken] = useState(() => crypto.randomUUID());
  const countryCode = form.watch('countryCode');

  // Address validation on blur
  const validateAddress = trpc.address.validate.useMutation();

  const handleAddressBlur = async () => {
    const address = form.getValues();
    if (!address.address1 || !address.city || !address.postalCode) return;

    const result = await validateAddress.mutateAsync({ address });
    if (result.normalizedAddress) {
      // Show suggestion dialog
      setNormalizedSuggestion(result.normalizedAddress);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input {...field} autoComplete="given-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input {...field} autoComplete="family-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          name="address1"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <AddressAutocomplete
                  {...field}
                  sessionToken={sessionToken}
                  countryCode={countryCode}
                  onSelect={(address) => {
                    form.setValue('address1', address.address1);
                    form.setValue('city', address.city);
                    form.setValue('stateCode', address.stateCode);
                    form.setValue('postalCode', address.postalCode);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ... other fields ... */}

        <FormField
          name="countryCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country</FormLabel>
              <CountrySelect {...field} />
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
```

#### Address Autocomplete (`apps/storefront/src/app/checkout/_components/address-autocomplete.tsx`)
```typescript
'use client';

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  sessionToken,
  countryCode,
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);

  const { data: suggestions } = trpc.address.autocomplete.useQuery(
    { query, sessionToken, countryCode },
    { enabled: query.length >= 3 },
  );

  const getDetails = trpc.address.getPlaceDetails.useMutation();

  const handleSelect = async (placeId: string) => {
    const address = await getDetails.mutateAsync({ placeId, sessionToken });
    onChange(address.address1);
    onSelect(address);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen && !!suggestions?.length} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
          }}
          placeholder="Start typing your address..."
          autoComplete="off"
        />
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        {suggestions?.map((suggestion) => (
          <button
            key={suggestion.placeId}
            onClick={() => handleSelect(suggestion.placeId)}
            className="w-full px-4 py-2 text-left hover:bg-muted"
          >
            <p className="font-medium">{suggestion.mainText}</p>
            <p className="text-sm text-muted-foreground">
              {suggestion.secondaryText}
            </p>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
```

#### UX Implementation Notes
- **Autocomplete**: Uses Google Places API, debounced 300ms, minimum 3 characters
- **Session Token**: Reuse same token for autocomplete + details to reduce API costs
- **Country Pre-select**: Default to store's primary country, allow change
- **Address Validation**: On blur, suggest normalized address if different
- **Shipping Methods**: Auto-refresh when country or postal code changes
- **Error Messages**: Inline validation errors, clear field-specific messages
- **Accessibility**: Proper ARIA labels, keyboard navigation for autocomplete
- **Mobile UX**: Full-width inputs, native country picker, appropriate keyboard types

---

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
