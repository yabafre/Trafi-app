import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type { StoreMembership, UserRole, MembershipStatus } from '@generated/prisma/client';

/**
 * StoreMembershipService - Multi-store RBAC management
 *
 * Manages user memberships to stores, enabling users to belong to multiple
 * stores with different roles. Replaces the previous User.storeId pattern.
 *
 * Key behaviors:
 * - Users can have ONE membership per store (compound unique constraint)
 * - Memberships start as PENDING and must be accepted to become ACTIVE
 * - Roles are per-membership, not per-user (different roles in different stores)
 * - Hard deletes (not soft delete - memberships are low-value junction records)
 *
 * @see Story 2-R1 - Multi-Store RBAC (StoreMembership Model)
 */
@Injectable()
export class StoreMembershipService {
  private readonly logger = new Logger(StoreMembershipService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new store membership.
   *
   * Creates a PENDING membership by default. The user must accept the
   * invitation to become an ACTIVE member.
   *
   * @param storeId - Store ID
   * @param userId - User ID
   * @param role - Role for this membership (default: VIEWER)
   * @returns Created membership
   * @throws ConflictException if membership already exists
   */
  async create(
    storeId: string,
    userId: string,
    role: UserRole = 'VIEWER',
  ): Promise<StoreMembership> {
    // Check if membership already exists
    const existing = await this.prisma.$client.storeMembership.findUnique({
      where: {
        storeId_userId: { storeId, userId },
      },
    });

    if (existing) {
      throw new ConflictException(
        `User ${userId} already has a membership in store ${storeId}`,
      );
    }

    const membership = await this.prisma.$client.storeMembership.create({
      data: {
        storeId,
        userId,
        role,
        status: 'PENDING',
      },
    });

    this.logger.log(
      `Membership created: ${membership.id} (user ${userId} → store ${storeId}, role ${role})`,
    );

    return membership;
  }

  /**
   * Create a membership with ACTIVE status (immediate access).
   *
   * Used when the owner creates the first membership or when
   * auto-accepting invitations.
   *
   * @param storeId - Store ID
   * @param userId - User ID
   * @param role - Role for this membership
   * @returns Created membership with ACTIVE status
   */
  async createActive(
    storeId: string,
    userId: string,
    role: UserRole,
  ): Promise<StoreMembership> {
    // Check if membership already exists
    const existing = await this.prisma.$client.storeMembership.findUnique({
      where: {
        storeId_userId: { storeId, userId },
      },
    });

    if (existing) {
      throw new ConflictException(
        `User ${userId} already has a membership in store ${storeId}`,
      );
    }

    const now = new Date();
    const membership = await this.prisma.$client.storeMembership.create({
      data: {
        storeId,
        userId,
        role,
        status: 'ACTIVE',
        acceptedAt: now,
      },
    });

    this.logger.log(
      `Active membership created: ${membership.id} (user ${userId} → store ${storeId}, role ${role})`,
    );

    return membership;
  }

  /**
   * Accept a pending membership invitation.
   *
   * Sets the status to ACTIVE and records the acceptedAt timestamp.
   *
   * @param membershipId - Membership ID to accept
   * @returns Updated membership
   * @throws NotFoundException if membership not found
   * @throws ConflictException if membership is not PENDING
   */
  async accept(membershipId: string): Promise<StoreMembership> {
    const membership = await this.prisma.$client.storeMembership.findUnique({
      where: { id: membershipId },
    });

    if (!membership) {
      throw new NotFoundException(`Membership not found: ${membershipId}`);
    }

    if (membership.status !== 'PENDING') {
      throw new ConflictException(
        `Cannot accept membership with status ${membership.status}`,
      );
    }

    const updated = await this.prisma.$client.storeMembership.update({
      where: { id: membershipId },
      data: {
        status: 'ACTIVE',
        acceptedAt: new Date(),
      },
    });

    this.logger.log(`Membership accepted: ${membershipId}`);

    return updated;
  }

  /**
   * Suspend an active membership.
   *
   * Temporarily revokes access without deleting the membership.
   *
   * @param membershipId - Membership ID to suspend
   * @returns Updated membership
   * @throws NotFoundException if membership not found
   */
  async suspend(membershipId: string): Promise<StoreMembership> {
    const membership = await this.prisma.$client.storeMembership.findUnique({
      where: { id: membershipId },
    });

    if (!membership) {
      throw new NotFoundException(`Membership not found: ${membershipId}`);
    }

    const updated = await this.prisma.$client.storeMembership.update({
      where: { id: membershipId },
      data: {
        status: 'SUSPENDED',
      },
    });

    this.logger.log(`Membership suspended: ${membershipId}`);

    return updated;
  }

  /**
   * Reactivate a suspended membership.
   *
   * @param membershipId - Membership ID to reactivate
   * @returns Updated membership
   * @throws NotFoundException if membership not found
   * @throws ConflictException if membership is not SUSPENDED
   */
  async reactivate(membershipId: string): Promise<StoreMembership> {
    const membership = await this.prisma.$client.storeMembership.findUnique({
      where: { id: membershipId },
    });

    if (!membership) {
      throw new NotFoundException(`Membership not found: ${membershipId}`);
    }

    if (membership.status !== 'SUSPENDED') {
      throw new ConflictException(
        `Cannot reactivate membership with status ${membership.status}`,
      );
    }

    const updated = await this.prisma.$client.storeMembership.update({
      where: { id: membershipId },
      data: {
        status: 'ACTIVE',
      },
    });

    this.logger.log(`Membership reactivated: ${membershipId}`);

    return updated;
  }

  /**
   * Remove a membership (hard delete).
   *
   * Memberships are junction records with no independent business value,
   * so they are hard-deleted rather than soft-deleted.
   *
   * @param membershipId - Membership ID to remove
   * @throws NotFoundException if membership not found
   */
  async remove(membershipId: string): Promise<void> {
    const membership = await this.prisma.$client.storeMembership.findUnique({
      where: { id: membershipId },
    });

    if (!membership) {
      throw new NotFoundException(`Membership not found: ${membershipId}`);
    }

    await this.prisma.$client.storeMembership.delete({
      where: { id: membershipId },
    });

    this.logger.log(`Membership removed: ${membershipId}`);
  }

  /**
   * Update a membership's role.
   *
   * @param membershipId - Membership ID
   * @param role - New role
   * @returns Updated membership
   * @throws NotFoundException if membership not found
   */
  async updateRole(membershipId: string, role: UserRole): Promise<StoreMembership> {
    const membership = await this.prisma.$client.storeMembership.findUnique({
      where: { id: membershipId },
    });

    if (!membership) {
      throw new NotFoundException(`Membership not found: ${membershipId}`);
    }

    const updated = await this.prisma.$client.storeMembership.update({
      where: { id: membershipId },
      data: { role },
    });

    this.logger.log(`Membership role updated: ${membershipId} → ${role}`);

    return updated;
  }

  /**
   * Get all memberships for a user.
   *
   * Returns all memberships including PENDING and SUSPENDED.
   * Use filtering on the result if you need only ACTIVE memberships.
   *
   * @param userId - User ID
   * @returns All memberships for the user
   */
  async getByUser(userId: string): Promise<StoreMembership[]> {
    return this.prisma.$client.storeMembership.findMany({
      where: { userId },
      orderBy: { invitedAt: 'desc' },
    });
  }

  /**
   * Get all memberships for a user with store details.
   *
   * @param userId - User ID
   * @returns Memberships with store relation included
   */
  async getByUserWithStore(userId: string) {
    return this.prisma.$client.storeMembership.findMany({
      where: { userId },
      include: { store: true },
      orderBy: { invitedAt: 'desc' },
    });
  }

  /**
   * Get all ACTIVE memberships for a user.
   *
   * @param userId - User ID
   * @returns Active memberships only
   */
  async getActiveByUser(userId: string): Promise<StoreMembership[]> {
    return this.prisma.$client.storeMembership.findMany({
      where: { userId, status: 'ACTIVE' },
      orderBy: { invitedAt: 'desc' },
    });
  }

  /**
   * Get all memberships for a store.
   *
   * Returns all memberships including PENDING and SUSPENDED.
   *
   * @param storeId - Store ID
   * @returns All memberships for the store
   */
  async getByStore(storeId: string): Promise<StoreMembership[]> {
    return this.prisma.$client.storeMembership.findMany({
      where: { storeId },
      orderBy: { invitedAt: 'desc' },
    });
  }

  /**
   * Get all memberships for a store with user details.
   *
   * @param storeId - Store ID
   * @returns Memberships with user relation included
   */
  async getByStoreWithUser(storeId: string) {
    return this.prisma.$client.storeMembership.findMany({
      where: { storeId },
      include: { user: true },
      orderBy: { invitedAt: 'desc' },
    });
  }

  /**
   * Get the active membership for a specific user-store pair.
   *
   * @param storeId - Store ID
   * @param userId - User ID
   * @returns Active membership or null if not found/not active
   */
  async getActiveMembership(
    storeId: string,
    userId: string,
  ): Promise<StoreMembership | null> {
    return this.prisma.$client.storeMembership.findFirst({
      where: {
        storeId,
        userId,
        status: 'ACTIVE',
      },
    });
  }

  /**
   * Check if a user has active access to a store.
   *
   * @param storeId - Store ID
   * @param userId - User ID
   * @returns true if user has ACTIVE membership
   */
  async hasActiveAccess(storeId: string, userId: string): Promise<boolean> {
    const membership = await this.getActiveMembership(storeId, userId);
    return membership !== null;
  }

  /**
   * Check if a user has a specific role (or higher) in a store.
   *
   * Role hierarchy: OWNER > ADMIN > EDITOR > VIEWER
   *
   * @param storeId - Store ID
   * @param userId - User ID
   * @param minimumRole - Minimum required role
   * @returns true if user has the role or higher
   */
  async hasRole(
    storeId: string,
    userId: string,
    minimumRole: UserRole,
  ): Promise<boolean> {
    const membership = await this.getActiveMembership(storeId, userId);
    if (!membership) return false;

    const roleHierarchy: Record<UserRole, number> = {
      VIEWER: 1,
      EDITOR: 2,
      ADMIN: 3,
      OWNER: 4,
    };

    return roleHierarchy[membership.role] >= roleHierarchy[minimumRole];
  }

  /**
   * Get a membership by ID.
   *
   * @param membershipId - Membership ID
   * @returns Membership or null
   */
  async getById(membershipId: string): Promise<StoreMembership | null> {
    return this.prisma.$client.storeMembership.findUnique({
      where: { id: membershipId },
    });
  }

  /**
   * Get a membership by store and user IDs.
   *
   * @param storeId - Store ID
   * @param userId - User ID
   * @returns Membership or null (any status)
   */
  async getMembership(
    storeId: string,
    userId: string,
  ): Promise<StoreMembership | null> {
    return this.prisma.$client.storeMembership.findUnique({
      where: {
        storeId_userId: { storeId, userId },
      },
    });
  }

  /**
   * Count memberships by status for a store.
   *
   * @param storeId - Store ID
   * @returns Count breakdown by status
   */
  async countByStatus(storeId: string): Promise<Record<MembershipStatus, number>> {
    const counts = await this.prisma.$client.storeMembership.groupBy({
      by: ['status'],
      where: { storeId },
      _count: { status: true },
    });

    const result: Record<MembershipStatus, number> = {
      PENDING: 0,
      ACTIVE: 0,
      SUSPENDED: 0,
    };

    for (const count of counts) {
      result[count.status] = count._count.status;
    }

    return result;
  }
}
