import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsBoolean,
  IsNumber,
  Min,
  MaxLength,
  Matches,
  IsIn,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Address input for store contact info
 */
export class AddressInputDto {
  @ApiPropertyOptional({
    description: 'Street address',
    example: '123 Commerce Street',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  street?: string;

  @ApiPropertyOptional({
    description: 'City',
    example: 'Paris',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({
    description: 'Postal/ZIP code',
    example: '75001',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @ApiPropertyOptional({
    description: 'Country code (ISO 3166-1 alpha-2)',
    example: 'FR',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  country?: string;
}

/**
 * DTO for updating store settings.
 * All fields are optional - partial updates supported.
 */
export class UpdateStoreSettingsDto {
  // General
  @ApiPropertyOptional({
    description: 'Store display name',
    example: 'My Awesome Store',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Store description',
    example: 'The best products at the best prices',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    description: 'URL-friendly store identifier (lowercase, hyphens, numbers only)',
    example: 'my-awesome-store',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase with hyphens and numbers only',
  })
  slug?: string;

  // Localization
  @ApiPropertyOptional({
    description: 'Default currency code (ISO 4217)',
    example: 'EUR',
  })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  @Matches(/^[A-Z]{3}$/, {
    message: 'Currency must be a 3-letter ISO 4217 code',
  })
  defaultCurrency?: string;

  @ApiPropertyOptional({
    description: 'Default locale',
    example: 'en',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z]{2}(-[A-Z]{2})?$/, {
    message: 'Locale must be in format "en" or "en-US"',
  })
  defaultLocale?: string;

  @ApiPropertyOptional({
    description: 'Store timezone (IANA format)',
    example: 'Europe/Paris',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  timezone?: string;

  @ApiPropertyOptional({
    description: 'Weight measurement unit',
    example: 'g',
    enum: ['g', 'kg', 'lb', 'oz'],
  })
  @IsOptional()
  @IsIn(['g', 'kg', 'lb', 'oz'])
  weightUnit?: string;

  // Business
  @ApiPropertyOptional({
    description: 'Are prices displayed with tax included',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  taxIncluded?: boolean;

  @ApiPropertyOptional({
    description: 'Automatically archive completed orders',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  autoArchiveOrders?: boolean;

  @ApiPropertyOptional({
    description: 'Prefix for order numbers',
    example: 'ORD-',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  orderNumberPrefix?: string;

  @ApiPropertyOptional({
    description: 'Threshold for low stock notifications',
    example: 5,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  lowStockThreshold?: number;

  // Contact
  @ApiPropertyOptional({
    description: 'Primary contact email',
    example: 'contact@mystore.com',
  })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional({
    description: 'Customer support email',
    example: 'support@mystore.com',
  })
  @IsOptional()
  @IsEmail()
  supportEmail?: string;

  @ApiPropertyOptional({
    description: 'Contact phone number',
    example: '+33 1 23 45 67 89',
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'Store address',
    type: AddressInputDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressInputDto)
  address?: AddressInputDto;

  // Brand
  @ApiPropertyOptional({
    description: 'Primary brand color (hex)',
    example: '#CCFF00',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'Primary color must be a valid hex color (e.g., #CCFF00)',
  })
  primaryColor?: string;

  @ApiPropertyOptional({
    description: 'Store logo URL',
    example: 'https://cdn.example.com/logo.png',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  logoUrl?: string;

  @ApiPropertyOptional({
    description: 'Store favicon URL',
    example: 'https://cdn.example.com/favicon.ico',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  faviconUrl?: string;
}
