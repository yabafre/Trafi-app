import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcrypt';
import { OwnershipService } from '../ownership.service';
import { PrismaService } from '@database/prisma.service';

jest.mock('bcrypt');

describe('OwnershipService', () => {
  let service: OwnershipService;
  let mockPrisma: {
    user: {
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
    ownershipTransfer: {
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      findMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let mockEventEmitter: {
    emit: jest.Mock;
  };

  const mockStoreId = 'store-123';
  const mockOwnerId = 'owner-123';
  const mockAdminId = 'admin-456';
  const mockTransferId = 'transfer-789';

  const createMockUser = (overrides = {}) => ({
    id: mockOwnerId,
    email: 'owner@test.com',
    name: 'Owner User',
    passwordHash: 'hashed_password',
    role: 'OWNER',
    status: 'ACTIVE',
    storeId: mockStoreId,
    ...overrides,
  });

  const createMockTransfer = (overrides = {}) => {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 72);
    return {
      id: mockTransferId,
      storeId: mockStoreId,
      fromUserId: mockOwnerId,
      toUserId: mockAdminId,
      status: 'PENDING',
      reason: null,
      expiresAt,
      completedAt: null,
      createdAt: new Date(),
      fromUser: { id: mockOwnerId, email: 'owner@test.com', name: 'Owner' },
      toUser: { id: mockAdminId, email: 'admin@test.com', name: 'Admin' },
      ...overrides,
    };
  };

  beforeEach(async () => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      ownershipTransfer: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    mockEventEmitter = {
      emit: jest.fn(),
    };

    (bcrypt.compare as jest.Mock).mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OwnershipService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<OwnershipService>(OwnershipService);
  });

  describe('initiate', () => {
    it('should create a transfer when all conditions are met', async () => {
      const mockOwner = createMockUser();
      const mockAdmin = createMockUser({
        id: mockAdminId,
        email: 'admin@test.com',
        name: 'Admin User',
        role: 'ADMIN',
      });
      const mockTransfer = createMockTransfer();

      mockPrisma.user.findUnique.mockResolvedValue(mockOwner);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockPrisma.user.findFirst.mockResolvedValue(mockAdmin);
      mockPrisma.ownershipTransfer.findFirst.mockResolvedValue(null);
      mockPrisma.ownershipTransfer.create.mockResolvedValue(mockTransfer);

      const result = await service.initiate(mockStoreId, mockOwnerId, {
        targetUserId: mockAdminId,
        password: 'correct_password',
      });

      expect(result.id).toBe(mockTransferId);
      expect(result.status).toBe('pending');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'ownership.transfer.initiated',
        expect.any(Object),
      );
    });

    it('should throw ForbiddenException on invalid password', async () => {
      const mockOwner = createMockUser();
      mockPrisma.user.findUnique.mockResolvedValue(mockOwner);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.initiate(mockStoreId, mockOwnerId, {
          targetUserId: mockAdminId,
          password: 'wrong_password',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when target user not eligible', async () => {
      const mockOwner = createMockUser();
      mockPrisma.user.findUnique.mockResolvedValue(mockOwner);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.initiate(mockStoreId, mockOwnerId, {
          targetUserId: mockAdminId,
          password: 'correct_password',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when pending transfer exists', async () => {
      const mockOwner = createMockUser();
      const mockAdmin = createMockUser({
        id: mockAdminId,
        role: 'ADMIN',
      });
      const existingTransfer = createMockTransfer();

      mockPrisma.user.findUnique.mockResolvedValue(mockOwner);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockPrisma.user.findFirst.mockResolvedValue(mockAdmin);
      mockPrisma.ownershipTransfer.findFirst.mockResolvedValue(existingTransfer);

      await expect(
        service.initiate(mockStoreId, mockOwnerId, {
          targetUserId: mockAdminId,
          password: 'correct_password',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('confirm', () => {
    it('should confirm transfer and swap roles in transaction', async () => {
      const mockTransfer = createMockTransfer();
      const mockTargetUser = createMockUser({
        id: mockAdminId,
        role: 'ADMIN',
      });

      mockPrisma.ownershipTransfer.findFirst.mockResolvedValue(mockTransfer);
      mockPrisma.user.findUnique.mockResolvedValue(mockTargetUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const confirmedTransfer = {
        ...mockTransfer,
        status: 'CONFIRMED',
        completedAt: new Date(),
      };
      mockPrisma.$transaction.mockResolvedValue([confirmedTransfer]);

      const result = await service.confirm(mockStoreId, mockAdminId, {
        transferId: mockTransferId,
        password: 'correct_password',
      });

      expect(result.status).toBe('confirmed');
      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'ownership.transfer.completed',
        expect.any(Object),
      );
    });

    it('should throw BadRequestException for expired transfer', async () => {
      mockPrisma.ownershipTransfer.findFirst.mockResolvedValue(null);

      await expect(
        service.confirm(mockStoreId, mockAdminId, {
          transferId: mockTransferId,
          password: 'correct_password',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException on invalid password', async () => {
      const mockTransfer = createMockTransfer();
      const mockTargetUser = createMockUser({
        id: mockAdminId,
        role: 'ADMIN',
      });

      mockPrisma.ownershipTransfer.findFirst.mockResolvedValue(mockTransfer);
      mockPrisma.user.findUnique.mockResolvedValue(mockTargetUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.confirm(mockStoreId, mockAdminId, {
          transferId: mockTransferId,
          password: 'wrong_password',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('cancel', () => {
    it('should allow initiator to cancel transfer', async () => {
      const mockTransfer = createMockTransfer();
      const cancelledTransfer = { ...mockTransfer, status: 'CANCELLED' };

      mockPrisma.ownershipTransfer.findFirst.mockResolvedValue(mockTransfer);
      mockPrisma.ownershipTransfer.update.mockResolvedValue(cancelledTransfer);

      const result = await service.cancel(
        mockStoreId,
        mockOwnerId,
        mockTransferId,
      );

      expect(result.status).toBe('cancelled');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'ownership.transfer.cancelled',
        expect.objectContaining({
          cancelledBy: mockOwnerId,
        }),
      );
    });

    it('should allow target to cancel transfer', async () => {
      const mockTransfer = createMockTransfer();
      const cancelledTransfer = { ...mockTransfer, status: 'CANCELLED' };

      mockPrisma.ownershipTransfer.findFirst.mockResolvedValue(mockTransfer);
      mockPrisma.ownershipTransfer.update.mockResolvedValue(cancelledTransfer);

      const result = await service.cancel(
        mockStoreId,
        mockAdminId,
        mockTransferId,
      );

      expect(result.status).toBe('cancelled');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'ownership.transfer.cancelled',
        expect.objectContaining({
          cancelledBy: mockAdminId,
        }),
      );
    });

    it('should throw BadRequestException for non-existent transfer', async () => {
      mockPrisma.ownershipTransfer.findFirst.mockResolvedValue(null);

      await expect(
        service.cancel(mockStoreId, mockOwnerId, 'invalid-transfer'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getPending', () => {
    it('should return pending transfer for initiator', async () => {
      const mockTransfer = createMockTransfer();
      mockPrisma.ownershipTransfer.findFirst.mockResolvedValue(mockTransfer);

      const result = await service.getPending(mockStoreId, mockOwnerId);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(mockTransferId);
    });

    it('should return pending transfer for target', async () => {
      const mockTransfer = createMockTransfer();
      mockPrisma.ownershipTransfer.findFirst.mockResolvedValue(mockTransfer);

      const result = await service.getPending(mockStoreId, mockAdminId);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(mockTransferId);
    });

    it('should return null when no pending transfer exists', async () => {
      mockPrisma.ownershipTransfer.findFirst.mockResolvedValue(null);

      const result = await service.getPending(mockStoreId, mockOwnerId);

      expect(result).toBeNull();
    });
  });

  describe('getHistory', () => {
    it('should return list of past transfers', async () => {
      const transfers = [
        createMockTransfer({ id: 'transfer-1', status: 'CONFIRMED' }),
        createMockTransfer({ id: 'transfer-2', status: 'CANCELLED' }),
      ];
      mockPrisma.ownershipTransfer.findMany.mockResolvedValue(transfers);

      const result = await service.getHistory(mockStoreId);

      expect(result).toHaveLength(2);
      expect(mockPrisma.ownershipTransfer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { storeId: mockStoreId },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
      );
    });
  });

  describe('tenant isolation', () => {
    it('should scope initiate to correct storeId', async () => {
      const mockOwner = createMockUser();
      const mockAdmin = createMockUser({ id: mockAdminId, role: 'ADMIN' });
      const mockTransfer = createMockTransfer();

      mockPrisma.user.findUnique.mockResolvedValue(mockOwner);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockPrisma.user.findFirst.mockResolvedValue(mockAdmin);
      mockPrisma.ownershipTransfer.findFirst.mockResolvedValue(null);
      mockPrisma.ownershipTransfer.create.mockResolvedValue(mockTransfer);

      await service.initiate(mockStoreId, mockOwnerId, {
        targetUserId: mockAdminId,
        password: 'correct_password',
      });

      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            storeId: mockStoreId,
          }),
        }),
      );

      expect(mockPrisma.ownershipTransfer.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            storeId: mockStoreId,
          }),
        }),
      );
    });
  });

  describe('72-hour expiration', () => {
    it('should set correct expiration time on initiate', async () => {
      const mockOwner = createMockUser();
      const mockAdmin = createMockUser({ id: mockAdminId, role: 'ADMIN' });
      const mockTransfer = createMockTransfer();

      mockPrisma.user.findUnique.mockResolvedValue(mockOwner);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockPrisma.user.findFirst.mockResolvedValue(mockAdmin);
      mockPrisma.ownershipTransfer.findFirst.mockResolvedValue(null);
      mockPrisma.ownershipTransfer.create.mockResolvedValue(mockTransfer);

      await service.initiate(mockStoreId, mockOwnerId, {
        targetUserId: mockAdminId,
        password: 'correct_password',
      });

      const createCall = mockPrisma.ownershipTransfer.create.mock.calls[0][0];
      const expiresAt = new Date(createCall.data.expiresAt);
      const now = new Date();
      const hoursDiff = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Should be approximately 72 hours (allow 1 minute margin)
      expect(hoursDiff).toBeGreaterThan(71.98);
      expect(hoursDiff).toBeLessThan(72.02);
    });
  });
});
