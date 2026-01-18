import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import sharp from 'sharp';
import { PrismaService } from '@database/prisma.service';
import { StorageService } from '@common/storage';
import type { ProductMedia, MediaType as PrismaMediaType } from '@generated/prisma/client';
import type {
  UpdateMediaInput,
  ReorderMediaInput,
  MediaResponse,
} from '@trafi/types';
import { MEDIA_CONSTANTS } from '@trafi/validators';

/**
 * Media response type for API consumers.
 * @see Story 3.3 - Product Media Upload
 */
export type MediaResponseDto = MediaResponse;

/**
 * Result from image optimization
 */
interface OptimizedImageResult {
  optimized: Buffer;
  thumbnail: Buffer;
  width: number;
  height: number;
  format: string;
}

/**
 * File data from multipart upload
 */
export interface UploadedFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

/**
 * Product Media management service
 *
 * IMPORTANT: Use `protected` methods (not `private`) to support
 * merchant overrides in @trafi/core distribution model (RETRO-2).
 *
 * Key behaviors:
 * - Media is tenant-scoped via Product relation (no direct storeId)
 * - IDs automatically generated with med_ prefix via PrismaService extension
 * - Images are optimized to WebP format for performance
 * - Thumbnails are auto-generated at 400x400
 * - Position 0 is automatically marked as primary
 *
 * @see Story 3.3 - Product Media Upload
 */
