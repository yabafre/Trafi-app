## Story 3.2: Product Variants Management

As a **Merchant**,
I want **to create product variants with different options**,
So that **customers can choose size, color, or other attributes**.

**Acceptance Criteria:**

**Given** a product exists
**When** the Merchant adds variants
**Then** they can define:
- Variant options (e.g., Size: S, M, L)
- SKU per variant
- Individual pricing per variant (in cents)
- Individual inventory per variant
**And** variants inherit product defaults when not specified
**And** at least one variant is required for purchasable products

---

### Technical Implementation

#### File Structure (within product detail page)
```
apps/dashboard/src/app/(dashboard)/products/[productId]/
├── _components/
│   ├── VariantsSection.tsx           # Client - Variants manager
│   ├── VariantRow.tsx                # Client - Single variant row
│   ├── VariantOptionsManager.tsx     # Client - Option types (Size, Color)
│   ├── CreateVariantDialog.tsx       # Client - Add variant modal
│   └── BulkVariantGenerator.tsx      # Client - Generate combinations

apps/api/src/modules/variants/
├── variants.module.ts
├── variants.service.ts               # protected methods
├── variants.router.ts                # tRPC router
└── dto/
    └── variant.dto.ts
```

#### Zod Schemas (@trafi/validators)
```typescript
// packages/@trafi/validators/src/variant/index.ts
import { z } from 'zod';

export const VariantOptionSchema = z.object({
  name: z.string().min(1).max(50),     // "Size", "Color"
  value: z.string().min(1).max(100),   // "M", "Blue"
});
export type VariantOption = z.infer<typeof VariantOptionSchema>;

export const CreateVariantSchema = z.object({
  productId: z.string(),
  sku: z.string().max(100).optional(),
  options: z.array(VariantOptionSchema).min(1).max(3),
  priceInCents: z.number().int().positive(), // ARCH-25: cents
  compareAtPriceInCents: z.number().int().positive().optional(),
  costPriceInCents: z.number().int().nonnegative().optional(),
  quantity: z.number().int().nonnegative().default(0),
  trackInventory: z.boolean().default(true),
  weight: z.number().nonnegative().optional(),
  weightUnit: z.enum(['g', 'kg', 'oz', 'lb']).default('g'),
});
export type CreateVariantInput = z.infer<typeof CreateVariantSchema>;

export const UpdateVariantSchema = CreateVariantSchema.partial().extend({
  id: z.string(),
});
export type UpdateVariantInput = z.infer<typeof UpdateVariantSchema>;

export const BulkCreateVariantsSchema = z.object({
  productId: z.string(),
  optionTypes: z.array(z.object({
    name: z.string(),                  // "Size"
    values: z.array(z.string()),       // ["S", "M", "L"]
  })).min(1).max(3),
  defaultPriceInCents: z.number().int().positive(),
});
export type BulkCreateVariantsInput = z.infer<typeof BulkCreateVariantsSchema>;

export const VariantResponseSchema = z.object({
  id: z.string(), // var_xxx
  productId: z.string(),
  sku: z.string().nullable(),
  options: z.array(VariantOptionSchema),
  priceInCents: z.number(),
  compareAtPriceInCents: z.number().nullable(),
  costPriceInCents: z.number().nullable(),
  quantity: z.number(),
  trackInventory: z.boolean(),
  createdAt: z.string().datetime(),
});
export type VariantResponse = z.infer<typeof VariantResponseSchema>;
```

