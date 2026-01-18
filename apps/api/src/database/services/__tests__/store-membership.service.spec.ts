import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { StoreMembershipService } from '../store-membership.service';
import { PrismaService } from '../../prisma.service';
import type { StoreMembership, MembershipStatus, UserRole } from '@generated/prisma/client';

describe('StoreMembershipService', () => {
  let service: StoreMembershipService;
  let mockPrisma: {
    $client: {
      storeMembership: {
        findUnique: jest.Mock;
        findFirst: jest.Mock;
        findMany: jest.Mock;
        create: jest.Mock;
        update: jest.Mock;
        delete: jest.Mock;
        groupBy: jest.Mock;
      };
    };
  };

  const mockStoreId = 'store_test123';
  const mockUserId = 'usr_test123';
  const mockMembershipId = 'smem_test123';

  const createMockMembership = (overrides: Partial<StoreMembership> = {}): StoreMembership => ({
    id: mockMembershipId,
    storeId: mockStoreId,
    userId: mockUserId,
    role: 'VIEWER' as UserRole,
    status: 'PENDING' as MembershipStatus,
    invitedAt: new Date('2024-01-01'),
    acceptedAt: null,
    ...overrides,
  });

  beforeEach(async () => {
    mockPrisma = {
      $client: {
        storeMembership: {
          findUnique: jest.fn(),
          findFirst: jest.fn(),
          findMany: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
          groupBy: jest.fn(),
        },
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoreMembershipService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<StoreMembershipService>(StoreMembershipService);
  });

  describe('create', () => {
    it('should create a PENDING membership by default', async () => {
      const expectedMembership = createMockMembership();
      mockPrisma.$client.storeMembership.findUnique.mockResolvedValue(null);
      mockPrisma.$client.storeMembership.create.mockResolvedValue(expectedMembership);

      const result = await service.create(mockStoreId, mockUserId);

      expect(result.status).toBe('PENDING');
      expect(result.role).toBe('VIEWER');
      expect(mockPrisma.$client.storeMembership.create).toHaveBeenCalledWith({
        data: {
          storeId: mockStoreId,
          userId: mockUserId,
          role: 'VIEWER',
          status: 'PENDING',
        },
      });
    });

    it('should create membership with specified role', async () => {
      const expectedMembership = createMockMembership({ role: 'ADMIN' as UserRole });
      mockPrisma.$client.storeMembership.findUnique.mockResolvedValue(null);
      mockPrisma.$client.storeMembership.create.mockResolvedValue(expectedMembership);

      const result = await service.create(mockStoreId, mockUserId, 'ADMIN');

      expect(result.role).toBe('ADMIN');
    });

    it('should throw ConflictException if membership already exists', async () => {
      const existingMembership = createMockMembership();
      mockPrisma.$client.storeMembership.findUnique.mockResolvedValue(existingMembership);

      await expect(service.create(mockStoreId, mockUserId)).rejects.toThrow(ConflictException);
    });
  });

  describe('createActive', () => {
    it('should create an ACTIVE membership with acceptedAt set', async () => {
      const expectedMembership = createMockMembership({
        status: 'ACTIVE' as MembershipStatus,
        role: 'OWNER' as UserRole,
        acceptedAt: new Date(),
      });
      mockPrisma.$client.storeMembership.findUnique.mockResolvedValue(null);
      mockPrisma.$client.storeMembership.create.mockResolvedValue(expectedMembership);

      const result = await service.createActive(mockStoreId, mockUserId, 'OWNER');

      expect(result.status).toBe('ACTIVE');
      expect(result.role).toBe('OWNER');
      expect(mockPrisma.$client.storeMembership.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'ACTIVE',
          acceptedAt: expect.any(Date),
        }),
      });
    });

    it('should throw ConflictException if membership already exists', async () => {
      const existingMembership = createMockMembership();
      mockPrisma.$client.storeMembership.findUnique.mockResolvedValue(existingMembership);

      await expect(service.createActive(mockStoreId, mockUserId, 'ADMIN')).rejects.toThrow(
        ConflictException
      );
    });
  });

  describe('accept', () => {
    it('should set status to ACTIVE and record acceptedAt', async () => {
      const pendingMembership = createMockMembership({ status: 'PENDING' as MembershipStatus });
      const acceptedMembership = createMockMembership({
        status: 'ACTIVE' as MembershipStatus,
        acceptedAt: new Date(),
      });

      mockPrisma.$client.storeMembership.findUnique.mockResolvedValue(pendingMembership);
      mockPrisma.$client.storeMembership.update.mockResolvedValue(acceptedMembership);

      const result = await service.accept(mockMembershipId);

      expect(result.status).toBe('ACTIVE');
      expect(mockPrisma.$client.storeMembership.update).toHaveBeenCalledWith({
        where: { id: mockMembershipId },
        data: {
          status: 'ACTIVE',
          acceptedAt: expect.any(Date),
        },
      });
    });

    it('should throw NotFoundException if membership not found', async () => {
      mockPrisma.$client.storeMembership.findUnique.mockResolvedValue(null);

      await expect(service.accept('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if membership is not PENDING', async () => {
      const activeMembership = createMockMembership({ status: 'ACTIVE' as MembershipStatus });
      mockPrisma.$client.storeMembership.findUnique.mockResolvedValue(activeMembership);

      await expect(service.accept(mockMembershipId)).rejects.toThrow(ConflictException);
    });
  });

  describe('suspend', () => {
    it('should set status to SUSPENDED', async () => {
      const activeMembership = createMockMembership({ status: 'ACTIVE' as MembershipStatus });
      const suspendedMembership = createMockMembership({ status: 'SUSPENDED' as MembershipStatus });

      mockPrisma.$client.storeMembership.findUnique.mockResolvedValue(activeMembership);
      mockPrisma.$client.storeMembership.update.mockResolvedValue(suspendedMembership);

      const result = await service.suspend(mockMembershipId);

      expect(result.status).toBe('SUSPENDED');
    });

    it('should throw NotFoundException if membership not found', async () => {
      mockPrisma.$client.storeMembership.findUnique.mockResolvedValue(null);

      await expect(service.suspend('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('reactivate', () => {
    it('should set status back to ACTIVE from SUSPENDED', async () => {
      const suspendedMembership = createMockMembership({ status: 'SUSPENDED' as MembershipStatus });
      const reactivatedMembership = createMockMembership({ status: 'ACTIVE' as MembershipStatus });

      mockPrisma.$client.storeMembership.findUnique.mockResolvedValue(suspendedMembership);
      mockPrisma.$client.storeMembership.update.mockResolvedValue(reactivatedMembership);

      const result = await service.reactivate(mockMembershipId);

      expect(result.status).toBe('ACTIVE');
    });

    it('should throw ConflictException if membership is not SUSPENDED', async () => {
      const activeMembership = createMockMembership({ status: 'ACTIVE' as MembershipStatus });
      mockPrisma.$client.storeMembership.findUnique.mockResolvedValue(activeMembership);

      await expect(service.reactivate(mockMembershipId)).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should hard delete the membership', async () => {
      const membership = createMockMembership();
      mockPrisma.$client.storeMembership.findUnique.mockResolvedValue(membership);
      mockPrisma.$client.storeMembership.delete.mockResolvedValue(membership);

      await service.remove(mockMembershipId);

      expect(mockPrisma.$client.storeMembership.delete).toHaveBeenCalledWith({
        where: { id: mockMembershipId },
      });
    });

    it('should throw NotFoundException if membership not found', async () => {
      mockPrisma.$client.storeMembership.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getByUser', () => {
    it('should return all memberships for a user including SUSPENDED', async () => {
      const memberships = [
        createMockMembership({ status: 'ACTIVE' as MembershipStatus }),
        createMockMembership({
          id: 'smem_2',
          storeId: 'store_2',
          status: 'SUSPENDED' as MembershipStatus,
        }),
      ];
      mockPrisma.$client.storeMembership.findMany.mockResolvedValue(memberships);

      const result = await service.getByUser(mockUserId);

      expect(result).toHaveLength(2);
      expect(mockPrisma.$client.storeMembership.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        orderBy: { invitedAt: 'desc' },
      });
    });
  });

  describe('getByStore', () => {
    it('should return all memberships for a store including PENDING', async () => {
      const memberships = [
        createMockMembership({ status: 'ACTIVE' as MembershipStatus }),
        createMockMembership({
          id: 'smem_2',
          userId: 'usr_2',
          status: 'PENDING' as MembershipStatus,
        }),
      ];
      mockPrisma.$client.storeMembership.findMany.mockResolvedValue(memberships);

      const result = await service.getByStore(mockStoreId);

      expect(result).toHaveLength(2);
      expect(mockPrisma.$client.storeMembership.findMany).toHaveBeenCalledWith({
        where: { storeId: mockStoreId },
        orderBy: { invitedAt: 'desc' },
      });
    });
  });

  describe('getActiveMembership', () => {
    it('should return only ACTIVE membership', async () => {
      const activeMembership = createMockMembership({ status: 'ACTIVE' as MembershipStatus });
      mockPrisma.$client.storeMembership.findFirst.mockResolvedValue(activeMembership);

      const result = await service.getActiveMembership(mockStoreId, mockUserId);

      expect(result?.status).toBe('ACTIVE');
      expect(mockPrisma.$client.storeMembership.findFirst).toHaveBeenCalledWith({
        where: {
          storeId: mockStoreId,
          userId: mockUserId,
          status: 'ACTIVE',
        },
      });
    });

    it('should return null if no active membership exists', async () => {
      mockPrisma.$client.storeMembership.findFirst.mockResolvedValue(null);

      const result = await service.getActiveMembership(mockStoreId, mockUserId);

      expect(result).toBeNull();
    });
  });

  describe('hasActiveAccess', () => {
    it('should return true if user has ACTIVE membership', async () => {
      const activeMembership = createMockMembership({ status: 'ACTIVE' as MembershipStatus });
      mockPrisma.$client.storeMembership.findFirst.mockResolvedValue(activeMembership);

      const result = await service.hasActiveAccess(mockStoreId, mockUserId);

      expect(result).toBe(true);
    });

    it('should return false if no active membership', async () => {
      mockPrisma.$client.storeMembership.findFirst.mockResolvedValue(null);

      const result = await service.hasActiveAccess(mockStoreId, mockUserId);

      expect(result).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('should return true if user has required role or higher', async () => {
      const adminMembership = createMockMembership({
        status: 'ACTIVE' as MembershipStatus,
        role: 'ADMIN' as UserRole,
      });
      mockPrisma.$client.storeMembership.findFirst.mockResolvedValue(adminMembership);

      // ADMIN should satisfy EDITOR requirement
      const result = await service.hasRole(mockStoreId, mockUserId, 'EDITOR');

      expect(result).toBe(true);
    });

    it('should return false if user has lower role', async () => {
      const viewerMembership = createMockMembership({
        status: 'ACTIVE' as MembershipStatus,
        role: 'VIEWER' as UserRole,
      });
      mockPrisma.$client.storeMembership.findFirst.mockResolvedValue(viewerMembership);

      // VIEWER should not satisfy ADMIN requirement
      const result = await service.hasRole(mockStoreId, mockUserId, 'ADMIN');

      expect(result).toBe(false);
    });

    it('should return false if no active membership', async () => {
      mockPrisma.$client.storeMembership.findFirst.mockResolvedValue(null);

      const result = await service.hasRole(mockStoreId, mockUserId, 'VIEWER');

      expect(result).toBe(false);
    });
  });

  describe('updateRole', () => {
    it('should update membership role', async () => {
      const membership = createMockMembership({ role: 'VIEWER' as UserRole });
      const updatedMembership = createMockMembership({ role: 'EDITOR' as UserRole });

      mockPrisma.$client.storeMembership.findUnique.mockResolvedValue(membership);
      mockPrisma.$client.storeMembership.update.mockResolvedValue(updatedMembership);

      const result = await service.updateRole(mockMembershipId, 'EDITOR');

      expect(result.role).toBe('EDITOR');
    });

    it('should throw NotFoundException if membership not found', async () => {
      mockPrisma.$client.storeMembership.findUnique.mockResolvedValue(null);

      await expect(service.updateRole('nonexistent', 'ADMIN')).rejects.toThrow(NotFoundException);
    });
  });

  describe('countByStatus', () => {
    it('should return counts by status', async () => {
      mockPrisma.$client.storeMembership.groupBy.mockResolvedValue([
        { status: 'ACTIVE', _count: { status: 5 } },
        { status: 'PENDING', _count: { status: 2 } },
        { status: 'SUSPENDED', _count: { status: 1 } },
      ]);

      const result = await service.countByStatus(mockStoreId);

      expect(result).toEqual({
        ACTIVE: 5,
        PENDING: 2,
        SUSPENDED: 1,
      });
    });

    it('should return zeros for missing statuses', async () => {
      mockPrisma.$client.storeMembership.groupBy.mockResolvedValue([
        { status: 'ACTIVE', _count: { status: 3 } },
      ]);

      const result = await service.countByStatus(mockStoreId);

      expect(result).toEqual({
        ACTIVE: 3,
        PENDING: 0,
        SUSPENDED: 0,
      });
    });
  });

  describe('getMembership', () => {
    it('should return membership by store and user IDs (any status)', async () => {
      const membership = createMockMembership({ status: 'SUSPENDED' as MembershipStatus });
      mockPrisma.$client.storeMembership.findUnique.mockResolvedValue(membership);

      const result = await service.getMembership(mockStoreId, mockUserId);

      expect(result).not.toBeNull();
      expect(mockPrisma.$client.storeMembership.findUnique).toHaveBeenCalledWith({
        where: {
          storeId_userId: { storeId: mockStoreId, userId: mockUserId },
        },
      });
    });
  });

  describe('unique constraint', () => {
    it('should prevent duplicate memberships (tested via create rejection)', async () => {
      const existingMembership = createMockMembership();
      mockPrisma.$client.storeMembership.findUnique.mockResolvedValue(existingMembership);

      await expect(service.create(mockStoreId, mockUserId)).rejects.toThrow(
        /already has a membership/
      );
    });
  });
});
