import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import type { User } from '@generated/prisma/client';
import type { Role } from '@trafi/types';
import type { InviteUserDto, ListUsersDto, UpdateRoleDto } from './dto';
import type { UserResponseDto, UsersListResponseDto } from './dto';

/**
 * Role hierarchy levels - higher number = more powerful
 */
const ROLE_HIERARCHY: Record<Role, number> = {
  VIEWER: 0,
  EDITOR: 1,
  ADMIN: 2,
  OWNER: 3,
};

/**
 * User management service for store team administration
 *
 * IMPORTANT: Use `protected` methods (not `private`) to support
 * merchant overrides in @trafi/core distribution model.
 *
 * Tenant Isolation (Defense-in-Depth):
 * - Public methods take explicit storeId for clear API contract (primary enforcement)
 * - TenantInterceptor provides context via AsyncLocalStorage for audit logging
 * - PrismaService.validateTenantOwnership() helper validates resource ownership
 * - Note: Prisma 7 deprecated $use() middleware, so we use explicit storeId + helpers
 *
 * @see epic-1-retrospective.md#Trafi-Core-Override-Pattern
 * @see epic-02-admin-auth.md#Story-2.4
 * @see Story 2.6 - Tenant-Scoped Authorization
 */
@Injectable()
export class UserService {
  protected readonly logger = new Logger(UserService.name);

  constructor(protected readonly prisma: PrismaService) {}