@Injectable()
export class MediaService {
  protected readonly logger = new Logger(MediaService.name);

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly storageService: StorageService,
    protected readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Validate file type and size.
   * Protected for @trafi/core consumers to customize validation.
   *
   * @throws BadRequestException if file is invalid
   */
  protected validateFile(file: UploadedFile): void {
    // Check MIME type
    const allowedTypes = MEDIA_CONSTANTS.ALLOWED_MIME_TYPES as readonly string[];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
      );
    }

    // Check file size
    if (file.size > MEDIA_CONSTANTS.MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File too large. Maximum size: ${MEDIA_CONSTANTS.MAX_FILE_SIZE / (1024 * 1024)}MB`,
      );
    }
  }

  /**
   * Optimize image: resize if needed, convert to WebP, generate thumbnail.
   * Protected for merchant override.
   */
  protected async optimizeImage(buffer: Buffer): Promise<OptimizedImageResult> {
    // Get original metadata
    const metadata = await sharp(buffer).metadata();

    // Resize if larger than max dimension while maintaining aspect ratio
    let optimized = sharp(buffer);
    let width = metadata.width ?? 0;
    let height = metadata.height ?? 0;

    if (width > MEDIA_CONSTANTS.OPTIMIZED_MAX_SIZE || height > MEDIA_CONSTANTS.OPTIMIZED_MAX_SIZE) {
      optimized = optimized.resize({
        width: MEDIA_CONSTANTS.OPTIMIZED_MAX_SIZE,
        height: MEDIA_CONSTANTS.OPTIMIZED_MAX_SIZE,
        fit: 'inside',
        withoutEnlargement: true,
      });

      // Recalculate dimensions after resize
      const resizedMetadata = await optimized.clone().metadata();
      width = resizedMetadata.width ?? width;
      height = resizedMetadata.height ?? height;
    }

    // Convert to WebP
    const optimizedBuffer = await optimized
      .webp({ quality: MEDIA_CONSTANTS.WEBP_QUALITY })
      .toBuffer();

    // Generate thumbnail (square, center crop)
    const thumbnailBuffer = await sharp(buffer)
      .resize({
        width: MEDIA_CONSTANTS.THUMBNAIL_SIZE,
        height: MEDIA_CONSTANTS.THUMBNAIL_SIZE,
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: MEDIA_CONSTANTS.THUMBNAIL_QUALITY })
      .toBuffer();

    return {
      optimized: optimizedBuffer,
      thumbnail: thumbnailBuffer,
      width,
      height,
      format: metadata.format ?? 'unknown',
    };
  }

  /**
   * Upload a new media file for a product.
   *
   * ID is automatically generated with med_ prefix by PrismaService extension.
   * The first image is automatically marked as primary.
   *
   * @param storeId - Store ID for tenant isolation (verified via product)
   * @param productId - Product to attach media to
   * @param file - Uploaded file data
   * @param variantId - Optional variant to attach media to
   * @returns Created media record
   */
  async upload(
    storeId: string,
    productId: string,
    file: UploadedFile,
    variantId?: string,
  ): Promise<MediaResponseDto> {
    // Validate file
    this.validateFile(file);

    // Verify product belongs to store and is not soft-deleted
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        storeId,
        deletedAt: null,
      },
      include: { media: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check max images limit
    if (product.media.length >= MEDIA_CONSTANTS.MAX_IMAGES_PER_PRODUCT) {
      throw new BadRequestException(
        `Maximum ${MEDIA_CONSTANTS.MAX_IMAGES_PER_PRODUCT} images per product`,
      );
    }

    // Verify variant if provided
    if (variantId) {
      const variant = await this.prisma.productVariant.findFirst({
        where: { id: variantId, productId },
      });
      if (!variant) {
        throw new NotFoundException('Variant not found');
      }
    }

    // Optimize image
    const optimized = await this.optimizeImage(file.buffer);

    // Generate a temporary ID for storage paths (will be replaced by Prisma)
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // Upload to storage
    const basePath = `${storeId}/products/${productId}`;
    const [mainUpload, thumbUpload] = await Promise.all([
      this.storageService.upload(
        `${basePath}/${tempId}.webp`,
        optimized.optimized,
        'image/webp',
      ),
      this.storageService.upload(
        `${basePath}/${tempId}_thumb.webp`,
        optimized.thumbnail,
        'image/webp',
      ),
    ]);

    // Calculate next position
    const maxPosition = Math.max(-1, ...product.media.map((m) => m.position));
    const position = maxPosition + 1;

    // First image is automatically primary
    const isPrimary = position === 0;

    // Create media record - ID is auto-generated by prefixed IDs extension
    const media = await this.prisma.productMedia.create({
      data: {
        productId,
        variantId,
        url: mainUpload.url,
        thumbnailUrl: thumbUpload.url,
        altText: null,
        type: 'IMAGE',
        position,
        isPrimary,
        width: optimized.width,
        height: optimized.height,
        sizeInBytes: file.size,
        mimeType: file.mimetype,
      },
    });

    const response = this.toMediaResponse(media);

    // Emit event
    this.eventEmitter.emit('media.uploaded', {
      media: response,
      product: { id: product.id, name: product.name },
      storeId,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(
      `Media uploaded: ${media.id} for product ${productId} in store ${storeId}`,
    );

    return response;
  }

  /**
   * Update media metadata (alt text, position, primary status).
   *
   * @param storeId - Store ID for tenant isolation
   * @param input - Update data with media ID
   * @returns Updated media
   */
  async update(
    storeId: string,
    input: UpdateMediaInput,
  ): Promise<MediaResponseDto> {
    // Find media and verify tenant via product
    const media = await this.prisma.productMedia.findUnique({
      where: { id: input.id },
      include: { product: true },
    });

    if (!media || media.product.storeId !== storeId) {
      throw new NotFoundException('Media not found');
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (input.altText !== undefined) updateData.altText = input.altText;
    if (input.position !== undefined) updateData.position = input.position;

    // Handle isPrimary change
    if (input.isPrimary === true) {
      // Remove primary from all other media in this product
      await this.prisma.productMedia.updateMany({
        where: {
          productId: media.productId,
          id: { not: input.id },
        },
        data: { isPrimary: false },
      });
      updateData.isPrimary = true;
    } else if (input.isPrimary === false) {
      updateData.isPrimary = false;
    }

    // Update media
    const updated = await this.prisma.productMedia.update({
      where: { id: input.id },
      data: updateData,
    });

    const response = this.toMediaResponse(updated);

    // Emit event
    this.eventEmitter.emit('media.updated', {
      media: response,
      storeId,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Media updated: ${input.id} in store ${storeId}`);

    return response;
  }

  /**
   * Reorder media items by providing the new order of IDs.
   *
   * @param storeId - Store ID for tenant isolation
   * @param input - Reorder data with product ID and ordered media IDs
   */
  async reorder(storeId: string, input: ReorderMediaInput): Promise<MediaResponseDto[]> {
    // Verify product belongs to store
    const product = await this.prisma.product.findFirst({
      where: {
        id: input.productId,
        storeId,
        deletedAt: null,
      },
      include: { media: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Verify all media IDs belong to this product
    const productMediaIds = new Set(product.media.map((m) => m.id));
    for (const mediaId of input.mediaIds) {
      if (!productMediaIds.has(mediaId)) {
        throw new BadRequestException(`Media ${mediaId} does not belong to this product`);
      }
    }

    // Update positions in a transaction
    await this.prisma.$transaction(
      input.mediaIds.map((mediaId, position) =>
        this.prisma.productMedia.update({
          where: { id: mediaId },
          data: {
            position,
            isPrimary: position === 0, // First position is primary
          },
        }),
      ),
    );

    // Clear primary from any media not in the reorder list
    const reorderedIds = new Set(input.mediaIds);
    const unreorderedMedia = product.media.filter((m) => !reorderedIds.has(m.id));
    if (unreorderedMedia.length > 0) {
      await this.prisma.productMedia.updateMany({
        where: {
          id: { in: unreorderedMedia.map((m) => m.id) },
        },
        data: { isPrimary: false },
      });
    }

    // Fetch updated media
    const updatedMedia = await this.prisma.productMedia.findMany({
      where: { productId: input.productId },
      orderBy: { position: 'asc' },
    });

    const responses = updatedMedia.map((m) => this.toMediaResponse(m));

    // Emit event
    this.eventEmitter.emit('media.reordered', {
      productId: input.productId,
      storeId,
      newOrder: input.mediaIds,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Media reordered for product ${input.productId} in store ${storeId}`);

    return responses;
  }

  /**
   * Delete a media item.
   * Removes from storage and database.
   *
   * @param storeId - Store ID for tenant isolation
   * @param mediaId - Media ID to delete
   */
  async delete(storeId: string, mediaId: string): Promise<void> {
    // Find media and verify tenant via product
    const media = await this.prisma.productMedia.findUnique({
      where: { id: mediaId },
      include: { product: true },
    });

    if (!media || media.product.storeId !== storeId) {
      throw new NotFoundException('Media not found');
    }

    // Delete from storage
    try {
      await Promise.all([
        this.storageService.delete(media.url),
        this.storageService.delete(media.thumbnailUrl),
      ]);
    } catch (error) {
      // Log but don't fail if storage delete fails
      this.logger.warn(`Failed to delete storage files for media ${mediaId}: ${error}`);
    }

    // Delete from database
    await this.prisma.productMedia.delete({ where: { id: mediaId } });

    // If this was primary, make the next media primary
    if (media.isPrimary) {
      const nextMedia = await this.prisma.productMedia.findFirst({
        where: { productId: media.productId },
        orderBy: { position: 'asc' },
      });
      if (nextMedia) {
        await this.prisma.productMedia.update({
          where: { id: nextMedia.id },
          data: { isPrimary: true },
        });
      }
    }

    // Emit event
    this.eventEmitter.emit('media.deleted', {
      mediaId,
      productId: media.productId,
      storeId,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Media deleted: ${mediaId} from store ${storeId}`);
  }

  /**
   * List all media for a product, ordered by position.
   *
   * @param storeId - Store ID for tenant isolation
   * @param productId - Product ID to list media for
   * @returns Array of media
   */
  async listByProduct(
    storeId: string,
    productId: string,
  ): Promise<MediaResponseDto[]> {
    // Verify product belongs to store
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        storeId,
        deletedAt: null,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const media = await this.prisma.productMedia.findMany({
      where: { productId },
      orderBy: { position: 'asc' },
    });

    return media.map((m) => this.toMediaResponse(m));
  }

  /**
   * Get a single media item by ID.
   *
   * @param storeId - Store ID for tenant isolation
   * @param mediaId - Media ID
   * @returns Media or throws NotFoundException
   */
  async findById(storeId: string, mediaId: string): Promise<MediaResponseDto> {
    const media = await this.prisma.productMedia.findUnique({
      where: { id: mediaId },
      include: { product: true },
    });

    if (!media || media.product.storeId !== storeId) {
      throw new NotFoundException('Media not found');
    }

    return this.toMediaResponse(media);
  }

  /**
   * Convert Prisma ProductMedia to API response.
   * Protected for @trafi/core customization.
   */
  protected toMediaResponse(media: ProductMedia): MediaResponseDto {
    return {
      id: media.id,
      productId: media.productId,
      variantId: media.variantId,
      url: media.url,
      thumbnailUrl: media.thumbnailUrl,
      altText: media.altText,
      type: this.toApiMediaType(media.type),
      position: media.position,
      isPrimary: media.isPrimary,
      width: media.width,
      height: media.height,
      sizeInBytes: media.sizeInBytes,
      mimeType: media.mimeType,
      createdAt: media.createdAt,
      updatedAt: media.updatedAt,
    };
  }

  /**
   * Convert Prisma enum to API media type.
   */
  protected toApiMediaType(type: PrismaMediaType): 'IMAGE' | 'VIDEO' {
    return type as 'IMAGE' | 'VIDEO';
  }
}
