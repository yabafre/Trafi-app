import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Role } from '@trafi/types';

/**
 * User response DTO for API responses
 * Excludes sensitive fields like passwordHash
 */
export class UserResponseDto {
  @ApiProperty({
    description: 'Unique user identifier',
    example: 'usr_clk2x3y4z0001qr5s6t7u8v9w',
  })
  id!: string;

  @ApiProperty({
    description: 'User email address',
    example: 'admin@example.com',
    format: 'email',
  })
  email!: string;

  @ApiPropertyOptional({
    description: 'User display name',
    example: 'John Doe',
    nullable: true,
  })
  name!: string | null;

  @ApiProperty({
    description: 'User role',
    enum: ['OWNER', 'ADMIN', 'EDITOR', 'VIEWER'],
    example: 'ADMIN',
  })
  role!: Role;

  @ApiProperty({
    description: 'User status',
    enum: ['ACTIVE', 'INACTIVE', 'INVITED'],
    example: 'ACTIVE',
  })
  status!: 'ACTIVE' | 'INACTIVE' | 'INVITED';

  @ApiPropertyOptional({
    description: 'Last login timestamp',
    example: '2026-01-16T10:30:00.000Z',
    format: 'date-time',
    nullable: true,
  })
  lastLoginAt!: Date | null;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2026-01-01T00:00:00.000Z',
    format: 'date-time',
  })
  createdAt!: Date;
}

/**
 * Paginated users list response
 */
export class UsersListResponseDto {
  @ApiProperty({
    description: 'List of users',
    type: [UserResponseDto],
  })
  users!: UserResponseDto[];

  @ApiProperty({
    description: 'Total number of users matching the query',
    example: 25,
  })
  total!: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page!: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 20,
  })
  limit!: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 2,
  })
  totalPages!: number;
}
