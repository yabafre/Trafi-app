## Story 3.7: Inventory Tracking

As a **Merchant**,
I want **to track inventory levels per variant**,
So that **I know what's in stock**.

**Acceptance Criteria:**

**Given** product variants exist
**When** inventory is configured
**Then** the Merchant can:
- Set quantity per variant
- Enable/disable inventory tracking per variant
- Set low stock threshold for alerts
- View inventory history/adjustments
**And** inventory changes are logged with reason
**And** inventory updates are atomic to prevent race conditions

---

### Technical Implementation

#### Zod Schemas (@trafi/validators)
```typescript
// packages/@trafi/validators/src/inventory/index.ts
export const InventoryAdjustmentReasonSchema = z.enum([
  'manual_adjustment',
  'order_placed',
  'order_cancelled',
  'order_refunded',
  'received_stock',
  'damaged',
  'returned',
  'correction',
]);
export type InventoryAdjustmentReason = z.infer<typeof InventoryAdjustmentReasonSchema>;

export const AdjustInventorySchema = z.object({
  variantId: z.string(),
  quantityChange: z.number().int(), // Positive = add, negative = remove
  reason: InventoryAdjustmentReasonSchema,
  note: z.string().max(500).optional(),
});
export type AdjustInventoryInput = z.infer<typeof AdjustInventorySchema>;

export const SetInventorySchema = z.object({
  variantId: z.string(),
  quantity: z.number().int().nonnegative(),
  reason: z.string().max(500).optional(),
});

export const InventoryHistorySchema = z.object({
  id: z.string(),
  variantId: z.string(),
  quantityBefore: z.number(),
  quantityAfter: z.number(),
  quantityChange: z.number(),
  reason: InventoryAdjustmentReasonSchema,
  note: z.string().nullable(),
  createdAt: z.string().datetime(),
  createdBy: z.object({
    id: z.string(),
    name: z.string(),
  }).nullable(),
});
```

#### Backend Service (NestJS)
```typescript
// apps/api/src/modules/inventory/inventory.service.ts
@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  // Protected for @trafi/core extensibility
  protected async adjustInventory(
    variantId: string,
    quantityChange: number,
    reason: string,
    note?: string,
    userId?: string,
  ) {
    // Use transaction with row-level locking to prevent race conditions
    return this.prisma.$transaction(async (tx) => {
      const variant = await tx.variant.findUnique({
        where: { id: variantId },
        select: { id: true, quantity: true, trackInventory: true },
      });

      if (!variant) throw new NotFoundException('Variant not found');
      if (!variant.trackInventory) return variant; // No-op if not tracking

      const newQuantity = variant.quantity + quantityChange;

      // Prevent negative inventory (unless overselling is allowed)
      if (newQuantity < 0) {
        throw new BadRequestException('Insufficient inventory');
      }

      // Update variant
      const updated = await tx.variant.update({
        where: { id: variantId },
        data: { quantity: newQuantity },
      });

      // Log the adjustment
      await tx.inventoryHistory.create({
        data: {
          variantId,
          quantityBefore: variant.quantity,
          quantityAfter: newQuantity,
          quantityChange,
          reason,
          note,
          createdById: userId,
        },
      });

      // Emit low stock event if applicable
      if (newQuantity <= (updated.lowStockThreshold || 5)) {
        this.eventEmitter.emit('inventory.low_stock', { variant: updated });
      }

      return updated;
    }, {
      isolationLevel: 'Serializable', // Strongest isolation for inventory
    });
  }

  async getHistory(storeId: string, variantId: string, page: number = 1) {
    // Verify variant belongs to store
    const variant = await this.prisma.variant.findUnique({
      where: { id: variantId },
      include: { product: { select: { storeId: true } } },
    });

    if (!variant || variant.product.storeId !== storeId) {
      throw new NotFoundException('Variant not found');
    }

    return this.prisma.inventoryHistory.findMany({
      where: { variantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      skip: (page - 1) * 50,
      include: { createdBy: { select: { id: true, name: true } } },
    });
  }
}
```

#### tRPC Router
```typescript
export const inventoryRouter = router({
  adjust: protectedProcedure
    .input(AdjustInventorySchema)
    .mutation(({ input, ctx }) => {
      ctx.requirePermission('products:update');
      return ctx.inventoryService.adjustInventory(
        input.variantId,
        input.quantityChange,
        input.reason,
        input.note,
        ctx.userId,
      );
    }),

  set: protectedProcedure
    .input(SetInventorySchema)
    .mutation(async ({ input, ctx }) => {
      ctx.requirePermission('products:update');
      // Calculate the change from current quantity
      const variant = await ctx.prisma.variant.findUnique({
        where: { id: input.variantId },
      });
      const change = input.quantity - (variant?.quantity || 0);
      return ctx.inventoryService.adjustInventory(
        input.variantId,
        change,
        'manual_adjustment',
        input.reason,
        ctx.userId,
      );
    }),

  history: protectedProcedure
    .input(z.object({ variantId: z.string(), page: z.number().default(1) }))
    .query(({ input, ctx }) => {
      ctx.requirePermission('products:read');
      return ctx.inventoryService.getHistory(ctx.storeId, input.variantId, input.page);
    }),
});
```

---

### UX Implementation

- **Quantity input:** Number stepper or direct input
- **Low stock threshold:** Configurable per variant (default 5)
- **Stock indicators:** Green (> threshold), Amber (≤ threshold), Red (= 0)
- **History panel:** Timeline showing all adjustments with reason and user
- **Quick adjust:** +/- buttons for common operations
- **Bulk adjust:** Multi-select variants, enter adjustment for all

---

