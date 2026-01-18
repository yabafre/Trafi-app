import {
  Controller,
  Post,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  BadRequestException,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiProperty,
} from '@nestjs/swagger';
import { MediaService, UploadedFile as UploadedFileType } from './media.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser, MediaResponse } from '@trafi/types';
import { MEDIA_CONSTANTS } from '@trafi/validators';

/**
 * DTO for upload response
 */
class UploadMediaResponseDto {
  @ApiProperty({ description: 'Media ID with med_ prefix', example: 'med_abc123xyz' })
  id!: string;

  @ApiProperty({ description: 'Product ID this media belongs to', example: 'prod_xyz789' })
  productId!: string;

  @ApiProperty({ description: 'Variant ID if variant-specific', example: 'var_abc123', nullable: true })
  variantId!: string | null;

  @ApiProperty({ description: 'Optimized image URL (WebP)', example: 'https://cdn.example.com/store/products/prod_xyz/med_abc.webp' })
  url!: string;

  @ApiProperty({ description: 'Thumbnail URL (400x400)', example: 'https://cdn.example.com/store/products/prod_xyz/med_abc_thumb.webp' })
  thumbnailUrl!: string;

  @ApiProperty({ description: 'Alt text for accessibility', example: 'Product front view', nullable: true })
  altText!: string | null;

  @ApiProperty({ description: 'Media type', enum: ['IMAGE', 'VIDEO'], example: 'IMAGE' })
  type!: string;

  @ApiProperty({ description: 'Position in media gallery (0 = first)', example: 0 })
  position!: number;

  @ApiProperty({ description: 'Whether this is the primary product image', example: true })
  isPrimary!: boolean;

  @ApiProperty({ description: 'Image width in pixels', example: 1200 })
  width!: number;

  @ApiProperty({ description: 'Image height in pixels', example: 800 })
  height!: number;

  @ApiProperty({ description: 'File size in bytes', example: 125000 })
  sizeInBytes!: number;

  @ApiProperty({ description: 'Original MIME type before WebP conversion', example: 'image/jpeg' })
  mimeType!: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date;
}

/**
 * Media Upload Controller (REST)
 *
 * Handles multipart file uploads for product media.
 * Uses REST instead of tRPC because tRPC doesn't handle multipart well.
 *
 * Other media operations (update, reorder, delete, list) use tRPC.
 *
 * @see Story 3.3 - Product Media Upload
 */
@ApiTags('product-media')
@Controller('api/v1/products')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class UploadController {
  constructor(private readonly mediaService: MediaService) {}

  /**
   * Upload an image for a product
   */
  @Post(':productId/media')
  @RequirePermissions('products:update')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Upload product image',
    description: `Upload an image for a product. Supports JPEG, PNG, GIF, WebP. Max size: ${MEDIA_CONSTANTS.MAX_FILE_SIZE / (1024 * 1024)}MB. Images are automatically optimized to WebP format and thumbnails are generated.`,
  })
  @ApiParam({
    name: 'productId',
    description: 'Product ID to attach the image to',
    example: 'prod_abc123xyz',
  })
  @ApiQuery({
    name: 'variantId',
    required: false,
    description: 'Optional variant ID for variant-specific image',
    example: 'var_xyz789abc',
  })
  @ApiBody({
    description: 'Image file to upload',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file (JPEG, PNG, GIF, WebP)',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Image uploaded successfully',
    type: UploadMediaResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid file type or size' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async upload(
    @CurrentUser() user: AuthenticatedUser,
    @Param('productId') productId: string,
    @Query('variantId') variantId: string | undefined,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MEDIA_CONSTANTS.MAX_FILE_SIZE }),
          new FileTypeValidator({
            fileType: new RegExp(`^(${MEDIA_CONSTANTS.ALLOWED_MIME_TYPES.join('|').replace(/\//g, '\\/')})$`),
          }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ): Promise<MediaResponse> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const uploadedFile: UploadedFileType = {
      buffer: file.buffer,
      mimetype: file.mimetype,
      originalname: file.originalname,
      size: file.size,
    };

    return this.mediaService.upload(
      user.storeId,
      productId,
      uploadedFile,
      variantId,
    );
  }
}
