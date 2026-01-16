# Epic 3: Product Catalog & Inventory

Merchant peut creer, editer, et organiser son catalogue produits complet avec gestion d'inventaire.

**FRs covered:** FR10, FR11, FR12, FR20

---

## Epic Implementation Guidelines

### Retrospective Learnings (MANDATORY)
- **RETRO-1:** Use Context7 MCP before implementing file upload libraries, image optimization
- **RETRO-2:** ProductService, CategoryService, InventoryService use `protected` methods
- **RETRO-3:** ProductModule exports explicit public API for future extensibility
- **RETRO-4:** Dashboard product components accept customization props (columns, actions)
- **RETRO-5:** Product list page uses composition pattern (wrappable DataTable)
- **RETRO-6:** Code with @trafi/core override patterns (merchants may extend product fields)

### UX Design Requirements (Dashboard - Digital Brutalism v2)

**Brutalist Manifesto:**
- The interface is a machine. No decoration, only data and action.
- Radius-zero everywhere — everything is a rectangle.
- Visible grid — 1px borders expose structure.
- High contrast — pure black background, pure white text.

**Visual Design:**
- **UX-1:** Dark mode default, all product pages
- **UX-2:** Layout: Rail (64px) + Sidebar (240px) + Main content
- **UX-3:** Breadcrumb: Dashboard > Products > [action]
- **UX-4:** Status badges: draft (gray #6B7280), active (#00FF94), archived (#FF3366)
- **UX-5:** Product grid uses strict rectangular grid layout
- **UX-6:** Card hover: border-color #CCFF00, no transforms — only border highlight
- **UX-7:** Drag-and-drop for image reorder with immediate visual feedback
- **UX-8:** Shadcn UI: DataTable, Dialog, Tabs, Select, Input (all radius-0)
- **UX-COLOR-1:** Primary Acid Lime #CCFF00 for action buttons, focus states
- **UX-COLOR-2:** Background #000000, borders #333333, text #FFFFFF
- **UX-COLOR-3:** Success #00FF94, Risk #FF3366
- **UX-RADIUS:** 0px everywhere — `border-radius: 0px !important`
- **UX-SHADOW:** None — elements sit firmly in the grid
- **UX-TYPE:** JetBrains Mono for product data/prices, system font for body

---

## Story 3.1: Product Model and Basic CRUD

As a **Merchant**,
I want **to create and manage products with basic information**,
So that **I can build my product catalog**.

**Acceptance Criteria:**

**Given** a Merchant is authenticated
**When** they create a new product
**Then** they can specify:
- Title, description, and slug
- Status (draft, active, archived)
- Product type and vendor
**And** products have CUID IDs with `prod_` prefix
**And** products are scoped to the authenticated store
**And** CRUD operations are available via API and Dashboard

---

### Technical Implementation

#### File Structure
```
apps/dashboard/src/app/(dashboard)/products/
├── page.tsx                          # RSC - Product list
├── layout.tsx                        # Products layout
├── _components/
│   ├── ProductsDataTable.tsx         # Client - DataTable
│   ├── ProductsDataTableSkeleton.tsx
│   ├── ProductStatusBadge.tsx
│   ├── ProductFilters.tsx            # Client - Filter bar
│   └── CreateProductButton.tsx
├── _hooks/
│   ├── useProducts.ts                # Query: list products
│   ├── useDeleteProduct.ts           # Mutation: delete
│   └── useUpdateProductStatus.ts     # Mutation: status change
├── _actions/
│   └── product-actions.ts            # Server actions
├── new/
│   ├── page.tsx                      # RSC - Create product
│   ├── _components/
│   │   └── CreateProductForm.tsx     # Client - Form
│   └── _hooks/
│       └── useCreateProduct.ts
└── [productId]/
    ├── page.tsx                      # RSC - Edit product
    ├── _components/
    │   ├── EditProductForm.tsx       # Client - Form
    │   └── ProductDetailsTabs.tsx
    └── _hooks/
        └── useProduct.ts             # Query: single product

apps/api/src/modules/products/
├── products.module.ts
├── products.service.ts               # protected methods
├── products.router.ts                # tRPC router
├── dto/
│   ├── create-product.dto.ts
│   └── update-product.dto.ts
└── entities/
    └── product.entity.ts
```

#### Zod Schemas (@trafi/validators)
```typescript
// packages/@trafi/validators/src/product/index.ts
import { z } from 'zod';
import { generateCuid } from '@trafi/types';

export const ProductStatusSchema = z.enum(['draft', 'active', 'archived']);
export type ProductStatus = z.infer<typeof ProductStatusSchema>;

export const CreateProductSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/).min(3).max(100).optional(),
  status: ProductStatusSchema.default('draft'),
  productType: z.string().max(100).optional(),
  vendor: z.string().max(100).optional(),
  tags: z.array(z.string().max(50)).max(20).default([]),
});
export type CreateProductInput = z.infer<typeof CreateProductSchema>;

export const UpdateProductSchema = CreateProductSchema.partial().extend({
  id: z.string(),
});
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;

export const ListProductsSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  status: ProductStatusSchema.optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'title', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
export type ListProductsInput = z.infer<typeof ListProductsSchema>;

export const ProductResponseSchema = z.object({
  id: z.string(), // prod_xxx
  storeId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  slug: z.string(),
  status: ProductStatusSchema,
  productType: z.string().nullable(),
  vendor: z.string().nullable(),
  tags: z.array(z.string()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type ProductResponse = z.infer<typeof ProductResponseSchema>;
```

#### Backend Service (NestJS)
```typescript
// apps/api/src/modules/products/products.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { createId } from '@paralleldrive/cuid2';
import slugify from 'slugify';
import type { CreateProductInput, UpdateProductInput, ListProductsInput } from '@trafi/validators';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  // Protected for @trafi/core extensibility
  protected generateProductId(): string {
    return `prod_${createId()}`;
  }

  protected generateSlug(title: string): string {
    return slugify(title, { lower: true, strict: true });
  }

  protected async validateSlugUnique(storeId: string, slug: string, excludeId?: string) {
    const existing = await this.prisma.product.findFirst({
      where: {
        storeId,
        slug,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    if (existing) {
      throw new ConflictException('Product with this slug already exists');
    }
  }

  async create(storeId: string, input: CreateProductInput) {
    const slug = input.slug || this.generateSlug(input.title);
    await this.validateSlugUnique(storeId, slug);

    const product = await this.prisma.product.create({
      data: {
        id: this.generateProductId(),
        storeId,
        title: input.title,
        description: input.description,
        slug,
        status: input.status,
        productType: input.productType,
        vendor: input.vendor,
        tags: input.tags,
      },
    });

    this.eventEmitter.emit('product.created', { product });
    return product;
  }

  async update(storeId: string, input: UpdateProductInput) {
    const { id, ...data } = input;

    if (data.slug) {
      await this.validateSlugUnique(storeId, data.slug, id);
    }

    const product = await this.prisma.product.update({
      where: { id, storeId },
      data,
    });

    this.eventEmitter.emit('product.updated', { product });
    return product;
  }

  async delete(storeId: string, productId: string) {
    const product = await this.prisma.product.delete({
      where: { id: productId, storeId },
    });

    this.eventEmitter.emit('product.deleted', { product });
    return product;
  }

  async findById(storeId: string, productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId, storeId },
      include: {
        variants: true,
        media: { orderBy: { position: 'asc' } },
        categories: true,
      },
    });

    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async list(storeId: string, input: ListProductsInput) {
    const { page, limit, status, search, sortBy, sortOrder } = input;

    const where = {
      storeId,
      ...(status ? { status } : {}),
      ...(search ? {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: { select: { variants: true } },
          media: { take: 1, orderBy: { position: 'asc' } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      products,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
```

#### tRPC Router
```typescript
// apps/api/src/modules/products/products.router.ts
import { router, protectedProcedure } from '@/trpc';
import {
  CreateProductSchema,
  UpdateProductSchema,
  ListProductsSchema,
} from '@trafi/validators';
import { z } from 'zod';

export const productRouter = router({
  list: protectedProcedure
    .input(ListProductsSchema)
    .query(({ input, ctx }) => {
      ctx.requirePermission('products:read');
      return ctx.productsService.list(ctx.storeId, input);
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input, ctx }) => {
      ctx.requirePermission('products:read');
      return ctx.productsService.findById(ctx.storeId, input.id);
    }),

  create: protectedProcedure
    .input(CreateProductSchema)
    .mutation(({ input, ctx }) => {
      ctx.requirePermission('products:create');
      return ctx.productsService.create(ctx.storeId, input);
    }),

  update: protectedProcedure
    .input(UpdateProductSchema)
    .mutation(({ input, ctx }) => {
      ctx.requirePermission('products:update');
      return ctx.productsService.update(ctx.storeId, input);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input, ctx }) => {
      ctx.requirePermission('products:delete');
      return ctx.productsService.delete(ctx.storeId, input.id);
    }),
});
```

#### Dashboard Data Flow
```
ProductsDataTable.tsx (Client)
  └─► useProducts() hook
       └─► useServerActionQuery(getProductsAction)
            └─► getProductsAction() (Server Action)
                 └─► trpc.products.list.query()
                      └─► ProductsService.list() (NestJS)
```

#### Server Actions
```typescript
// app/(dashboard)/products/_actions/product-actions.ts
'use server'

import { trpc } from '@/lib/trpc';
import { revalidatePath } from 'next/cache';
import type { CreateProductInput, UpdateProductInput, ListProductsInput } from '@trafi/validators';

export async function getProductsAction(input: ListProductsInput) {
  return trpc.products.list.query(input);
}

export async function getProductAction(id: string) {
  return trpc.products.get.query({ id });
}

export async function createProductAction(input: CreateProductInput) {
  const result = await trpc.products.create.mutate(input);
  revalidatePath('/products');
  return result;
}

export async function updateProductAction(input: UpdateProductInput) {
  const result = await trpc.products.update.mutate(input);
  revalidatePath('/products');
  revalidatePath(`/products/${input.id}`);
  return result;
}

export async function deleteProductAction(id: string) {
  const result = await trpc.products.delete.mutate({ id });
  revalidatePath('/products');
  return result;
}
```

#### Custom Hooks
```typescript
// app/(dashboard)/products/_hooks/useProducts.ts
import { useServerActionQuery } from '@/lib/hooks/server-action-hooks';
import { getProductsAction } from '../_actions/product-actions';
import type { ListProductsInput } from '@trafi/validators';

export function useProducts(filters: ListProductsInput) {
  return useServerActionQuery(getProductsAction, {
    input: filters,
    queryKey: ['products', filters],
  });
}

// app/(dashboard)/products/new/_hooks/useCreateProduct.ts
import { useServerActionMutation } from '@/lib/hooks/server-action-hooks';
import { createProductAction } from '../../_actions/product-actions';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function useCreateProduct() {
  const router = useRouter();

  return useServerActionMutation(createProductAction, {
    onSuccess: (product) => {
      toast.success('Produit créé');
      router.push(`/products/${product.id}`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
```

#### Client Component Example
```typescript
// app/(dashboard)/products/_components/ProductsDataTable.tsx
'use client'

import { useState } from 'react';
import { useProducts } from '../_hooks/useProducts';
import { DataTable } from '@/components/shared/DataTable';
import { ProductStatusBadge } from './ProductStatusBadge';
import { ProductsDataTableSkeleton } from './ProductsDataTableSkeleton';
import { ProductFilters } from './ProductFilters';
import type { ProductResponse, ListProductsInput } from '@trafi/validators';
import Image from 'next/image';
import Link from 'next/link';

const columns = [
  {
    key: 'thumbnail',
    header: '',
    cell: (product: ProductResponse & { media: any[] }) => (
      <div className="w-12 h-12 bg-muted rounded-md overflow-hidden">
        {product.media[0] ? (
          <Image
            src={product.media[0].url}
            alt={product.title}
            width={48}
            height={48}
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Package className="w-6 h-6" />
          </div>
        )}
      </div>
    ),
  },
  {
    key: 'title',
    header: 'Produit',
    cell: (product: ProductResponse) => (
      <Link
        href={`/products/${product.id}`}
        className="font-medium hover:text-primary transition-colors"
      >
        {product.title}
      </Link>
    ),
  },
  {
    key: 'status',
    header: 'Statut',
    cell: (product: ProductResponse) => <ProductStatusBadge status={product.status} />,
  },
  {
    key: 'variants',
    header: 'Variantes',
    cell: (product: any) => product._count.variants,
  },
  {
    key: 'updatedAt',
    header: 'Modifié',
    cell: (product: ProductResponse) => new Date(product.updatedAt).toLocaleDateString('fr-FR'),
  },
];

export function ProductsDataTable() {
  const [filters, setFilters] = useState<ListProductsInput>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const { data, isLoading } = useProducts(filters);

  if (isLoading) return <ProductsDataTableSkeleton />;

  return (
    <div className="space-y-4">
      <ProductFilters filters={filters} onChange={setFilters} />
      <DataTable
        columns={columns}
        data={data?.products || []}
        pagination={data?.pagination}
        onPageChange={(page) => setFilters({ ...filters, page })}
      />
    </div>
  );
}
```

---

### UX Implementation

- **Layout:** Rail + Sidebar + Main with DataTable
- **Breadcrumb:** Dashboard > Products
- **DataTable:** Sortable columns, pagination, bulk actions
- **Status badges:** draft (gray #6B7280), active (green #22C55E), archived (red #EF4444)
- **Thumbnail:** 48x48 rounded, placeholder icon if no media
- **Filter bar:** Search, status dropdown, sort dropdown
- **Create button:** Primary #F97316, top-right
- **Row hover:** Background lighten, cursor pointer
- **Empty state:** Illustration + "Créer votre premier produit" CTA

---

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

## Story 3.3: Product Media Upload

As a **Merchant**,
I want **to upload images and media for products**,
So that **customers can see what they're buying**.

**Acceptance Criteria:**

**Given** a product exists
**When** the Merchant uploads media
**Then** they can:
- Upload multiple images per product
- Set a featured/primary image
- Reorder images via drag-and-drop
- Add alt text for accessibility (NFR-A11Y-6)
**And** images are optimized and stored in cloud storage
**And** variants can have their own specific images

---

### Technical Implementation

#### File Structure
```
apps/dashboard/src/app/(dashboard)/products/[productId]/
├── _components/
│   ├── MediaSection.tsx              # Client - Media manager
│   ├── MediaUploadZone.tsx           # Client - Dropzone
│   ├── MediaGrid.tsx                 # Client - Sortable grid
│   ├── MediaGridItem.tsx             # Client - Single media card
│   └── AltTextDialog.tsx             # Client - Edit alt text

apps/api/src/modules/media/
├── media.module.ts
├── media.service.ts                  # protected methods
├── media.router.ts                   # tRPC router
└── upload/
    ├── upload.controller.ts          # Multipart upload endpoint
    └── storage.service.ts            # S3/Cloudflare R2 adapter
```

#### Zod Schemas (@trafi/validators)
```typescript
// packages/@trafi/validators/src/media/index.ts
import { z } from 'zod';

export const MediaTypeSchema = z.enum(['image', 'video']);
export type MediaType = z.infer<typeof MediaTypeSchema>;

export const UploadMediaSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional(),
});

export const UpdateMediaSchema = z.object({
  id: z.string(),
  altText: z.string().max(500).optional(),
  position: z.number().int().nonnegative().optional(),
  isPrimary: z.boolean().optional(),
});
export type UpdateMediaInput = z.infer<typeof UpdateMediaSchema>;

export const ReorderMediaSchema = z.object({
  productId: z.string(),
  mediaIds: z.array(z.string()), // Ordered array of media IDs
});
export type ReorderMediaInput = z.infer<typeof ReorderMediaSchema>;

export const MediaResponseSchema = z.object({
  id: z.string(), // med_xxx
  productId: z.string(),
  variantId: z.string().nullable(),
  url: z.string().url(),
  thumbnailUrl: z.string().url(),
  altText: z.string().nullable(),
  type: MediaTypeSchema,
  position: z.number(),
  isPrimary: z.boolean(),
  width: z.number(),
  height: z.number(),
  sizeInBytes: z.number(),
  createdAt: z.string().datetime(),
});
export type MediaResponse = z.infer<typeof MediaResponseSchema>;
```

#### Backend Service (NestJS)
```typescript
// apps/api/src/modules/media/media.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { StorageService } from './upload/storage.service';
import { createId } from '@paralleldrive/cuid2';
import sharp from 'sharp';

@Injectable()
export class MediaService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  protected generateMediaId(): string {
    return `med_${createId()}`;
  }

  protected async optimizeImage(buffer: Buffer): Promise<{
    optimized: Buffer;
    thumbnail: Buffer;
    width: number;
    height: number;
  }> {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    const optimized = await image
      .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    const thumbnail = await sharp(buffer)
      .resize(400, 400, { fit: 'cover' })
      .webp({ quality: 80 })
      .toBuffer();

    return {
      optimized,
      thumbnail,
      width: metadata.width || 0,
      height: metadata.height || 0,
    };
  }

  async upload(
    storeId: string,
    productId: string,
    file: Express.Multer.File,
    variantId?: string,
  ) {
    // Validate product ownership
    const product = await this.prisma.product.findUnique({
      where: { id: productId, storeId },
      include: { media: { orderBy: { position: 'asc' } } },
    });

    if (!product) throw new BadRequestException('Product not found');

    // Optimize image
    const { optimized, thumbnail, width, height } = await this.optimizeImage(file.buffer);

    // Upload to storage
    const mediaId = this.generateMediaId();
    const [url, thumbnailUrl] = await Promise.all([
      this.storage.upload(`${storeId}/products/${productId}/${mediaId}.webp`, optimized),
      this.storage.upload(`${storeId}/products/${productId}/${mediaId}_thumb.webp`, thumbnail),
    ]);

    // Determine position (last) and if primary (first image)
    const position = product.media.length;
    const isPrimary = position === 0;

    const media = await this.prisma.productMedia.create({
      data: {
        id: mediaId,
        productId,
        variantId,
        url,
        thumbnailUrl,
        type: 'image',
        position,
        isPrimary,
        width,
        height,
        sizeInBytes: optimized.length,
      },
    });

    return media;
  }

  async update(storeId: string, input: UpdateMediaInput) {
    const { id, ...data } = input;

    const media = await this.prisma.productMedia.findUnique({
      where: { id },
      include: { product: true },
    });

    if (!media || media.product.storeId !== storeId) {
      throw new BadRequestException('Media not found');
    }

    // If setting as primary, unset other primaries
    if (data.isPrimary === true) {
      await this.prisma.productMedia.updateMany({
        where: { productId: media.productId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    return this.prisma.productMedia.update({
      where: { id },
      data,
    });
  }

  async reorder(storeId: string, input: ReorderMediaInput) {
    const product = await this.prisma.product.findUnique({
      where: { id: input.productId, storeId },
    });

    if (!product) throw new BadRequestException('Product not found');

    // Update positions in transaction
    await this.prisma.$transaction(
      input.mediaIds.map((mediaId, index) =>
        this.prisma.productMedia.update({
          where: { id: mediaId },
          data: { position: index, isPrimary: index === 0 },
        })
      )
    );

    return this.prisma.productMedia.findMany({
      where: { productId: input.productId },
      orderBy: { position: 'asc' },
    });
  }

  async delete(storeId: string, mediaId: string) {
    const media = await this.prisma.productMedia.findUnique({
      where: { id: mediaId },
      include: { product: true },
    });

    if (!media || media.product.storeId !== storeId) {
      throw new BadRequestException('Media not found');
    }

    // Delete from storage
    await this.storage.delete(media.url);
    await this.storage.delete(media.thumbnailUrl);

    // Delete record
    await this.prisma.productMedia.delete({ where: { id: mediaId } });

    // Reposition remaining media
    const remaining = await this.prisma.productMedia.findMany({
      where: { productId: media.productId },
      orderBy: { position: 'asc' },
    });

    await this.prisma.$transaction(
      remaining.map((m, index) =>
        this.prisma.productMedia.update({
          where: { id: m.id },
          data: { position: index, isPrimary: index === 0 },
        })
      )
    );

    return media;
  }
}
```

#### tRPC Router
```typescript
// apps/api/src/modules/media/media.router.ts
import { router, protectedProcedure } from '@/trpc';
import { UpdateMediaSchema, ReorderMediaSchema } from '@trafi/validators';
import { z } from 'zod';

export const mediaRouter = router({
  update: protectedProcedure
    .input(UpdateMediaSchema)
    .mutation(({ input, ctx }) => {
      ctx.requirePermission('products:update');
      return ctx.mediaService.update(ctx.storeId, input);
    }),

  reorder: protectedProcedure
    .input(ReorderMediaSchema)
    .mutation(({ input, ctx }) => {
      ctx.requirePermission('products:update');
      return ctx.mediaService.reorder(ctx.storeId, input);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input, ctx }) => {
      ctx.requirePermission('products:update');
      return ctx.mediaService.delete(ctx.storeId, input.id);
    }),
});
```

#### Upload Controller (REST for multipart)
```typescript
// apps/api/src/modules/media/upload/upload.controller.ts
@Controller('products/:productId/media')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UploadController {
  constructor(private mediaService: MediaService) {}

  @Post()
  @RequirePermissions('products:update')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/^image\/(jpeg|png|gif|webp)$/)) {
        return cb(new BadRequestException('Invalid file type'), false);
      }
      cb(null, true);
    },
  }))
  async upload(
    @Param('productId') productId: string,
    @Query('variantId') variantId: string | undefined,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('storeId') storeId: string,
  ) {
    return this.mediaService.upload(storeId, productId, file, variantId);
  }
}
```

#### Dashboard Custom Hooks
```typescript
// app/(dashboard)/products/[productId]/_hooks/useUploadMedia.ts
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useUploadMedia(productId: string) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const queryClient = useQueryClient();

  const upload = async (file: File, variantId?: string) => {
    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const url = variantId
        ? `/api/products/${productId}/media?variantId=${variantId}`
        : `/api/products/${productId}/media`;

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const media = await response.json();
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      toast.success('Image uploadée');
      return media;
    } catch (error) {
      toast.error('Erreur lors de l\'upload');
      throw error;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return { upload, uploading, progress };
}

// _hooks/useReorderMedia.ts
import { useServerActionMutation } from '@/lib/hooks/server-action-hooks';
import { reorderMediaAction } from '../_actions/media-actions';
import { useQueryClient } from '@tanstack/react-query';

export function useReorderMedia(productId: string) {
  const queryClient = useQueryClient();

  return useServerActionMutation(reorderMediaAction, {
    onMutate: async ({ mediaIds }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['product', productId] });
      const previous = queryClient.getQueryData(['product', productId]);
      // Update cache optimistically
      return { previous };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['product', productId], context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
    },
  });
}
```

---

### UX Implementation

- **Upload zone:** Dashed border (#3F3F46), hover highlights #F97316
- **Drag-and-drop:** react-dropzone with file validation
- **Grid layout:** 4 columns on desktop, 2 on mobile, 120px thumbnails
- **Sortable:** @dnd-kit/sortable with smooth GSAP animations
- **Primary badge:** Star icon with #F97316, top-left of thumbnail
- **Delete overlay:** Trash icon on hover, confirmation before delete
- **Alt text:** Click image to open dialog with textarea
- **Progress:** Skeleton shimmer + percentage during upload
- **Toast:** Success after upload, error on failure

---

## Story 3.4: Categories Management

As a **Merchant**,
I want **to organize products into hierarchical categories**,
So that **customers can browse products by type**.

**Acceptance Criteria:**

**Given** a Merchant is authenticated
**When** they manage categories
**Then** they can:
- Create categories with name, slug, and description
- Create nested subcategories (up to 3 levels)
- Assign products to multiple categories
- Reorder categories
**And** categories have unique slugs within the store
**And** deleting a category does not delete products

---

### Technical Implementation

#### Zod Schemas (@trafi/validators)
```typescript
// packages/@trafi/validators/src/category/index.ts
export const CreateCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().max(500).optional(),
  parentId: z.string().optional(), // null = root category
  imageUrl: z.string().url().optional(),
  position: z.number().int().nonnegative().default(0),
});

export const UpdateCategorySchema = CreateCategorySchema.partial().extend({
  id: z.string(),
});

export const CategoryResponseSchema = z.object({
  id: z.string(), // cat_xxx
  storeId: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  parentId: z.string().nullable(),
  depth: z.number(), // 0, 1, or 2 (max 3 levels)
  position: z.number(),
  children: z.array(z.lazy(() => CategoryResponseSchema)).optional(),
  _count: z.object({ products: z.number() }).optional(),
});
```

#### tRPC Router
```typescript
export const categoryRouter = router({
  tree: protectedProcedure
    .query(({ ctx }) => ctx.categoryService.getTree(ctx.storeId)),

  create: protectedProcedure
    .input(CreateCategorySchema)
    .mutation(({ input, ctx }) => {
      ctx.requirePermission('products:update');
      return ctx.categoryService.create(ctx.storeId, input);
    }),

  update: protectedProcedure
    .input(UpdateCategorySchema)
    .mutation(({ input, ctx }) => {
      ctx.requirePermission('products:update');
      return ctx.categoryService.update(ctx.storeId, input);
    }),

  reorder: protectedProcedure
    .input(z.object({
      categoryId: z.string(),
      parentId: z.string().nullable(),
      position: z.number(),
    }))
    .mutation(({ input, ctx }) => {
      ctx.requirePermission('products:update');
      return ctx.categoryService.reorder(ctx.storeId, input);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input, ctx }) => {
      ctx.requirePermission('products:delete');
      return ctx.categoryService.delete(ctx.storeId, input.id);
    }),
});
```

#### Dashboard Data Flow
```
CategoriesTree.tsx (Client)
  └─► useCategories() hook
       └─► useServerActionQuery(getCategoriesAction)
            └─► trpc.categories.tree.query()
                 └─► CategoryService.getTree() (NestJS)
                      └─► Returns nested tree structure
```

#### Key Implementation Notes
- **Tree structure:** Categories stored flat with `parentId`, built into tree on query
- **Depth validation:** Backend rejects categories deeper than 3 levels
- **Product assignment:** Many-to-many through `ProductCategory` join table
- **Slug uniqueness:** Scoped to store, auto-generated from name if not provided
- **Delete behavior:** Products remain, only category assignment removed

---

### UX Implementation

- **Layout:** Tree view with expand/collapse icons
- **Drag-and-drop:** Reorder within same level and move between parents
- **Inline edit:** Click name to edit, Enter to save
- **Add category:** Button at each level, or "Add root category"
- **Product count:** Badge showing count of products per category
- **Delete:** Confirmation dialog with product count warning

---

## Story 3.5: Collections Management

As a **Merchant**,
I want **to create curated product collections**,
So that **I can group products for marketing purposes**.

**Acceptance Criteria:**

**Given** a Merchant is authenticated
**When** they create a collection
**Then** they can:
- Define collection name, description, and image
- Add products manually to the collection
- Set collection visibility (visible/hidden)
- Define display order of products
**And** products can belong to multiple collections
**And** collections can be featured on the storefront

---

### Technical Implementation

#### Zod Schemas (@trafi/validators)
```typescript
// packages/@trafi/validators/src/collection/index.ts
export const CreateCollectionSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().max(1000).optional(),
  imageUrl: z.string().url().optional(),
  isVisible: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

export const AddProductsToCollectionSchema = z.object({
  collectionId: z.string(),
  productIds: z.array(z.string()).min(1),
});

export const ReorderCollectionProductsSchema = z.object({
  collectionId: z.string(),
  productIds: z.array(z.string()), // Ordered array
});
```

#### tRPC Router
```typescript
export const collectionRouter = router({
  list: protectedProcedure
    .input(ListCollectionsSchema)
    .query(({ input, ctx }) => ctx.collectionService.list(ctx.storeId, input)),

  create: protectedProcedure
    .input(CreateCollectionSchema)
    .mutation(({ input, ctx }) => {
      ctx.requirePermission('products:create');
      return ctx.collectionService.create(ctx.storeId, input);
    }),

  addProducts: protectedProcedure
    .input(AddProductsToCollectionSchema)
    .mutation(({ input, ctx }) => {
      ctx.requirePermission('products:update');
      return ctx.collectionService.addProducts(ctx.storeId, input);
    }),

  reorderProducts: protectedProcedure
    .input(ReorderCollectionProductsSchema)
    .mutation(({ input, ctx }) => {
      ctx.requirePermission('products:update');
      return ctx.collectionService.reorderProducts(ctx.storeId, input);
    }),
});
```

#### Dashboard Data Flow
```
CollectionsPage.tsx (Client)
  └─► useCollections() hook
       └─► useServerActionQuery(getCollectionsAction)

CollectionDetail.tsx (Client)
  └─► Product drag-and-drop reorder
       └─► useReorderCollectionProducts() hook
            └─► Optimistic update + trpc.collections.reorderProducts.mutate()
```

---

### UX Implementation

- **Layout:** Card grid for collections, each showing cover image + name
- **Collection detail:** Product grid with drag reorder
- **Add products:** Dialog with product search and multi-select
- **Featured badge:** Star icon on featured collections
- **Visibility toggle:** Eye icon with instant toggle

---

## Story 3.6: Product Pricing and Tax Rules

As a **Merchant**,
I want **to set product prices with tax configuration**,
So that **prices display correctly with applicable taxes**.

**Acceptance Criteria:**

**Given** a product variant exists
**When** the Merchant sets pricing
**Then** they can configure:
- Base price (stored in cents - ARCH-25)
- Compare-at price for sales display
- Cost price for margin calculation
- Tax inclusion setting (price includes tax or not)
**And** tax rules can be assigned per product
**And** prices support the store's default currency

---

### Technical Implementation

#### Zod Schemas (@trafi/validators)
```typescript
// packages/@trafi/validators/src/pricing/index.ts
export const PricingSchema = z.object({
  priceInCents: z.number().int().positive(),           // ARCH-25: all money in cents
  compareAtPriceInCents: z.number().int().positive().optional(), // Strike-through price
  costPriceInCents: z.number().int().nonnegative().optional(),   // For margin calc
  taxIncluded: z.boolean().default(true),              // EU default: tax included
  taxRuleId: z.string().optional(),                    // Link to TaxRule
});

export const TaxRuleSchema = z.object({
  id: z.string(),
  name: z.string(),                                    // "TVA Standard", "TVA Réduit"
  rate: z.number().min(0).max(100),                    // e.g., 20 for 20%
  countryCode: z.string().length(2),                   // "FR", "DE"
  isDefault: z.boolean().default(false),
});

export const UpdateVariantPricingSchema = z.object({
  variantId: z.string(),
  ...PricingSchema.shape,
});
```

#### Price Calculation Service (NestJS)
```typescript
// apps/api/src/modules/pricing/pricing.service.ts
@Injectable()
export class PricingService {
  // Protected for @trafi/core extensibility
  protected calculateTax(priceInCents: number, taxRate: number, taxIncluded: boolean): {
    netPriceInCents: number;
    taxAmountInCents: number;
    grossPriceInCents: number;
  } {
    if (taxIncluded) {
      // Price already includes tax, extract it
      const netPriceInCents = Math.round(priceInCents / (1 + taxRate / 100));
      const taxAmountInCents = priceInCents - netPriceInCents;
      return { netPriceInCents, taxAmountInCents, grossPriceInCents: priceInCents };
    } else {
      // Price is net, add tax
      const taxAmountInCents = Math.round(priceInCents * (taxRate / 100));
      return {
        netPriceInCents: priceInCents,
        taxAmountInCents,
        grossPriceInCents: priceInCents + taxAmountInCents,
      };
    }
  }

  protected calculateMargin(priceInCents: number, costPriceInCents: number | null): {
    marginInCents: number;
    marginPercent: number;
  } | null {
    if (!costPriceInCents || costPriceInCents === 0) return null;
    const marginInCents = priceInCents - costPriceInCents;
    const marginPercent = Math.round((marginInCents / priceInCents) * 100);
    return { marginInCents, marginPercent };
  }

  formatPrice(cents: number, currency: string = 'EUR', locale: string = 'fr-FR'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(cents / 100);
  }
}
```

#### Dashboard Data Flow
```
PricingSection.tsx (Client)
  └─► Price input in euros, converted to cents on save
       └─► useUpdateVariantPricing() hook
            └─► trpc.variants.update.mutate({ priceInCents })
```

#### Key Implementation Notes
- **All prices stored in cents** (ARCH-25) - prevents floating point issues
- **Currency formatting:** `Intl.NumberFormat` for display
- **Tax calculation:** Server-side for consistency
- **Margin display:** Real-time calculation as cost price is entered

---

### UX Implementation

- **Price input:** Shows € symbol, user enters decimal (e.g., "29.99"), converted to 2999 cents
- **Compare-at price:** Shows strikethrough preview
- **Margin display:** Real-time percentage badge next to cost price
- **Tax toggle:** Switch for "Prix TTC" / "Prix HT"
- **Validation:** Red border if price is 0 or negative

---

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
