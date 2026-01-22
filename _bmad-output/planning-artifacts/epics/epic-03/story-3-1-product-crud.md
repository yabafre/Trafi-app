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

