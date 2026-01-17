import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

/**
 * DTO for initiating an ownership transfer.
 * Requires password re-confirmation for security.
 */
export class InitiateTransferDto {
  @ApiProperty({
    description: 'User ID of the target user to receive ownership',
    example: 'clw123abc456',
  })
  @IsString()
  @MinLength(1)
  targetUserId!: string;

  @ApiProperty({
    description: 'Current password for re-confirmation',
    example: 'MySecurePassword123',
  })
  @IsString()
  @MinLength(1)
  password!: string;

  @ApiPropertyOptional({
    description: 'Optional reason for the ownership transfer',
    example: 'Handing over to new business owner',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
