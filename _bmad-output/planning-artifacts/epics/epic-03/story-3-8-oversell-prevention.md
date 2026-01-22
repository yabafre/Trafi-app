## Story 3.8: Oversell Prevention

As a **System**,
I want **to prevent orders for out-of-stock items**,
So that **customers don't order unavailable products**.

**Acceptance Criteria:**

**Given** a product has inventory tracking enabled
**When** a customer attempts to add to cart or checkout
**Then** the system validates available quantity
**And** out-of-stock items cannot be added to cart
**And** cart quantities exceeding stock are auto-adjusted
**And** concurrent checkout attempts use optimistic locking
**And** Merchant can optionally allow overselling per product

---

### Technical Implementation

#### Zod Schemas (@trafi/validators)
```typescript
// packages/@trafi/validators/src/cart/index.ts
export const AddToCartSchema = z.object({
  variantId: z.string(),
  quantity: z.number().int().positive().max(100),
});

export const CartValidationResultSchema = z.object({
  valid: z.boolean(),
  adjustments: z.array(z.object({
    variantId: z.string(),
    requestedQuantity: z.number(),
    availableQuantity: z.number(),
    adjusted: z.boolean(),
    message: z.string().optional(),
  })),
  outOfStockItems: z.array(z.string()), // Variant IDs
});
```

#### Backend Service (NestJS)
```typescript
// apps/api/src/modules/cart/cart-validation.service.ts
@Injectable()
export class CartValidationService {
  constructor(private prisma: PrismaService) {}

  // Protected for @trafi/core extensibility
  protected async checkAvailability(
    variantId: string,
    requestedQuantity: number,
  ): Promise<{
    available: boolean;
    availableQuantity: number;
    allowOversell: boolean;
  }> {
    const variant = await this.prisma.variant.findUnique({
      where: { id: variantId },
      select: {
        quantity: true,
        trackInventory: true,
        allowOversell: true,
      },
    });

    if (!variant) {
      return { available: false, availableQuantity: 0, allowOversell: false };
    }

    // Not tracking inventory = always available
    if (!variant.trackInventory) {
      return { available: true, availableQuantity: requestedQuantity, allowOversell: true };
    }

    // Allow oversell bypasses stock check
    if (variant.allowOversell) {
      return { available: true, availableQuantity: requestedQuantity, allowOversell: true };
    }

    return {
      available: variant.quantity >= requestedQuantity,
      availableQuantity: variant.quantity,
      allowOversell: false,
    };
  }

  async validateCart(items: { variantId: string; quantity: number }[]): Promise<CartValidationResult> {
    const adjustments = [];
    const outOfStockItems = [];

    for (const item of items) {
      const { available, availableQuantity, allowOversell } = await this.checkAvailability(
        item.variantId,
        item.quantity,
      );

      if (availableQuantity === 0 && !allowOversell) {
        outOfStockItems.push(item.variantId);
        adjustments.push({
          variantId: item.variantId,
          requestedQuantity: item.quantity,
          availableQuantity: 0,
          adjusted: true,
          message: 'Rupture de stock',
        });
      } else if (!available && !allowOversell) {
        adjustments.push({
          variantId: item.variantId,
          requestedQuantity: item.quantity,
          availableQuantity,
          adjusted: true,
          message: `Quantité ajustée à ${availableQuantity}`,
        });
      } else {
        adjustments.push({
          variantId: item.variantId,
          requestedQuantity: item.quantity,
          availableQuantity: item.quantity,
          adjusted: false,
        });
      }
    }

    return {
      valid: outOfStockItems.length === 0 && adjustments.every((a) => !a.adjusted),
      adjustments,
      outOfStockItems,
    };
  }

  // Reserve inventory during checkout (with optimistic locking)
  async reserveInventory(orderId: string, items: { variantId: string; quantity: number }[]) {
    return this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        const variant = await tx.variant.findUnique({
          where: { id: item.variantId },
        });

        if (!variant || (!variant.allowOversell && variant.trackInventory)) {
          // Double-check availability within transaction
          if (variant!.quantity < item.quantity) {
            throw new BadRequestException(
              `Insufficient stock for variant ${item.variantId}`,
            );
          }
        }

        // Decrement inventory
        await tx.variant.update({
          where: { id: item.variantId },
          data: { quantity: { decrement: item.quantity } },
        });

        // Log the reservation
        await tx.inventoryHistory.create({
          data: {
            variantId: item.variantId,
            quantityBefore: variant!.quantity,
            quantityAfter: variant!.quantity - item.quantity,
            quantityChange: -item.quantity,
            reason: 'order_placed',
            note: `Order ${orderId}`,
          },
        });
      }
    }, {
      isolationLevel: 'Serializable',
    });
  }
}
```

#### tRPC Router
```typescript
export const cartRouter = router({
  validate: publicProcedure
    .input(z.object({
      items: z.array(z.object({
        variantId: z.string(),
        quantity: z.number().int().positive(),
      })),
    }))
    .query(({ input, ctx }) => {
      return ctx.cartValidationService.validateCart(input.items);
    }),

  addItem: publicProcedure
    .input(AddToCartSchema)
    .mutation(async ({ input, ctx }) => {
      // Check availability before adding
      const validation = await ctx.cartValidationService.validateCart([input]);

      if (validation.outOfStockItems.length > 0) {
        throw new BadRequestException('Ce produit est en rupture de stock');
      }

      // Add to cart with potentially adjusted quantity
      const adjustedQuantity = validation.adjustments[0].availableQuantity;
      return ctx.cartService.addItem(ctx.sessionId, input.variantId, adjustedQuantity);
    }),
});
```

#### Dashboard Data Flow (Storefront)
```
AddToCartButton.tsx (Client)
  └─► useAddToCart() hook
       └─► useServerActionMutation(addToCartAction)
            └─► trpc.cart.addItem.mutate()
                 └─► CartValidationService.validateCart()
                      └─► If out of stock → throw error
                      └─► If quantity adjusted → return warning
                      └─► If valid → add to cart
```

---

### UX Implementation (Storefront)

- **Add to cart button:** Disabled with "Rupture de stock" text if quantity = 0
- **Quantity selector:** Max value capped at available stock
- **Cart page:** Warning banner if items were auto-adjusted
- **Checkout:** Pre-checkout validation with clear error messages
- **Real-time updates:** Stock quantity updates via React Query polling

### Key Implementation Notes

- **Optimistic locking:** `Serializable` transaction isolation prevents race conditions
- **Inventory reservation:** Stock decremented at checkout, not add-to-cart
- **Allow oversell:** Per-variant flag for pre-orders or made-to-order items
- **Auto-adjustment:** Cart quantities silently adjusted if stock drops between add and checkout
- **Event emission:** `inventory.reserved` event for order processing

---

