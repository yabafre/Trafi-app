import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { UploadController } from './upload.controller';

/**
 * Media Module
 *
 * Provides media management capabilities:
 * - Image upload with optimization (WebP conversion, thumbnails)
 * - Media CRUD operations via tRPC (update, reorder, delete, list)
 * - REST endpoint for multipart file upload
 *
 * @see Story 3.3 - Product Media Upload
 */
@Module({
  controllers: [UploadController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
