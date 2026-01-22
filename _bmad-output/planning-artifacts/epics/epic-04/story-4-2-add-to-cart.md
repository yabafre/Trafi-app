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