  /**
   * List all users for a store with pagination
   *
   * @param storeId - The store ID for tenant isolation
   * @param query - Pagination and filter parameters
   * @returns Paginated list of users
   */
  async list(storeId: string, query: ListUsersDto): Promise<UsersListResponseDto> {
    const { page = 1, limit = 20, status } = query;
    const skip = (page - 1) * limit;

    const where = {
      storeId,
      ...(status && { status }),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: this.getUserSelectFields(),
      }),
      this.prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      users: users.map((user) => this.toUserResponse(user as User)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Invite a new user to the store
   *
   * @param storeId - The store ID for tenant isolation
   * @param inviterId - The user ID of the inviter
   * @param input - Invite user data
   * @returns Created user with INVITED status
   */
  async invite(storeId: string, inviterId: string, input: InviteUserDto): Promise<UserResponseDto> {
    // Get inviter's role
    const inviter = await this.findUserOrThrow(inviterId, storeId);

    // Validate role hierarchy - inviter cannot assign role higher than their own
    this.validateRoleHierarchy(inviter.role as Role, input.role);

    // Check if email already exists in this store
    const existingUser = await this.prisma.user.findFirst({
      where: { email: input.email, storeId },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists in this store');
    }

    // Check if email exists globally (for security message)
    const existingGlobalUser = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingGlobalUser) {
      // Don't reveal exact error - security best practice
      throw new ConflictException('This email cannot be used for invitation');
    }

    // Create user with INVITED status and temporary password hash
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        role: input.role,
        status: 'INVITED',
        storeId,
        passwordHash: '', // Will be set when user accepts invite
      },
      select: this.getUserSelectFields(),
    });

    this.logger.log(`User invited: ${input.email} with role ${input.role} by ${inviter.email}`);

    // TODO: Send invitation email (or log for dev)
    this.logger.log(`[DEV] Invitation email would be sent to: ${input.email}`);

    return this.toUserResponse(user as User);
  }

  /**
   * Update a user's role
   *
   * @param storeId - The store ID for tenant isolation
   * @param currentUserId - The user ID of the requester
   * @param targetUserId - The user ID to update
   * @param input - New role data
   * @returns Updated user
   */
  async updateRole(
    storeId: string,
    currentUserId: string,
    targetUserId: string,
    input: UpdateRoleDto
  ): Promise<UserResponseDto> {
    // Get current user's role
    const currentUser = await this.findUserOrThrow(currentUserId, storeId);

    // Get target user
    const targetUser = await this.findUserOrThrow(targetUserId, storeId);

    // Prevent self-elevation
    if (currentUserId === targetUserId) {
      throw new ForbiddenException('Cannot modify your own role');
    }

    // Validate role hierarchy - cannot assign role higher than own
    this.validateRoleHierarchy(currentUser.role as Role, input.role);

    // Cannot modify user with higher or equal role (except Owner can modify other Owners)
    const currentLevel = ROLE_HIERARCHY[currentUser.role as Role];
    const targetLevel = ROLE_HIERARCHY[targetUser.role as Role];

    if (currentUser.role !== 'OWNER' && targetLevel >= currentLevel) {
      throw new ForbiddenException('Cannot modify user with same or higher role');
    }

    // Update role
    const updatedUser = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { role: input.role },
      select: this.getUserSelectFields(),
    });

    this.logger.log(
      `Role updated: ${targetUser.email} from ${targetUser.role} to ${input.role} by ${currentUser.email}`
    );

    return this.toUserResponse(updatedUser as User);
  }

  /**
   * Deactivate a user account
   *
   * @param storeId - The store ID for tenant isolation
   * @param currentUserId - The user ID of the requester
   * @param targetUserId - The user ID to deactivate
   * @returns Deactivated user
   */
  async deactivate(
    storeId: string,
    currentUserId: string,
    targetUserId: string
  ): Promise<UserResponseDto> {
    // Get current user
    const currentUser = await this.findUserOrThrow(currentUserId, storeId);

    // Get target user
    const targetUser = await this.findUserOrThrow(targetUserId, storeId);

    // Prevent self-deactivation
    if (currentUserId === targetUserId) {
      throw new ForbiddenException('Cannot deactivate your own account');
    }

    // Cannot deactivate user with higher or equal role (except Owner)
    const currentLevel = ROLE_HIERARCHY[currentUser.role as Role];
    const targetLevel = ROLE_HIERARCHY[targetUser.role as Role];

    if (currentUser.role !== 'OWNER' && targetLevel >= currentLevel) {
      throw new ForbiddenException('Cannot deactivate user with same or higher role');
    }

    // Last Owner protection
    if (targetUser.role === 'OWNER') {
      await this.validateLastOwnerProtection(storeId, targetUserId);
    }

    // Deactivate user
    const updatedUser = await this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        status: 'INACTIVE',
        refreshTokenHash: null, // Invalidate all sessions
      },
      select: this.getUserSelectFields(),
    });

    this.logger.log(`User deactivated: ${targetUser.email} by ${currentUser.email}`);

    return this.toUserResponse(updatedUser as User);
  }

  /**
   * Validate role hierarchy - current user cannot assign role higher than their own
   * Protected for merchant override (e.g., custom role hierarchies)
   */
  protected validateRoleHierarchy(currentRole: Role, targetRole: Role): void {
    const currentLevel = ROLE_HIERARCHY[currentRole];
    const targetLevel = ROLE_HIERARCHY[targetRole];

    if (targetLevel > currentLevel) {
      throw new ForbiddenException(
        `Cannot assign role ${targetRole} - exceeds your permission level`
      );
    }
  }

  /**
   * Validate that at least one Owner will remain after deactivation
   * Protected for merchant override
   */
  protected async validateLastOwnerProtection(
    storeId: string,
    targetUserId: string
  ): Promise<void> {
    const activeOwnerCount = await this.prisma.user.count({
      where: {
        storeId,
        role: 'OWNER',
        status: 'ACTIVE',
        id: { not: targetUserId },
      },
    });

    if (activeOwnerCount < 1) {
      throw new BadRequestException(
        'Cannot deactivate the last Owner - at least one Owner must remain active'
      );
    }
  }

  /**
   * Find user by ID or throw NotFoundException
   * Protected for merchant override
   */
  protected async findUserOrThrow(userId: string, storeId: string): Promise<User> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, storeId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Get select fields for user queries (excludes sensitive data)
   * Protected for merchant override
   */
  protected getUserSelectFields() {
    return {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      lastLoginAt: true,
      createdAt: true,
      storeId: true,
    };
  }

  /**
   * Convert User entity to UserResponseDto
   * Protected for merchant override
   */
  protected toUserResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as Role,
      status: user.status as 'ACTIVE' | 'INACTIVE' | 'INVITED',
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };
  }
}
