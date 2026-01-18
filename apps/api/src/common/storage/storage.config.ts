/**
 * Storage Configuration
 *
 * Configuration for S3/R2 compatible storage.
 * Supports both AWS S3 and Cloudflare R2.
 *
 * @see Story 3.3 - Product Media Upload
 */

import { registerAs } from '@nestjs/config';

export interface StorageConfig {
  bucket: string;
  region: string;
  endpoint?: string; // For R2 or S3-compatible services
  accessKeyId: string;
  secretAccessKey: string;
  publicUrl: string; // CDN or public bucket URL for serving files
}

export const storageConfig = registerAs(
  'storage',
  (): StorageConfig => ({
    bucket: process.env.STORAGE_BUCKET || 'trafi-media',
    region: process.env.STORAGE_REGION || 'auto',
    endpoint: process.env.STORAGE_ENDPOINT, // e.g., https://<account>.r2.cloudflarestorage.com
    accessKeyId: process.env.STORAGE_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY || '',
    publicUrl: process.env.STORAGE_PUBLIC_URL || '', // e.g., https://cdn.example.com
  }),
);

export const STORAGE_CONFIG = 'storage';
