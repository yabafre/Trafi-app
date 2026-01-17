import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '@database/prisma.service';
import type { ApiKey } from '@generated/prisma/client';
import type { CreateApiKeyDto, ListApiKeysDto } from './dto';
import type {
  ApiKeyResponse,
  ApiKeyCreatedResponse,
  ApiKeysListResponse,
} from '@trafi/validators';

/**
 * API Key management service for SDK authentication
 *
 * IMPORTANT: Use `protected` methods (not `private`) to support
 * merchant overrides in @trafi/core distribution model.
 *
 * Key format: trafi_sk_{64 hex chars from randomBytes(32)}
 * Keys are stored as SHA256 hashes - plain key is ONLY returned on creation.
 *
 * @see epic-02-admin-auth.md#Story-2.5
 */
@Injectable()
export class ApiKeysService {
  protected readonly logger = new Logger(ApiKeysService.name);

  constructor(protected readonly prisma: PrismaService) {}

  /**
   * Generate a new API key with cryptographically secure random bytes.
   * Returns the plain key, hash, prefix, and last 4 chars.
   *
   * Protected for merchant override (e.g., custom key format)
   */
  protected generateApiKey(): {
    key: string;
    hash: string;
    prefix: string;
    lastFourChars: string;
  } {
    const randomPart = randomBytes(32).toString('hex'); // 64 hex chars
    const key = `trafi_sk_${randomPart}`;
    const hash = createHash('sha256').update(key).digest('hex');
    const prefix = key.substring(0, 18); // "trafi_sk_" + first 8 hex chars
    const lastFourChars = randomPart.slice(-4);

    return { key, hash, prefix, lastFourChars };
  }

  /**
   * Validate an API key and return the ApiKey record if valid.
   * Returns null if key is invalid, expired, or revoked.
   *
   * Protected for merchant override
   */
  protected async validateKey(key: string): Promise<ApiKey | null> {
    if (!key.startsWith('trafi_sk_')) {
      return null;
    }

    const hash = createHash('sha256').update(key).digest('hex');

    const apiKey = await this.prisma.apiKey.findUnique({
      where: { keyHash: hash },
    });

    if (!apiKey) {
      return null;
    }

    // Check if revoked
    if (apiKey.revokedAt) {
      return null;
    }

    // Check if expired
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return null;
    }

    // Update lastUsedAt asynchronously (don't wait)
    this.updateLastUsed(apiKey.id).catch((err) => {
      this.logger.error(`Failed to update lastUsedAt for key ${apiKey.id}:`, err);
    });

