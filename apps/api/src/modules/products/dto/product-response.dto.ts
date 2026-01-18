import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for product API response
 *
 * @see Story 3.1 - Product Model and Basic CRUD
 */
export class ProductResponseDto {
  @ApiProperty({
    description: 'Product ID with prod_ prefix',
    example: 'prod_abc123def456789012',
  })
  id!: string;

  @ApiProperty({
    description: 'Store ID this product belongs to',
    example: 'store_xyz789abc123',
  })
  storeId!: string;

  @ApiProperty({
    description: 'Product title/name',
    example: 'Premium T-Shirt',
  })
  name!: string;

  @ApiProperty({
    description: 'URL-friendly slug (unique within store)',
    example: 'premium-t-shirt',
  })
  slug!: string;

  @ApiPropertyOptional({
    description: 'Product description',
    example: 'A high-quality cotton t-shirt.',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({
    description: 'Price in cents (ARCH-25). $19.99 = 1999',
    example: 1999,
  })
  priceInCents!: number;

  @ApiProperty({
    description: 'Product status',
    enum: ['draft', 'active', 'archived'],
    example: 'active',
  })
  status!: 'draft' | 'active' | 'archived';

  @ApiPropertyOptional({
    description: 'Product type',
    example: 'Physical',
    nullable: true,
  })
  productType!: string | null;

  @ApiPropertyOptional({
    description: 'Product vendor/brand',
    example: 'Trafi Apparel',
    nullable: true,
  })
  vendor!: string | null;

  @ApiProperty({
    description: 'Tags for filtering',
    example: ['clothing', 'featured'],
    type: [String],
  })
  tags!: string[];

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2026-01-17T10:30:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2026-01-17T10:30:00.000Z',
  })
  updatedAt!: Date;
}

/**
 * DTO for paginated products response
 */
export class PaginatedProductsResponseDto {
  @ApiProperty({
    description: 'List of products',
    type: [ProductResponseDto],
  })
  items!: ProductResponseDto[];

  @ApiProperty({
    description: 'Total number of products matching query',
    example: 42,
  })
  total!: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page!: number;

  @ApiProperty({
    description: 'Items per page',
    example: 20,
  })
  limit!: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 3,
  })
  totalPages!: number;
}
