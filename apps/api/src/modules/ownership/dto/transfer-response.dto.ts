import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { TransferStatus } from '@trafi/validators';

/**
 * DTO for user reference in transfer records.
 */
export class TransferUserDto {
  @ApiProperty({
    description: 'User ID',
    example: 'clw123abc456',
  })
  id!: string;

  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
  })
  email!: string;

  @ApiPropertyOptional({
    description: 'User display name',
    example: 'John Doe',
    nullable: true,
  })
  name!: string | null;
}

/**
 * DTO for ownership transfer response.
 */
export class TransferResponseDto {
  @ApiProperty({
    description: 'Transfer ID',
    example: 'clw789xyz123',
  })
  id!: string;

  @ApiProperty({
    description: 'Store ID',
    example: 'clw456def789',
  })
  storeId!: string;

  @ApiProperty({
    description: 'User initiating the transfer (current owner)',
    type: TransferUserDto,
  })
  fromUser!: TransferUserDto;

  @ApiProperty({
    description: 'User receiving the ownership',
    type: TransferUserDto,
  })
  toUser!: TransferUserDto;

  @ApiProperty({
    description: 'Current status of the transfer',
    enum: ['pending', 'confirmed', 'cancelled'],
    example: 'pending',
  })
  status!: TransferStatus;

  @ApiPropertyOptional({
    description: 'Reason for the transfer',
    example: 'Handing over to new business owner',
    nullable: true,
  })
  reason!: string | null;

  @ApiProperty({
    description: 'Expiration timestamp (72 hours from creation)',
    example: '2026-01-20T10:00:00.000Z',
  })
  expiresAt!: string;

  @ApiPropertyOptional({
    description: 'Completion timestamp (when confirmed)',
    example: null,
    nullable: true,
  })
  completedAt!: string | null;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2026-01-17T10:00:00.000Z',
  })
  createdAt!: string;
}
