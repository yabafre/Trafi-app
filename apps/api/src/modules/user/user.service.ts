import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import type { User, StoreMembership, UserRole, MembershipStatus } from '@generated/prisma/client';
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
 * User with membership context for store operations
 */
interface UserWithMembership {
  user: User;
  membership: StoreMembership;
}

/**
 * User management service for store team administration
 *
 * IMPORTANT: Use `protected` methods (not `private`) to support
 * merchant overrides in @trafi/core distribution model.
 *
 * Multi-store RBAC:
 * - Users can belong to multiple stores via StoreMembership
 * - Role and status are per-membership, not per-user
 * - All queries filter by storeId through memberships
 *
 * @see epic-1-retrospective.md#Trafi-Core-Override-Pattern
 * @see epic-02-admin-auth.md#Story-2.4
 * @see Story 2-R1 - Multi-Store RBAC (StoreMembership Model)
 */
@Injectable()
export class UserService {
  protected readonly logger = new Logger(UserService.name);

  constructor(protected readonly prisma: PrismaService) {}

  /**
   * List all users for a store with pagination
   *
   * Queries via StoreMembership to find users in this store.
   *
   * @param storeId - The store ID for tenant isolation
   * @param query - Pagination and filter parameters (status filters membership status)
   * @returns Paginated list of users with their membership info
   */
  async list(storeId: string, query: ListUsersDto): Promise<UsersListResponseDto> {
    const { page = 1, limit = 20, status } = query;
    const skip = (page - 1) * limit;

    // Map legacy status to membership status
    let membershipStatus: MembershipStatus | undefined;
    if (status === 'ACTIVE') membershipStatus = 'ACTIVE';
    else if (status === 'INACTIVE') membershipStatus = 'SUSPENDED';
    else if (status === 'INVITED') membershipStatus = 'PENDING';

    const membershipWhere = {
      storeId,
      ...(membershipStatus && { status: membershipStatus }),
    };

    const [memberships, total] = await Promise.all([
      this.prisma.$client.storeMembership.findMany({
        where: membershipWhere,
        skip,
        take: limit,
        orderBy: { invitedAt: 'desc' },
        include: {
          user: true,
        },
      }),
      this.prisma.$client.storeMembership.count({ where: membershipWhere }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      users: memberships.map((m) => this.toUserResponse(m.user as User, m)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Invite a new user to the store
   *
   * Creates a new user (if not exists) and a PENDING membership.
   * If user already exists globally, creates membership linking to existing user.
   *
   * @param storeId - The store ID for tenant isolation
   * @param inviterId - The user ID of the inviter
   * @param input - Invite user data
   * @returns Created user with PENDING membership
   */
  async invite(storeId: string, inviterId: string, input: InviteUserDto): Promise<UserResponseDto> {
    // Get inviter with their membership for role validation
    const inviterWithMembership = await this.findUserWithMembershipOrThrow(inviterId, storeId);

    // Validate role hierarchy - inviter cannot assign role higher than their own
    this.validateRoleHierarchy(inviterWithMembership.membership.role as Role, input.role);

    // Check if user already has a membership in this store
    const existingMembership = await this.prisma.$client.storeMembership.findFirst({
      where: {
        storeId,
        user: { email: input.email },
      },
      include: { user: true },
    });

    if (existingMembership) {
      throw new ConflictException('User with this email already has access to this store');
    }

    // Check if email exists globally
    const existingUser = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    // Transaction: Create user (if new) + membership
    const result = await this.prisma.$transaction(async (tx) => {
      let user: User;

      if (existingUser) {
        // User exists globally - just create membership
        user = existingUser;
      } else {
        // Create new user with INVITED status
        user = await tx.user.create({
          data: {
            email: input.email,
            name: input.name,
            status: 'INVITED',
            passwordHash: '', // Will be set when user accepts invite
          },
        });
      }

      // Create PENDING membership
      const membership = await tx.storeMembership.create({
        data: {
          storeId,
          userId: user.id,
          role: input.role as UserRole,
          status: 'PENDING',
        },
      });

      return { user, membership };
    });

    this.logger.log(
      `User invited: ${input.email} with role ${input.role} by ${inviterWithMembership.user.email}`
    );

    // TODO: Send invitation email (or log for dev)
    this.logger.log(`[DEV] Invitation email would be sent to: ${input.email}`);

    return this.toUserResponse(result.user, result.membership);
  }

  /**
   * Update a user's role in this store
   *
   * Updates the role on the StoreMembership (not User).
   *
   * @param storeId - The store ID for tenant isolation
   * @param currentUserId - The user ID of the requester
   * @param targetUserId - The user ID to update
   * @param input - New role data
   * @returns Updated user with new role
   */
  async updateRole(
    storeId: string,
    currentUserId: string,
    targetUserId: string,
    input: UpdateRoleDto
  ): Promise<UserResponseDto> {
    // Get current user with membership
    const current = await this.findUserWithMembershipOrThrow(currentUserId, storeId);

    // Get target user with membership
    const target = await this.findUserWithMembershipOrThrow(targetUserId, storeId);

    // Prevent self-elevation
    if (currentUserId === targetUserId) {
      throw new ForbiddenException('Cannot modify your own role');
    }

    // Validate role hierarchy - cannot assign role higher than own
    this.validateRoleHierarchy(current.membership.role as Role, input.role);

    // Cannot modify user with higher or equal role (except Owner can modify other Owners)
    const currentLevel = ROLE_HIERARCHY[current.membership.role as Role];
    const targetLevel = ROLE_HIERARCHY[target.membership.role as Role];

    if (current.membership.role !== 'OWNER' && targetLevel >= currentLevel) {
      throw new ForbiddenException('Cannot modify user with same or higher role');
    }

    // Update role on membership
    const updatedMembership = await this.prisma.$client.storeMembership.update({
      where: { id: target.membership.id },
      data: { role: input.role as UserRole },
      include: { user: { select: this.getUserSelectFields() } },
    });

    this.logger.log(
      `Role updated: ${target.user.email} from ${target.membership.role} to ${input.role} by ${current.user.email}`
    );

    return this.toUserResponse(updatedMembership.user as User, updatedMembership);
  }

  /**
   * Suspend a user's membership in this store
   *
   * Suspends the StoreMembership (not the User account).
   * User can still access other stores they belong to.
   *
   * @param storeId - The store ID for tenant isolation
   * @param currentUserId - The user ID of the requester
   * @param targetUserId - The user ID to suspend
   * @returns User with suspended membership
   */
  async deactivate(
    storeId: string,
    currentUserId: string,
    targetUserId: string
  ): Promise<UserResponseDto> {
    // Get current user with membership
    const current = await this.findUserWithMembershipOrThrow(currentUserId, storeId);

    // Get target user with membership
    const target = await this.findUserWithMembershipOrThrow(targetUserId, storeId);

    // Prevent self-deactivation
    if (currentUserId === targetUserId) {
      throw new ForbiddenException('Cannot suspend your own membership');
    }

    // Cannot suspend user with higher or equal role (except Owner)
    const currentLevel = ROLE_HIERARCHY[current.membership.role as Role];
    const targetLevel = ROLE_HIERARCHY[target.membership.role as Role];

    if (current.membership.role !== 'OWNER' && targetLevel >= currentLevel) {
      throw new ForbiddenException('Cannot suspend user with same or higher role');
    }

    // Last Owner protection
    if (target.membership.role === 'OWNER') {
      await this.validateLastOwnerProtection(storeId, target.membership.id);
    }

    // Suspend membership (not the user account)
    const updatedMembership = await this.prisma.$client.storeMembership.update({
      where: { id: target.membership.id },
      data: { status: 'SUSPENDED' },
      include: { user: { select: this.getUserSelectFields() } },
    });

    this.logger.log(`Membership suspended: ${target.user.email} by ${current.user.email}`);

    return this.toUserResponse(updatedMembership.user as User, updatedMembership);
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
   * Validate that at least one Owner membership will remain active after suspension
   * Protected for merchant override
   *
   * @param storeId - The store ID
   * @param excludeMembershipId - The membership ID being suspended (to exclude from count)
   */
  protected async validateLastOwnerProtection(
    storeId: string,
    excludeMembershipId: string
  ): Promise<void> {
    const activeOwnerCount = await this.prisma.$client.storeMembership.count({
      where: {
        storeId,
        role: 'OWNER',
        status: 'ACTIVE',
        id: { not: excludeMembershipId },
      },
    });

    if (activeOwnerCount < 1) {
      throw new BadRequestException(
        'Cannot suspend the last Owner - at least one Owner must remain active'
      );
    }
  }

  /**
   * Find user with their active membership in the store, or throw NotFoundException
   * Protected for merchant override
   */
  protected async findUserWithMembershipOrThrow(
    userId: string,
    storeId: string
  ): Promise<UserWithMembership> {
    const membership = await this.prisma.$client.storeMembership.findFirst({
      where: {
        userId,
        storeId,
        status: { in: ['ACTIVE', 'PENDING'] }, // Allow pending members to be managed
      },
      include: { user: true },
    });

    if (!membership) {
      throw new NotFoundException('User not found in this store');
    }

    return {
      user: membership.user,
      membership,
    };
  }

  /**
   * Get select fields for user queries (excludes sensitive data)
   * Protected for merchant override
   *
   * Note: role is now on StoreMembership, not User
   */
  protected getUserSelectFields() {
    return {
      id: true,
      email: true,
      name: true,
      status: true,
      lastLoginAt: true,
      createdAt: true,
    };
  }

  /**
   * Convert User entity with membership to UserResponseDto
   * Protected for merchant override
   *
   * @param user - The user entity
   * @param membership - The user's membership in the current store context
   */
  protected toUserResponse(user: User, membership: StoreMembership): UserResponseDto {
    // Map membership status to legacy status for backward compatibility
    const status = membership.status === 'ACTIVE' ? 'ACTIVE'
      : membership.status === 'SUSPENDED' ? 'INACTIVE'
      : 'INVITED';

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: membership.role as Role,
      status,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };
  }
}
