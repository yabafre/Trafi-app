import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import type { Role } from '@trafi/types';

/**
 * DTO for inviting a new user to the store
 * Validates email format and role assignment
 */
export class InviteUserDto {
  @ApiProperty({
    description: 'Email address for the invited user',
    example: 'newadmin@example.com',
    format: 'email',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Role to assign to the invited user',
    enum: ['OWNER', 'ADMIN', 'EDITOR', 'VIEWER'],
    example: 'ADMIN',
  })
  @IsEnum(['OWNER', 'ADMIN', 'EDITOR', 'VIEWER'])
  role!: Role;

  @ApiPropertyOptional({
    description: 'Optional invitation message',
    example: 'Welcome to our team!',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}