    return apiKey;
  }

  /**
   * Update the lastUsedAt timestamp for an API key
   */
  protected async updateLastUsed(keyId: string): Promise<void> {
    await this.prisma.apiKey.update({
      where: { id: keyId },
      data: { lastUsedAt: new Date() },
    });
  }

  /**
   * Create a new API key.
   * NOTE: The plain key is returned ONLY in this response - never again.
   *
   * @param storeId - The store ID for tenant isolation
   * @param userId - The user ID creating the key
   * @param input - API key creation data
   * @returns Created API key with plain key (shown only once)
   */
  async create(
    storeId: string,
    userId: string,
    input: CreateApiKeyDto,
  ): Promise<ApiKeyCreatedResponse> {
    const { key, hash, prefix, lastFourChars } = this.generateApiKey();

    const apiKey = await this.prisma.apiKey.create({
      data: {
        storeId,
        createdById: userId,
        name: input.name,
        keyHash: hash,
        keyPrefix: prefix,
        lastFourChars,
        scopes: input.scopes,
        expiresAt: input.expiresAt ?? null,
      },
    });

    this.logger.log(
      `API key created: ${apiKey.name} (${prefix}...${lastFourChars}) for store ${storeId}`,
    );

    return {
      id: apiKey.id,
      name: apiKey.name,
      keyPrefix: apiKey.keyPrefix,
      lastFourChars: apiKey.lastFourChars,
      scopes: apiKey.scopes as ApiKeyResponse['scopes'],
      createdAt: apiKey.createdAt,
      expiresAt: apiKey.expiresAt,
      lastUsedAt: apiKey.lastUsedAt,
      revokedAt: apiKey.revokedAt,
      key, // ONLY returned on creation!
    };
  }

  /**
   * List API keys for a store with pagination
   *
   * @param storeId - The store ID for tenant isolation
   * @param query - Pagination and filter parameters
   * @returns Paginated list of API keys (masked)
   */
  async list(storeId: string, query: ListApiKeysDto): Promise<ApiKeysListResponse> {
    const { page = 1, limit = 20, includeRevoked = false } = query;
    const skip = (page - 1) * limit;

    const where = {
      storeId,
      ...(!includeRevoked && { revokedAt: null }),
    };

    const [apiKeys, total] = await Promise.all([
      this.prisma.apiKey.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: this.getApiKeySelectFields(),
      }),
      this.prisma.apiKey.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: apiKeys.map((apiKey) => this.toApiKeyResponse(apiKey as ApiKey)),
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Get a single API key by ID
   *
   * @param storeId - The store ID for tenant isolation
   * @param keyId - The API key ID
   * @returns API key (masked)
   */
  async findOne(storeId: string, keyId: string): Promise<ApiKeyResponse> {
    const apiKey = await this.findApiKeyOrThrow(keyId, storeId);
    return this.toApiKeyResponse(apiKey);
  }

  /**
   * Revoke an API key immediately
   *
   * @param storeId - The store ID for tenant isolation
   * @param keyId - The API key ID to revoke
   * @returns Revoked API key
   */
  async revoke(storeId: string, keyId: string): Promise<ApiKeyResponse> {
    // Verify key exists and belongs to store
    const existingKey = await this.findApiKeyOrThrow(keyId, storeId);

    if (existingKey.revokedAt) {
      // Already revoked, just return
      return this.toApiKeyResponse(existingKey);
    }

    const apiKey = await this.prisma.apiKey.update({
      where: { id: keyId },
      data: { revokedAt: new Date() },
    });

    this.logger.log(
      `API key revoked: ${apiKey.name} (${apiKey.keyPrefix}...${apiKey.lastFourChars})`,
    );

    return this.toApiKeyResponse(apiKey);
  }

  /**
   * Validate an API key for authentication.
   * Used by ApiKeyGuard for request authentication.
   *
   * @param key - The plain API key from Authorization header
   * @returns ApiKey if valid, null otherwise
   */
  async validateApiKey(key: string): Promise<ApiKey | null> {
    return this.validateKey(key);
  }

  /**
   * Find API key by ID or throw NotFoundException
   * Protected for merchant override
   */
  protected async findApiKeyOrThrow(keyId: string, storeId: string): Promise<ApiKey> {
    const apiKey = await this.prisma.apiKey.findFirst({
      where: { id: keyId, storeId },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    return apiKey;
  }

  /**
   * Get select fields for API key queries
   * Protected for merchant override
   */
  protected getApiKeySelectFields() {
    return {
      id: true,
      name: true,
      keyPrefix: true,
      lastFourChars: true,
      scopes: true,
      createdAt: true,
      expiresAt: true,
      lastUsedAt: true,
      revokedAt: true,
    };
  }

  /**
   * Convert ApiKey entity to ApiKeyResponse
   * Protected for merchant override
   */
  protected toApiKeyResponse(apiKey: ApiKey): ApiKeyResponse {
    return {
      id: apiKey.id,
      name: apiKey.name,
      keyPrefix: apiKey.keyPrefix,
      lastFourChars: apiKey.lastFourChars,
      scopes: apiKey.scopes as ApiKeyResponse['scopes'],
      createdAt: apiKey.createdAt,
      expiresAt: apiKey.expiresAt,
      lastUsedAt: apiKey.lastUsedAt,
      revokedAt: apiKey.revokedAt,
    };
  }
}
