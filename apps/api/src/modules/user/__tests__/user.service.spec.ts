import { Test, TestingModule } from '@nestjs/testing'
import { ConflictException, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common'
import { UserService } from '../user.service'
import { PrismaService } from '@database/prisma.service'
import type { User, StoreMembership } from '@generated/prisma/client'

describe('UserService', () => {
  let service: UserService
  let mockPrisma: {
    user: {
      findUnique: jest.Mock
      create: jest.Mock
    }
    $client: {
      storeMembership: {
        findMany: jest.Mock
        findFirst: jest.Mock
        count: jest.Mock
        create: jest.Mock
        update: jest.Mock
      }
    }
    $transaction: jest.Mock
  }

  const mockStoreId = 'store-123'
  const mockUserId = 'user-123'
  const mockTargetUserId = 'user-456'
  const mockMembershipId = 'smem-123'
  const mockTargetMembershipId = 'smem-456'

  const createMockUser = (overrides = {}): User => ({
    id: mockUserId,
    email: 'owner@test.com',
    name: 'Owner User',
    status: 'ACTIVE',
    lastLoginAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    passwordHash: 'hashed',
    refreshTokenHash: null,
    ...overrides,
  })

  const createMockMembership = (overrides = {}): StoreMembership => ({
    id: mockMembershipId,
    storeId: mockStoreId,
    userId: mockUserId,
    role: 'OWNER',
    status: 'ACTIVE',
    invitedAt: new Date('2024-01-01'),
    acceptedAt: new Date('2024-01-01'),
    ...overrides,
  })

  const createMockTargetUser = (overrides = {}): User => ({
    id: mockTargetUserId,
    email: 'editor@test.com',
    name: 'Editor User',
    status: 'ACTIVE',
    lastLoginAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    passwordHash: 'hashed',
    refreshTokenHash: null,
    ...overrides,
  })

  const createMockTargetMembership = (overrides = {}): StoreMembership => ({
    id: mockTargetMembershipId,
    storeId: mockStoreId,
    userId: mockTargetUserId,
    role: 'EDITOR',
    status: 'ACTIVE',
    invitedAt: new Date('2024-01-01'),
    acceptedAt: new Date('2024-01-01'),
    ...overrides,
  })

  beforeEach(async () => {
    // Create fresh mocks for each test
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      $client: {
        storeMembership: {
          findMany: jest.fn(),
          findFirst: jest.fn(),
          count: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
        },
      },
      $transaction: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile()

    service = module.get<UserService>(UserService)
  })

  describe('list', () => {
    it('should return paginated users list from memberships', async () => {
      const mockUser = createMockUser()
      const mockMembership = createMockMembership()
      const mockTargetUser = createMockTargetUser()
      const mockTargetMembership = createMockTargetMembership()

      const membershipsWithUsers = [
        { ...mockMembership, user: mockUser },
        { ...mockTargetMembership, user: mockTargetUser },
      ]
      mockPrisma.$client.storeMembership.findMany.mockResolvedValue(membershipsWithUsers)
      mockPrisma.$client.storeMembership.count.mockResolvedValue(2)

      const result = await service.list(mockStoreId, { page: 1, limit: 20 })

      expect(result).toEqual({
        users: expect.arrayContaining([
          expect.objectContaining({
            id: mockUser.id,
            email: mockUser.email,
            role: 'OWNER',
          }),
          expect.objectContaining({
            id: mockTargetUser.id,
            email: mockTargetUser.email,
            role: 'EDITOR',
          }),
        ]),
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      })
      expect(mockPrisma.$client.storeMembership.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { storeId: mockStoreId },
          skip: 0,
          take: 20,
        })
      )
    })

    it('should filter by membership status when status=ACTIVE', async () => {
      const mockUser = createMockUser()
      const mockMembership = createMockMembership()
      mockPrisma.$client.storeMembership.findMany.mockResolvedValue([{ ...mockMembership, user: mockUser }])
      mockPrisma.$client.storeMembership.count.mockResolvedValue(1)

      await service.list(mockStoreId, { page: 1, limit: 20, status: 'ACTIVE' })

      expect(mockPrisma.$client.storeMembership.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { storeId: mockStoreId, status: 'ACTIVE' },
        })
      )
    })
  })

  describe('invite', () => {
    it('should create a user and pending membership', async () => {
      const mockUser = createMockUser()
      const mockMembership = createMockMembership()
      const newUser = createMockTargetUser({ email: 'new@test.com', id: 'new-user-id' })
      const newMembership = createMockTargetMembership({
        id: 'smem-new',
        userId: 'new-user-id',
        role: 'VIEWER',
        status: 'PENDING'
      })

      // findFirst for inviter with membership
      mockPrisma.$client.storeMembership.findFirst
        .mockResolvedValueOnce({ ...mockMembership, user: mockUser }) // Inviter lookup
        .mockResolvedValueOnce(null) // No existing membership with email

      mockPrisma.user.findUnique.mockResolvedValue(null) // No global user

      // Mock transaction
      mockPrisma.$transaction.mockImplementation(async (fn) => {
        const mockTx = {
          user: {
            create: jest.fn().mockResolvedValue(newUser),
          },
          storeMembership: {
            create: jest.fn().mockResolvedValue(newMembership),
          },
        }
        return fn(mockTx)
      })

      const result = await service.invite(mockStoreId, mockUserId, {
        email: 'new@test.com',
        role: 'VIEWER',
      })

      expect(result).toEqual(
        expect.objectContaining({
          id: 'new-user-id',
          email: 'new@test.com',
          role: 'VIEWER',
          status: 'INVITED', // Maps from PENDING
        })
      )
    })

    it('should throw ConflictException if user already has membership in store', async () => {
      const mockUser = createMockUser()
      const mockMembership = createMockMembership()
      const existingMembership = createMockTargetMembership()

      mockPrisma.$client.storeMembership.findFirst
        .mockResolvedValueOnce({ ...mockMembership, user: mockUser }) // Inviter
        .mockResolvedValueOnce({ ...existingMembership, user: createMockTargetUser() }) // Existing membership

      await expect(
        service.invite(mockStoreId, mockUserId, {
          email: 'editor@test.com',
          role: 'VIEWER',
        })
      ).rejects.toThrow(ConflictException)
    })

    it('should throw ForbiddenException if inviting higher role', async () => {
      const adminUser = createMockUser({ role: 'ADMIN' })
      const adminMembership = createMockMembership({ role: 'ADMIN' })

      mockPrisma.$client.storeMembership.findFirst
        .mockResolvedValueOnce({ ...adminMembership, user: adminUser }) // Inviter is ADMIN
        .mockResolvedValueOnce(null) // No existing membership

      await expect(
        service.invite(mockStoreId, mockUserId, {
          email: 'new@test.com',
          role: 'OWNER', // Trying to invite an OWNER
        })
      ).rejects.toThrow(ForbiddenException)
    })
  })

  describe('updateRole', () => {
    it('should update membership role', async () => {
      const mockUser = createMockUser()
      const mockMembership = createMockMembership()
      const mockTargetUser = createMockTargetUser()
      const mockTargetMembership = createMockTargetMembership()

      mockPrisma.$client.storeMembership.findFirst
        .mockResolvedValueOnce({ ...mockMembership, user: mockUser }) // Current user (OWNER)
        .mockResolvedValueOnce({ ...mockTargetMembership, user: mockTargetUser }) // Target user

      const updatedMembership = { ...mockTargetMembership, role: 'ADMIN', user: mockTargetUser }
      mockPrisma.$client.storeMembership.update.mockResolvedValue(updatedMembership)

      const result = await service.updateRole(mockStoreId, mockUserId, mockTargetUserId, {
        role: 'ADMIN',
      })

      expect(result.role).toBe('ADMIN')
      expect(mockPrisma.$client.storeMembership.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockTargetMembershipId },
          data: { role: 'ADMIN' },
        })
      )
    })

    it('should throw NotFoundException if target user not found in store', async () => {
      const mockUser = createMockUser()
      const mockMembership = createMockMembership()

      mockPrisma.$client.storeMembership.findFirst
        .mockResolvedValueOnce({ ...mockMembership, user: mockUser }) // Current user
        .mockResolvedValueOnce(null) // Target not found

      await expect(
        service.updateRole(mockStoreId, mockUserId, mockTargetUserId, {
          role: 'ADMIN',
        })
      ).rejects.toThrow(NotFoundException)
    })

    it('should throw ForbiddenException if assigning higher role than self', async () => {
      const adminUser = createMockUser()
      const adminMembership = createMockMembership({ role: 'ADMIN' })
      const mockTargetUser = createMockTargetUser()
      const mockTargetMembership = createMockTargetMembership()

      mockPrisma.$client.storeMembership.findFirst
        .mockResolvedValueOnce({ ...adminMembership, user: adminUser }) // Current user is ADMIN
        .mockResolvedValueOnce({ ...mockTargetMembership, user: mockTargetUser }) // Target user

      await expect(
        service.updateRole(mockStoreId, mockUserId, mockTargetUserId, {
          role: 'OWNER',
        })
      ).rejects.toThrow(ForbiddenException)
    })

    it('should throw ForbiddenException if trying to modify self', async () => {
      const mockUser = createMockUser()
      const mockMembership = createMockMembership()

      mockPrisma.$client.storeMembership.findFirst
        .mockResolvedValueOnce({ ...mockMembership, user: mockUser }) // Current user
        .mockResolvedValueOnce({ ...mockMembership, user: mockUser }) // Target user (same)

      await expect(
        service.updateRole(mockStoreId, mockUserId, mockUserId, {
          role: 'ADMIN',
        })
      ).rejects.toThrow(ForbiddenException)
    })
  })

  describe('deactivate', () => {
    it('should suspend a membership', async () => {
      const mockUser = createMockUser()
      const mockMembership = createMockMembership()
      const mockTargetUser = createMockTargetUser()
      const mockTargetMembership = createMockTargetMembership()

      mockPrisma.$client.storeMembership.findFirst
        .mockResolvedValueOnce({ ...mockMembership, user: mockUser }) // Current user (OWNER)
        .mockResolvedValueOnce({ ...mockTargetMembership, user: mockTargetUser }) // Target user (EDITOR)

      const suspendedMembership = { ...mockTargetMembership, status: 'SUSPENDED', user: mockTargetUser }
      mockPrisma.$client.storeMembership.update.mockResolvedValue(suspendedMembership)

      const result = await service.deactivate(mockStoreId, mockUserId, mockTargetUserId)

      expect(result.status).toBe('INACTIVE') // Maps from SUSPENDED
      expect(mockPrisma.$client.storeMembership.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockTargetMembershipId },
          data: { status: 'SUSPENDED' },
        })
      )
    })

    it('should throw BadRequestException when suspending last owner', async () => {
      const mockUser = createMockUser()
      const mockMembership = createMockMembership()
      const targetOwnerUser = createMockTargetUser()
      const targetOwnerMembership = createMockTargetMembership({ role: 'OWNER' })

      mockPrisma.$client.storeMembership.findFirst
        .mockResolvedValueOnce({ ...mockMembership, user: mockUser }) // Current user (OWNER)
        .mockResolvedValueOnce({ ...targetOwnerMembership, user: targetOwnerUser }) // Target is also OWNER
      mockPrisma.$client.storeMembership.count.mockResolvedValue(0) // No other active owners

      await expect(
        service.deactivate(mockStoreId, mockUserId, mockTargetUserId)
      ).rejects.toThrow(BadRequestException)
    })

    it('should throw ForbiddenException if target has higher role', async () => {
      const adminUser = createMockUser()
      const adminMembership = createMockMembership({ role: 'ADMIN' })
      const ownerTargetUser = createMockTargetUser()
      const ownerTargetMembership = createMockTargetMembership({ role: 'OWNER' })

      mockPrisma.$client.storeMembership.findFirst
        .mockResolvedValueOnce({ ...adminMembership, user: adminUser }) // Current user is ADMIN
        .mockResolvedValueOnce({ ...ownerTargetMembership, user: ownerTargetUser }) // Target is OWNER

      await expect(
        service.deactivate(mockStoreId, mockUserId, mockTargetUserId)
      ).rejects.toThrow(ForbiddenException)
    })

    it('should throw ForbiddenException if trying to suspend self', async () => {
      const mockUser = createMockUser()
      const mockMembership = createMockMembership()

      mockPrisma.$client.storeMembership.findFirst
        .mockResolvedValueOnce({ ...mockMembership, user: mockUser }) // Current user
        .mockResolvedValueOnce({ ...mockMembership, user: mockUser }) // Target user (same)

      await expect(
        service.deactivate(mockStoreId, mockUserId, mockUserId)
      ).rejects.toThrow(ForbiddenException)
    })
  })
})
