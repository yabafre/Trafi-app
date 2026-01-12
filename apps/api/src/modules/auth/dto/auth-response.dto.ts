import { ApiProperty } from '@nestjs/swagger';

/**
 * Authenticated user DTO for Swagger documentation
 */
export class AuthenticatedUserDto {
  @ApiProperty({
    description: 'User ID',
    example: 'clm1234567890abcdef',
  })
  id!: string;

  @ApiProperty({
    description: 'User email address',
    example: 'admin@trafi.dev',
  })
  email!: string;

  @ApiProperty({
    description: 'User display name',
    example: 'John Doe',
    nullable: true,
  })
  name!: string | null;

  @ApiProperty({
    description: 'User role in the store',
    enum: ['OWNER', 'ADMIN', 'EDITOR', 'VIEWER'],
    example: 'ADMIN',
  })
  role!: string;

  @ApiProperty({
    description: 'Store/tenant ID the user belongs to',
    example: 'store_clm1234567890',
  })
  storeId!: string;

  @ApiProperty({
    description: 'User permissions array',
    type: [String],
    example: ['products:read', 'products:write', 'orders:read'],
  })
  permissions!: string[];
}

/**
 * Authentication response DTO for Swagger documentation
 */
export class AuthResponseDto {
  @ApiProperty({
    description: 'Authenticated user information',
    type: AuthenticatedUserDto,
  })
  user!: AuthenticatedUserDto;

  @ApiProperty({
    description: 'JWT access token (short-lived, 15 minutes)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken!: string;

  @ApiProperty({
    description: 'JWT refresh token (long-lived, 7 days)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken!: string;

  @ApiProperty({
    description: 'Access token expiration time in seconds',
    example: 900,
  })
  expiresIn!: number;
}

/**
 * Error response DTO for Swagger documentation
 */
export class ErrorResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 401,
  })
  statusCode!: number;

  @ApiProperty({
    description: 'Error message',
    example: 'Invalid credentials',
  })
  message!: string;

  @ApiProperty({
    description: 'Error type',
    example: 'Unauthorized',
  })
  error!: string;
}
