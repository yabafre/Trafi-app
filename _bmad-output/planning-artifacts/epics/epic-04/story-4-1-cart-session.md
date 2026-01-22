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

