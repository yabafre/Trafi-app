import { ApiProperty } from '@nestjs/swagger';

/**
 * Login request DTO for Swagger documentation
 */
export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'admin@trafi.dev',
    format: 'email',
  })
  email!: string;

  @ApiProperty({
    description: 'User password (8-128 characters)',
    example: 'SecurePassword123!',
    minLength: 8,
    maxLength: 128,
  })
  password!: string;
}
