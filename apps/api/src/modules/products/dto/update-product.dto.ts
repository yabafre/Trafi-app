import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for updating a product (partial updates)
 *
 * All fields are optional - only provided fields will be updated.
 *
 * @see Story 3.1 - Product Model and Basic CRUD
 */
export class UpdateProductDto {
  @ApiPropertyOptional({
    description: 'Product title/name',
    example: 'Updated T-Shirt Name',
    maxLength: 255,
  })
  name?: string;

  @ApiPropertyOptional({
    description: 'URL-friendly slug',
    example: 'updated-t-shirt-name',
    maxLength: 255,
  })
  slug?: string;

  @ApiPropertyOptional({
    description: 'Product description',
    example: 'Updated product description.',
    maxLength: 10000,
    nullable: true,
  })
  description?: string | null;

  @ApiPropertyOptional({
    description: 'Price in cents (ARCH-25). $29.99 = 2999',
    example: 2999,
    minimum: 0,
  })
  priceInCents?: number;

  @ApiPropertyOptional({
    description: 'Product status',
    enum: ['draft', 'active', 'archived'],
    example: 'active',
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
    example: 'Updated Brand',
    maxLength: 255,
    nullable: true,
  })
  vendor?: string | null;

  @ApiPropertyOptional({
    description: 'Tags for filtering and organization',
    example: ['sale', 'featured'],
    type: [String],
  })
  tags?: string[];
}
