import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

/**
 * DTO for confirming an ownership transfer.
 * Only the target user can confirm with their password.
 */
export class ConfirmTransferDto {
  @ApiProperty({
    description: 'Password for re-confirmation',
    example: 'MySecurePassword123',
  })
  @IsString()
  @MinLength(1)
  password!: string;
}
