import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import type { Role } from '@trafi/types';

/**
 * DTO for updating a user's role
 */
export class UpdateRoleDto {
  @ApiProperty({
    description: 'New role to assign to the user',
    enum: ['OWNER', 'ADMIN', 'EDITOR', 'VIEWER'],
    example: 'EDITOR',
  })
  @IsEnum(['OWNER', 'ADMIN', 'EDITOR', 'VIEWER'])
  role!: Role;
}
