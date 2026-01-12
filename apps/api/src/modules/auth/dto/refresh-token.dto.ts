import { ApiProperty } from '@nestjs/swagger';

/**
 * Refresh token request DTO for Swagger documentation
 */
export class RefreshTokenDto {
  @ApiProperty({
    description: 'JWT refresh token obtained from login',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken!: string;
}
