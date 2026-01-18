import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@database/prisma.service';
import type { UserRole } from '@generated/prisma/client';
import type { TransferStatus } from '@trafi/validators';
import type { InitiateTransferDto, TransferResponseDto } from './dto';

interface ConfirmTransferInput {
  transferId: string;
  password: string;
}

/**
 * Ownership Transfer Service
 *
 * Handles the transfer of store ownership between users.
 * All transfers require password re-confirmation and have a 72-hour expiration.
 *
 * IMPORTANT: Use `protected` methods (not `private`) to support
 * merchant overrides in @trafi/core distribution model.
 *
 * Security Features:
 * - Password re-confirmation on both initiate AND confirm
 * - 72-hour expiration window
 * - Prisma transaction for atomic role swap
 * - Event emission for email notifications
 *
 * @see epic-02-admin-auth.md#Story-2.8
 */
@Injectable()
export class OwnershipService {
  protected readonly logger = new Logger(OwnershipService.name);

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Validate password for a user.
   * Protected for @trafi/core extensibility (e.g., add 2FA).
   */
  protected async validateOwnerPassword(
    userId: string,
    password: string,
  ): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return false;
    return bcrypt.compare(password, user.passwordHash);
  }

  /**
   * Get the expiration period in hours.
   * Protected for customizable expiration.
   */
  protected getTransferExpirationHours(): number {
    return 72; // 3 days
  }

  /**
   * Initiate an ownership transfer to another user.
   *
   * @param storeId - The store ID for tenant isolation
   * @param currentOwnerId - The current owner's user ID
   * @param input - Transfer initiation data
   * @returns Created transfer record
   */
  async initiate(
    storeId: string,
    currentOwnerId: string,
    input: InitiateTransferDto,
  ): Promise<TransferResponseDto> {
    // 1. Verify current owner password
    const isValidPassword = await this.validateOwnerPassword(
      currentOwnerId,
      input.password,
    );
    if (!isValidPassword) {
      throw new ForbiddenException('Invalid password');
    }

    // 2. Verify target user has active ADMIN or EDITOR membership in this store
    const targetMembership = await this.prisma.$client.storeMembership.findFirst({
      where: {
        userId: input.targetUserId,
        storeId,
        role: { in: ['ADMIN', 'EDITOR'] as UserRole[] },
        status: 'ACTIVE',
      },
      include: { user: true },
    });
    if (!targetMembership || targetMembership.user.status !== 'ACTIVE') {
      throw new BadRequestException(
        'Target user not found or not eligible for ownership',
      );
    }

    // 3. Check no pending transfer exists for this store
    const existingTransfer = await this.prisma.ownershipTransfer.findFirst({
      where: {
        storeId,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
    });
    if (existingTransfer) {
      throw new BadRequestException(
        'A transfer is already pending for this store',
      );
    }

    // 4. Create transfer record
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.getTransferExpirationHours());

    const transfer = await this.prisma.ownershipTransfer.create({
      data: {
        storeId,
        fromUserId: currentOwnerId,
        toUserId: input.targetUserId,
        status: 'PENDING',
        reason: input.reason ?? null,
        expiresAt,
      },
      include: {
        fromUser: { select: { id: true, email: true, name: true } },
        toUser: { select: { id: true, email: true, name: true } },
      },
    });

    // 5. Emit event for email notification
    this.eventEmitter.emit('ownership.transfer.initiated', {
      transfer: this.toTransferResponse(transfer),
      fromUser: transfer.fromUser,
      toUser: transfer.toUser,
    });

    this.logger.log(
      `Ownership transfer initiated: ${currentOwnerId} -> ${input.targetUserId} for store ${storeId}`,
    );

    return this.toTransferResponse(transfer);
  }

  /**
   * Confirm an ownership transfer (target user accepts).
   *
   * @param storeId - The store ID for tenant isolation
   * @param userId - The target user's ID (must match transfer.toUserId)
   * @param input - Confirmation data including transferId and password
   * @returns Updated transfer record
   */
  async confirm(
    storeId: string,
    userId: string,
    input: ConfirmTransferInput,
  ): Promise<TransferResponseDto> {
    // 1. Find valid pending transfer for this user
    const transfer = await this.prisma.ownershipTransfer.findFirst({
      where: {
        id: input.transferId,
        storeId,
        toUserId: userId,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
    });

    if (!transfer) {
      throw new BadRequestException(
        'Transfer not found, expired, or not intended for this user',
      );
    }

    // 2. Validate new owner password
    const isValidPassword = await this.validateOwnerPassword(
      userId,
      input.password,
    );
    if (!isValidPassword) {
      throw new ForbiddenException('Invalid password');
    }

    // 3. Execute transfer in transaction (update membership roles, not user roles)
    const updatedTransfer = await this.prisma.$transaction(async (tx) => {
      // Update transfer record
      const updated = await tx.ownershipTransfer.update({
        where: { id: transfer.id },
        data: {
          status: 'CONFIRMED',
          completedAt: new Date(),
        },
        include: {
          fromUser: { select: { id: true, email: true, name: true } },
          toUser: { select: { id: true, email: true, name: true } },
        },
      });

      // Promote new owner (update membership role)
      await tx.storeMembership.updateMany({
        where: {
          userId,
          storeId,
          status: 'ACTIVE',
        },
        data: { role: 'OWNER' },
      });

      // Demote old owner to admin (update membership role)
      await tx.storeMembership.updateMany({
        where: {
          userId: transfer.fromUserId,
          storeId,
          status: 'ACTIVE',
        },
        data: { role: 'ADMIN' },
      });

      return updated;
    });

    // 4. Emit completion event
    this.eventEmitter.emit('ownership.transfer.completed', {
      transfer: this.toTransferResponse(updatedTransfer),
    });

    this.logger.log(
      `Ownership transfer completed: ${transfer.fromUserId} -> ${userId} for store ${storeId}`,
    );

    return this.toTransferResponse(updatedTransfer);
  }

  /**
   * Cancel a pending ownership transfer.
   * Both the initiator and target can cancel.
   *
   * @param storeId - The store ID for tenant isolation
   * @param userId - The user requesting cancellation
   * @param transferId - The transfer to cancel
   * @returns Cancelled transfer record
   */
  async cancel(
    storeId: string,
    userId: string,
    transferId: string,
  ): Promise<TransferResponseDto> {
    // Find transfer where user is either initiator or target
    const transfer = await this.prisma.ownershipTransfer.findFirst({
      where: {
        id: transferId,
        storeId,
        status: 'PENDING',
        OR: [{ fromUserId: userId }, { toUserId: userId }],
      },
    });

    if (!transfer) {
      throw new BadRequestException('Transfer not found or cannot be cancelled');
    }

    const updatedTransfer = await this.prisma.ownershipTransfer.update({
      where: { id: transferId },
      data: { status: 'CANCELLED' },
      include: {
        fromUser: { select: { id: true, email: true, name: true } },
        toUser: { select: { id: true, email: true, name: true } },
      },
    });

    this.eventEmitter.emit('ownership.transfer.cancelled', {
      transfer: this.toTransferResponse(updatedTransfer),
      cancelledBy: userId,
    });

    this.logger.log(
      `Ownership transfer cancelled by ${userId} for store ${storeId}`,
    );

    return this.toTransferResponse(updatedTransfer);
  }

  /**
   * Get pending transfer for a user (either as initiator or target).
   *
   * @param storeId - The store ID for tenant isolation
   * @param userId - The user to check for pending transfers
   * @returns Pending transfer or null
   */
  async getPending(
    storeId: string,
    userId: string,
  ): Promise<TransferResponseDto | null> {
    // Find any pending transfer where user is either owner or target
    const transfer = await this.prisma.ownershipTransfer.findFirst({
      where: {
        storeId,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
        OR: [{ fromUserId: userId }, { toUserId: userId }],
      },
      include: {
        fromUser: { select: { id: true, email: true, name: true } },
        toUser: { select: { id: true, email: true, name: true } },
      },
    });

    return transfer ? this.toTransferResponse(transfer) : null;
  }

  /**
   * Get transfer history for a store.
   *
   * @param storeId - The store ID for tenant isolation
   * @returns List of past transfers
   */
  async getHistory(storeId: string): Promise<TransferResponseDto[]> {
    const transfers = await this.prisma.ownershipTransfer.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        fromUser: { select: { id: true, email: true, name: true } },
        toUser: { select: { id: true, email: true, name: true } },
      },
    });

    return transfers.map((t) => this.toTransferResponse(t));
  }

  /**
   * Convert transfer entity to response DTO.
   * Protected for response customization.
   */
  protected toTransferResponse(transfer: {
    id: string;
    storeId: string;
    fromUser: { id: string; email: string; name: string | null };
    toUser: { id: string; email: string; name: string | null };
    status: string;
    reason: string | null;
    expiresAt: Date;
    completedAt: Date | null;
    createdAt: Date;
  }): TransferResponseDto {
    return {
      id: transfer.id,
      storeId: transfer.storeId,
      fromUser: transfer.fromUser,
      toUser: transfer.toUser,
      status: transfer.status.toLowerCase() as TransferStatus,
      reason: transfer.reason,
      expiresAt: transfer.expiresAt.toISOString(),
      completedAt: transfer.completedAt?.toISOString() ?? null,
      createdAt: transfer.createdAt.toISOString(),
    };
  }
}
