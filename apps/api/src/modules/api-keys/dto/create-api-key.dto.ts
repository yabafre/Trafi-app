import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDate, IsOptional, IsString, MinLength, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import type { ApiKeyScope } from '@trafi/validators';

/**
 * DTO for creating a new API key.
 */
export class CreateApiKeyDto {
  @ApiProperty({
    description: 'Human-readable name for the API key',
    example: 'Production Integration',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({
    description: 'Array of scopes the API key will have access to',
    example: ['products:read', 'orders:read'],
    enum: [
      'products:read',
      'products:write',
      'orders:read',
      'orders:write',
      'customers:read',
      'inventory:read',
      'inventory:write',
    ],
    isArray: true,
  })
  @IsArray()
  @ArrayMinSize(1)
  scopes!: ApiKeyScope[];

  @ApiPropertyOptional({
    description: 'Optional expiration date for the API key (ISO 8601)',
    example: '2026-12-31T23:59:59.000Z',
    type: Date,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expiresAt?: Date;
}
