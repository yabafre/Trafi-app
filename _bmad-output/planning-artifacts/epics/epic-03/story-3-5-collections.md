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

