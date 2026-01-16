import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import {
  InviteUserDto,
  UpdateRoleDto,
  ListUsersDto,
  UserResponseDto,
  UsersListResponseDto,
} from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@trafi/types';

/**
 * User management controller for store team administration
 *
 * All endpoints require authentication and appropriate permissions.
 * Uses multi-tenancy - users are scoped to the authenticated user's store.
 *
 * @see epic-02-admin-auth.md#Story-2.4
 */
@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * List all users in the authenticated user's store
   */
  @Get()
  @RequirePermissions('users:read')
  @ApiOperation({
    summary: 'List store users',
    description: 'Returns a paginated list of users for the authenticated store. Supports filtering by status.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (1-indexed)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (max 100)',
    example: 20,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['ACTIVE', 'INACTIVE', 'INVITED'],
    description: 'Filter by user status',
  })
  @ApiResponse({
    status: 200,
    description: 'Users list retrieved successfully',
    type: UsersListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async list(
    @Query() query: ListUsersDto,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<UsersListResponseDto> {
    return this.userService.list(user.storeId, query);
  }

  /**
   * Invite a new user to the store
   */
  @Post('invite')
  @RequirePermissions('users:invite')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Invite new user',
    description:
      'Invites a new user to the store. The user will receive an invitation email (logged in development). The inviter cannot assign a role higher than their own.',
  })
  @ApiResponse({
    status: 201,
    description: 'User invited successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions or role hierarchy violation' })
  @ApiResponse({ status: 409, description: 'Conflict - user with this email already exists' })
  async invite(
    @Body() input: InviteUserDto,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<UserResponseDto> {
    return this.userService.invite(user.storeId, user.id, input);
  }

  /**
   * Update a user's role
   */
  @Patch(':id/role')
  @RequirePermissions('users:manage')
  @ApiOperation({
    summary: 'Update user role',
    description:
      'Updates the role of an existing user. Cannot assign a role higher than your own. Cannot modify users with same or higher role (unless you are Owner).',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID to update',
    example: 'usr_clk2x3y4z0001qr5s6t7u8v9w',
  })
  @ApiResponse({
    status: 200,
    description: 'User role updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions, role hierarchy violation, or attempting to modify own role' })
  @ApiResponse({ status: 404, description: 'Not found - user does not exist' })
  async updateRole(
    @Param('id') targetUserId: string,
    @Body() input: UpdateRoleDto,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<UserResponseDto> {
    return this.userService.updateRole(user.storeId, user.id, targetUserId, input);
  }

  /**
   * Deactivate a user account
   */
  @Patch(':id/deactivate')
  @RequirePermissions('users:manage')
  @ApiOperation({
    summary: 'Deactivate user',
    description:
      'Deactivates a user account, preventing login. Cannot deactivate the last Owner. Cannot deactivate users with same or higher role (unless you are Owner).',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID to deactivate',
    example: 'usr_clk2x3y4z0001qr5s6t7u8v9w',
  })
  @ApiResponse({
    status: 200,
    description: 'User deactivated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - cannot deactivate last Owner' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions, role hierarchy violation, or attempting to deactivate self' })
  @ApiResponse({ status: 404, description: 'Not found - user does not exist' })
  async deactivate(
    @Param('id') targetUserId: string,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<UserResponseDto> {
    return this.userService.deactivate(user.storeId, user.id, targetUserId);
  }
}
