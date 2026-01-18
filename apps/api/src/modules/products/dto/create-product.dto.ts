import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for creating a new product
 *
 * Used for Swagger documentation. Actual validation is done via Zod schemas.
 *
 * @see Story 3.1 - Product Model and Basic CRUD
 */
export class CreateProductDto {
  @ApiProperty({
    description: 'Product title/name',
    example: 'Premium T-Shirt',
    maxLength: 255,
  })
  name!: string;

  @ApiPropertyOptional({
    description: 'URL-friendly slug (auto-generated from name if not provided)',
    example: 'premium-t-shirt',
    maxLength: 255,
  })
  slug?: string;

  @ApiPropertyOptional({
    description: 'Product description',
    example: 'A high-quality cotton t-shirt with premium fabric.',
    maxLength: 10000,
    nullable: true,
  })
  description?: string | null;

  @ApiProperty({
    description: 'Price in cents (ARCH-25). $19.99 = 1999',
    example: 1999,
    minimum: 0,
  })
  priceInCents!: number;

  @ApiPropertyOptional({
    description: 'Product status',
    enum: ['draft', 'active', 'archived'],
    default: 'draft',
    example: 'draft',
  })
  status?: 'draft' | 'active' | 'archived';

  @ApiPropertyOptional({
    description: 'Product type (e.g., Physical, Digital, Service)',
    example: 'Physical',
    maxLength: 100,
    nullable: true,
  })
  productType?: string | null;

  @ApiPropertyOptional({
    description: 'Product vendor/brand',
    example: 'Trafi Apparel',
    maxLength: 255,
    nullable: true,
  })
  vendor?: string | null;

  @ApiPropertyOptional({
    description: 'Tags for filtering and organization',
    example: ['clothing', 'summer', 'featured'],
    type: [String],
    default: [],
  })
  tags?: string[];
}
