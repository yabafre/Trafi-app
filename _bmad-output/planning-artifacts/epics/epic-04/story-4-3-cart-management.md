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

