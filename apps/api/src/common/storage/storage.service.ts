/**
 * Storage Service
 *
 * Handles file upload/deletion to S3/R2 compatible storage.
 * Uses AWS SDK v3 for compatibility with both S3 and Cloudflare R2.
 *
 * @see Story 3.3 - Product Media Upload
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { StorageConfig } from './storage.config';

export interface UploadResult {
  url: string;
  key: string;
}

@Injectable()
export class StorageService implements OnModuleInit {
  protected readonly logger = new Logger(StorageService.name);
  protected s3Client: S3Client | null = null;
  protected config: StorageConfig | null = null;

  constructor(protected readonly configService: ConfigService) {}

  onModuleInit(): void {
    this.config = this.configService.get<StorageConfig>('storage') ?? null;

    if (!this.config?.accessKeyId || !this.config?.secretAccessKey) {
      this.logger.warn(
        'Storage credentials not configured. File uploads will be disabled.',
      );
      return;
    }

    const clientConfig: ConstructorParameters<typeof S3Client>[0] = {
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
    };

    // Add endpoint for R2 or other S3-compatible services
    if (this.config.endpoint) {
      clientConfig.endpoint = this.config.endpoint;
      clientConfig.forcePathStyle = true; // Required for R2
    }

    this.s3Client = new S3Client(clientConfig);
    this.logger.log('Storage service initialized');
  }

  /**
   * Check if storage is configured and ready
   */
  isConfigured(): boolean {
    return this.s3Client !== null && this.config !== null;
  }

  /**
   * Upload a file to storage
   *
   * @param key - The storage key (path within bucket)
   * @param buffer - File content as Buffer
   * @param contentType - MIME type of the file
   * @returns The public URL of the uploaded file
   */
  async upload(
    key: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<UploadResult> {
    if (!this.s3Client || !this.config) {
      throw new Error('Storage service not configured');
    }

    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable', // 1 year cache
    });

    await this.s3Client.send(command);

    // Construct public URL
    const url = this.config.publicUrl
      ? `${this.config.publicUrl}/${key}`
      : `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${key}`;

    this.logger.debug(`Uploaded file: ${key}`);

    return { url, key };
  }

  /**
   * Delete a file from storage
   *
   * @param key - The storage key (or full URL, which will be parsed)
   */
  async delete(key: string): Promise<void> {
    if (!this.s3Client || !this.config) {
      throw new Error('Storage service not configured');
    }

    // If a full URL is provided, extract the key
    const storageKey = this.extractKeyFromUrl(key);

    const command = new DeleteObjectCommand({
      Bucket: this.config.bucket,
      Key: storageKey,
    });

    await this.s3Client.send(command);
    this.logger.debug(`Deleted file: ${storageKey}`);
  }

  /**
   * Get a signed URL for private file access
   *
   * @param key - The storage key
   * @param expiresIn - URL expiration in seconds (default: 1 hour)
   * @returns Signed URL
   */
  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    if (!this.s3Client || !this.config) {
      throw new Error('Storage service not configured');
    }

    const command = new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Extract storage key from a full URL
   */
  protected extractKeyFromUrl(urlOrKey: string): string {
    if (!this.config?.publicUrl) {
      return urlOrKey;
    }

    // If it's a full URL, extract the key
    if (urlOrKey.startsWith('http')) {
      const url = new URL(urlOrKey);
      return url.pathname.replace(/^\//, ''); // Remove leading slash
    }

    return urlOrKey;
  }
}
