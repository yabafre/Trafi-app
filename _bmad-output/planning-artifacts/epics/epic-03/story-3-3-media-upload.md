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