#### Backend Service (NestJS)
```typescript
// apps/api/src/modules/variants/variants.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { createId } from '@paralleldrive/cuid2';
import type {
  CreateVariantInput,
  UpdateVariantInput,
  BulkCreateVariantsInput,
} from '@trafi/validators';

@Injectable()
export class VariantsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  protected generateVariantId(): string {
    return `var_${createId()}`;
  }

  // Generate SKU from options if not provided
  protected generateSku(productTitle: string, options: { name: string; value: string }[]): string {
    const prefix = productTitle.substring(0, 3).toUpperCase();
    const optionPart = options.map(o => o.value.substring(0, 2).toUpperCase()).join('-');
    return `${prefix}-${optionPart}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  }

  protected validateOptionsUnique(existingVariants: any[], newOptions: any[]) {
    const optionsKey = JSON.stringify(newOptions.sort((a, b) => a.name.localeCompare(b.name)));
    const exists = existingVariants.some(v =>
      JSON.stringify(v.options.sort((a, b) => a.name.localeCompare(b.name))) === optionsKey
    );
    if (exists) {
      throw new BadRequestException('A variant with these options already exists');
    }
  }

  async create(storeId: string, input: CreateVariantInput) {
    const product = await this.prisma.product.findUnique({
      where: { id: input.productId, storeId },
      include: { variants: true },
    });

    if (!product) throw new BadRequestException('Product not found');

    this.validateOptionsUnique(product.variants, input.options);

    const variant = await this.prisma.variant.create({
      data: {
        id: this.generateVariantId(),
        productId: input.productId,
        sku: input.sku || this.generateSku(product.title, input.options),
        options: input.options,
        priceInCents: input.priceInCents,
        compareAtPriceInCents: input.compareAtPriceInCents,
        costPriceInCents: input.costPriceInCents,
        quantity: input.quantity,
        trackInventory: input.trackInventory,
        weight: input.weight,
        weightUnit: input.weightUnit,
      },
    });

    this.eventEmitter.emit('variant.created', { variant, product });
    return variant;
  }

  async bulkCreate(storeId: string, input: BulkCreateVariantsInput) {
    const product = await this.prisma.product.findUnique({
      where: { id: input.productId, storeId },
    });

    if (!product) throw new BadRequestException('Product not found');

    // Generate all combinations
    const combinations = this.generateCombinations(input.optionTypes);

    const variants = await this.prisma.$transaction(
      combinations.map((options) =>
        this.prisma.variant.create({
          data: {
            id: this.generateVariantId(),
            productId: input.productId,
            sku: this.generateSku(product.title, options),
            options,
            priceInCents: input.defaultPriceInCents,
            quantity: 0,
            trackInventory: true,
          },
        })
      )
    );

    this.eventEmitter.emit('variants.bulk_created', { variants, product });
    return variants;
  }

  private generateCombinations(optionTypes: { name: string; values: string[] }[]) {
    if (optionTypes.length === 0) return [];

    let combinations: { name: string; value: string }[][] = [[]];

    for (const optionType of optionTypes) {
      const newCombinations: { name: string; value: string }[][] = [];
      for (const combo of combinations) {
        for (const value of optionType.values) {
          newCombinations.push([...combo, { name: optionType.name, value }]);
        }
      }
      combinations = newCombinations;
    }

    return combinations;
  }

  async update(storeId: string, input: UpdateVariantInput) {
    const { id, ...data } = input;

    const variant = await this.prisma.variant.findUnique({
      where: { id },
      include: { product: true },
    });

    if (!variant || variant.product.storeId !== storeId) {
      throw new BadRequestException('Variant not found');
    }

    const updated = await this.prisma.variant.update({
      where: { id },
      data,
    });

    this.eventEmitter.emit('variant.updated', { variant: updated });
    return updated;
  }

  async delete(storeId: string, variantId: string) {
    const variant = await this.prisma.variant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });

    if (!variant || variant.product.storeId !== storeId) {
      throw new BadRequestException('Variant not found');
    }

    // Ensure at least one variant remains
    const count = await this.prisma.variant.count({
      where: { productId: variant.productId },
    });

    if (count <= 1) {
      throw new BadRequestException('Cannot delete the last variant');
    }

    await this.prisma.variant.delete({ where: { id: variantId } });

    this.eventEmitter.emit('variant.deleted', { variant });
    return variant;
  }
}
```

#### tRPC Router
```typescript
// apps/api/src/modules/variants/variants.router.ts
import { router, protectedProcedure } from '@/trpc';
import {
  CreateVariantSchema,
  UpdateVariantSchema,
  BulkCreateVariantsSchema,
} from '@trafi/validators';
import { z } from 'zod';

export const variantRouter = router({
  create: protectedProcedure
    .input(CreateVariantSchema)
    .mutation(({ input, ctx }) => {
      ctx.requirePermission('products:update');
      return ctx.variantsService.create(ctx.storeId, input);
    }),

  bulkCreate: protectedProcedure
    .input(BulkCreateVariantsSchema)
    .mutation(({ input, ctx }) => {
      ctx.requirePermission('products:update');
      return ctx.variantsService.bulkCreate(ctx.storeId, input);
    }),

  update: protectedProcedure
    .input(UpdateVariantSchema)
    .mutation(({ input, ctx }) => {
      ctx.requirePermission('products:update');
      return ctx.variantsService.update(ctx.storeId, input);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input, ctx }) => {
      ctx.requirePermission('products:update');
      return ctx.variantsService.delete(ctx.storeId, input.id);
    }),
});
```

#### Dashboard Data Flow
```
VariantsSection.tsx (Client)
  └─► Product loaded with variants (from useProduct)
       └─► CreateVariantDialog
            └─► useCreateVariant() hook
                 └─► useServerActionMutation(createVariantAction)
                      └─► trpc.variants.create.mutate()

BulkVariantGenerator.tsx (Client)
  └─► Define option types (Size: S,M,L / Color: Red,Blue)
       └─► useBulkCreateVariants() hook
            └─► trpc.variants.bulkCreate.mutate()
                 └─► Creates all combinations automatically
```

#### Server Actions
```typescript
// app/(dashboard)/products/[productId]/_actions/variant-actions.ts
'use server'

import { trpc } from '@/lib/trpc';
import { revalidatePath } from 'next/cache';
import type { CreateVariantInput, UpdateVariantInput, BulkCreateVariantsInput } from '@trafi/validators';

export async function createVariantAction(input: CreateVariantInput) {
  const result = await trpc.variants.create.mutate(input);
  revalidatePath(`/products/${input.productId}`);
  return result;
}

export async function bulkCreateVariantsAction(input: BulkCreateVariantsInput) {
  const result = await trpc.variants.bulkCreate.mutate(input);
  revalidatePath(`/products/${input.productId}`);
  return result;
}

export async function updateVariantAction(input: UpdateVariantInput) {
  const result = await trpc.variants.update.mutate(input);
  revalidatePath(`/products/${input.productId}`);
  return result;
}

export async function deleteVariantAction(id: string, productId: string) {
  const result = await trpc.variants.delete.mutate({ id });
  revalidatePath(`/products/${productId}`);
  return result;
}
```

---

### UX Implementation

- **Layout:** Variants section within product detail page tabs
- **Variant table:** Inline editable cells for price, SKU, quantity
- **Options display:** Colored chips for options (Size: M, Color: Blue)
- **Bulk generator:** Multi-step dialog to define option types and values
- **Price display:** Formatted in euros (€XX.XX from cents)
- **Stock indicator:** Red badge if quantity = 0, amber if < lowStockThreshold
- **Add variant:** Button opens modal with option selection
- **Delete:** Confirmation dialog, disabled if last variant

---

