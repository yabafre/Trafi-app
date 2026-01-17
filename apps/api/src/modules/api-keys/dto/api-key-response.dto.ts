import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ApiKeyScope } from '@trafi/validators';

/**
 * DTO for API key response (used in list/get operations).
 * Does NOT include the actual key - only masked version.
 */
export class ApiKeyResponseDto {
  @ApiProperty({
    description: 'Unique identifier',
    example: 'clw123abc456',
  })
  id!: string;

  @ApiProperty({
    description: 'Human-readable name',
    example: 'Production Integration',
  })
  name!: string;

  @ApiProperty({
    description: 'Key prefix for identification (first 18 chars)',
    example: 'trafi_sk_a1b2c3d4',
  })
  keyPrefix!: string;

  @ApiProperty({
    description: 'Last 4 characters of the key for identification',
    example: 'f6e5',
  })
  lastFourChars!: string;

  @ApiProperty({
    description: 'Array of scopes the key has access to',
    example: ['products:read', 'orders:read'],
    isArray: true,
  })
  scopes!: ApiKeyScope[];

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2026-01-16T10:00:00.000Z',
  })
  createdAt!: Date;

  @ApiPropertyOptional({
    description: 'Expiration timestamp (null if no expiration)',
    example: '2026-12-31T23:59:59.000Z',
    nullable: true,
  })
  expiresAt!: Date | null;

  @ApiPropertyOptional({
    description: 'Last time the key was used (null if never used)',
    example: '2026-01-16T15:30:00.000Z',
    nullable: true,
  })
  lastUsedAt!: Date | null;

  @ApiPropertyOptional({
    description: 'Revocation timestamp (null if not revoked)',
    example: null,
    nullable: true,
  })
  revokedAt!: Date | null;
}

/**
 * DTO for API key creation response.
 * This is the ONLY response that includes the full key.
 */
export class ApiKeyCreatedResponseDto extends ApiKeyResponseDto {
  @ApiProperty({
    description: 'The full API key - SHOWN ONLY ONCE',
    example: 'trafi_sk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6',
  })
  key!: string;
}

/**
 * DTO for paginated API keys list response.
 */
export class ApiKeysListResponseDto {
  @ApiProperty({
    description: 'Array of API keys',
    type: [ApiKeyResponseDto],
  })
  data!: ApiKeyResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    example: { page: 1, limit: 20, total: 5, totalPages: 1 },
  })
  meta!: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
