import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Address structure for store contact info
 */
export class AddressDto {
  @ApiPropertyOptional({
    description: 'Street address',
    example: '123 Commerce Street',
  })
  street?: string;

  @ApiPropertyOptional({
    description: 'City',
    example: 'Paris',
  })
  city?: string;

  @ApiPropertyOptional({
    description: 'Postal/ZIP code',
    example: '75001',
  })
  postalCode?: string;

  @ApiPropertyOptional({
    description: 'Country code (ISO 3166-1 alpha-2)',
    example: 'FR',
  })
  country?: string;
}

/**
 * DTO for store settings response
 */
export class StoreSettingsResponseDto {
  @ApiProperty({
    description: 'Settings record ID',
    example: 'clw123abc456',
  })
  id!: string;

  @ApiProperty({
    description: 'Store ID this settings belongs to',
    example: 'clw123store789',
  })
  storeId!: string;

  // General
  @ApiProperty({
    description: 'Store display name',
    example: 'My Awesome Store',
  })
  name!: string;

  @ApiPropertyOptional({
    description: 'Store description',
    example: 'The best products at the best prices',
    nullable: true,
  })
  description!: string | null;

  @ApiPropertyOptional({
    description: 'URL-friendly store identifier',
    example: 'my-awesome-store',
    nullable: true,
  })
  slug!: string | null;

  // Localization
  @ApiProperty({
    description: 'Default currency code (ISO 4217)',
    example: 'EUR',
  })
  defaultCurrency!: string;

  @ApiProperty({
    description: 'Default locale',
    example: 'en',
  })
  defaultLocale!: string;

  @ApiProperty({
    description: 'Store timezone (IANA format)',
    example: 'Europe/Paris',
  })
  timezone!: string;

  @ApiProperty({
    description: 'Weight measurement unit',
    example: 'g',
    enum: ['g', 'kg', 'lb', 'oz'],
  })
  weightUnit!: string;

  // Business
  @ApiProperty({
    description: 'Are prices displayed with tax included',
    example: true,
  })
  taxIncluded!: boolean;

  @ApiProperty({
    description: 'Automatically archive completed orders',
    example: false,
  })
  autoArchiveOrders!: boolean;

  @ApiProperty({
    description: 'Prefix for order numbers',
    example: 'ORD-',
  })
  orderNumberPrefix!: string;

  @ApiProperty({
    description: 'Threshold for low stock notifications',
    example: 5,
  })
  lowStockThreshold!: number;

  // Contact
  @ApiPropertyOptional({
    description: 'Primary contact email',
    example: 'contact@mystore.com',
    nullable: true,
  })
  contactEmail!: string | null;

  @ApiPropertyOptional({
    description: 'Customer support email',
    example: 'support@mystore.com',
    nullable: true,
  })
  supportEmail!: string | null;

  @ApiPropertyOptional({
    description: 'Contact phone number',
    example: '+33 1 23 45 67 89',
    nullable: true,
  })
  phoneNumber!: string | null;

  @ApiPropertyOptional({
    description: 'Store address',
    type: AddressDto,
    nullable: true,
  })
  address!: AddressDto | null;

  // Brand
  @ApiProperty({
    description: 'Primary brand color (hex)',
    example: '#CCFF00',
  })
  primaryColor!: string;

  @ApiPropertyOptional({
    description: 'Store logo URL',
    example: 'https://cdn.example.com/logo.png',
    nullable: true,
  })
  logoUrl!: string | null;

  @ApiPropertyOptional({
    description: 'Store favicon URL',
    example: 'https://cdn.example.com/favicon.ico',
    nullable: true,
  })
  faviconUrl!: string | null;

  // Timestamps
  @ApiProperty({
    description: 'Record creation timestamp',
    example: '2026-01-17T10:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Record last update timestamp',
    example: '2026-01-17T15:30:00.000Z',
  })
  updatedAt!: Date;
}
