import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for listing products with pagination and filtering
 *
 * @see Story 3.1 - Product Model and Basic CRUD
 */
export class ListProductsQueryDto {
  @ApiPropertyOptional({
    description: 'Page number (1-indexed)',
    example: 1,
    minimum: 1,
    default: 1,
  })
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  limit?: number;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    example: 'createdAt',
    enum: ['name', 'createdAt', 'updatedAt', 'priceInCents', 'status'],
  })
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'desc',
    example: 'desc',
  })
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({
    description: 'Filter by product status',
    enum: ['draft', 'active', 'archived'],
    example: 'active',
  })
  status?: 'draft' | 'active' | 'archived';

  @ApiPropertyOptional({
    description: 'Search in name, description, and vendor',
    example: 't-shirt',
    maxLength: 100,
  })
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by product type',
    example: 'Physical',
  })
  productType?: string;

  @ApiPropertyOptional({
    description: 'Filter by vendor',
    example: 'Trafi Apparel',
  })
  vendor?: string;

  @ApiPropertyOptional({
    description: 'Filter by tags (OR match)',
    example: ['featured', 'sale'],
    type: [String],
  })
  tags?: string[];
}
