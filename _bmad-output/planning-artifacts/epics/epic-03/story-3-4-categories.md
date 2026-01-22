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

