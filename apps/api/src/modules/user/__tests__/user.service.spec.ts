import { Test, TestingModule } from '@nestjs/testing'
import { ConflictException, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common'
import { UserService } from '../user.service'
import { PrismaService } from '@database/prisma.service'

describe('UserService', () => {
  let service: UserService
  let mockPrisma: {
    user: {
      findMany: jest.Mock
      findUnique: jest.Mock
      findFirst: jest.Mock
      count: jest.Mock
      create: jest.Mock
      update: jest.Mock
    }
  }

  const mockStoreId = 'store-123'
  const mockUserId = 'user-123'
  const mockTargetUserId = 'user-456'

  const createMockUser = (overrides = {}) => ({
    id: mockUserId,
    email: 'owner@test.com',
    name: 'Owner User',
    role: 'OWNER',
    status: 'ACTIVE',
    storeId: mockStoreId,
    lastLoginAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    passwordHash: 'hashed',
    ...overrides,
  })

  const createMockTargetUser = (overrides = {}) => ({
    id: mockTargetUserId,
    email: 'editor@test.com',
    name: 'Editor User',
    role: 'EDITOR',
    status: 'ACTIVE',
    storeId: mockStoreId,
    lastLoginAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    passwordHash: 'hashed',
    ...overrides,
  })

  beforeEach(async () => {
    // Create fresh mocks for each test
    mockPrisma = {
      user: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
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
    it('should return paginated users list', async () => {
      const mockUser = createMockUser()
      const mockTargetUser = createMockTargetUser()
      const mockUsers = [mockUser, mockTargetUser]
      mockPrisma.user.findMany.mockResolvedValue(mockUsers)
      mockPrisma.user.count.mockResolvedValue(2)

      const result = await service.list(mockStoreId, { page: 1, limit: 20 })

      expect(result).toEqual({
        users: mockUsers.map((u) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          status: u.status,
          lastLoginAt: u.lastLoginAt,
          createdAt: u.createdAt,
        })),
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      })
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { storeId: mockStoreId },
          skip: 0,
          take: 20,
        })
      )
    })

    it('should filter by status', async () => {
      const mockUser = createMockUser()
      mockPrisma.user.findMany.mockResolvedValue([mockUser])
      mockPrisma.user.count.mockResolvedValue(1)

      await service.list(mockStoreId, { page: 1, limit: 20, status: 'ACTIVE' })

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { storeId: mockStoreId, status: 'ACTIVE' },
        })
      )
    })
  })

  describe('invite', () => {
    it('should create an invited user', async () => {
      const mockUser = createMockUser()
      mockPrisma.user.findFirst.mockResolvedValueOnce(mockUser) // Current user lookup
      mockPrisma.user.findFirst.mockResolvedValueOnce(null) // No existing user with email in store
      mockPrisma.user.findUnique.mockResolvedValue(null) // No global user with email

      const newUser = {
        id: 'new-user-id',
        email: 'new@test.com',
        name: null,
        role: 'VIEWER',
        status: 'INVITED',
        storeId: mockStoreId,
        lastLoginAt: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        passwordHash: null,
      }
      mockPrisma.user.create.mockResolvedValue(newUser)

      const result = await service.invite(mockStoreId, mockUserId, {
        email: 'new@test.com',
        role: 'VIEWER',
      })

      expect(result).toEqual({
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        status: newUser.status,
        lastLoginAt: newUser.lastLoginAt,
        createdAt: newUser.createdAt,
      })
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'new@test.com',
            role: 'VIEWER',
            status: 'INVITED',
            storeId: mockStoreId,
          }),
        })
      )
    })

    it('should throw ConflictException if email already exists in store', async () => {
      const mockUser = createMockUser()
      const mockTargetUser = createMockTargetUser()
      mockPrisma.user.findFirst.mockResolvedValueOnce(mockUser) // Current user
      mockPrisma.user.findFirst.mockResolvedValueOnce(mockTargetUser) // Existing user with email

      await expect(
        service.invite(mockStoreId, mockUserId, {
          email: mockTargetUser.email,
          role: 'VIEWER',
        })
      ).rejects.toThrow(ConflictException)
    })

    it('should throw ForbiddenException if inviting higher role', async () => {
      const adminUser = createMockUser({ role: 'ADMIN' })
      mockPrisma.user.findFirst.mockResolvedValueOnce(adminUser) // Current user is ADMIN
      mockPrisma.user.findFirst.mockResolvedValueOnce(null) // No existing user

      await expect(
        service.invite(mockStoreId, mockUserId, {
          email: 'new@test.com',
          role: 'OWNER', // Trying to invite an OWNER
        })
      ).rejects.toThrow(ForbiddenException)
    })
  })

  describe('updateRole', () => {
    it('should update user role', async () => {
      const mockUser = createMockUser()
      const mockTargetUser = createMockTargetUser()

      // findFirst is called twice - once for currentUser, once for targetUser
      mockPrisma.user.findFirst
        .mockResolvedValueOnce(mockUser) // Current user (OWNER)
        .mockResolvedValueOnce(mockTargetUser) // Target user

      const updatedUser = { ...mockTargetUser, role: 'ADMIN' }
      mockPrisma.user.update.mockResolvedValue(updatedUser)

      const result = await service.updateRole(mockStoreId, mockUserId, mockTargetUserId, {
        role: 'ADMIN',
      })

      expect(result.role).toBe('ADMIN')
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockTargetUserId },
          data: { role: 'ADMIN' },
        })
      )
    })

    it('should throw NotFoundException if target user not found', async () => {
      const mockUser = createMockUser()
      mockPrisma.user.findFirst
        .mockResolvedValueOnce(mockUser) // Current user
        .mockResolvedValueOnce(null) // Target user not found

      await expect(
        service.updateRole(mockStoreId, mockUserId, mockTargetUserId, {
          role: 'ADMIN',
        })
      ).rejects.toThrow(NotFoundException)
    })

    it('should throw ForbiddenException if assigning higher role than self', async () => {
      const adminUser = createMockUser({ role: 'ADMIN' })
      const mockTargetUser = createMockTargetUser()
      mockPrisma.user.findFirst
        .mockResolvedValueOnce(adminUser) // Current user is ADMIN
        .mockResolvedValueOnce(mockTargetUser) // Target user

      await expect(
        service.updateRole(mockStoreId, mockUserId, mockTargetUserId, {
          role: 'OWNER',
        })
      ).rejects.toThrow(ForbiddenException)
    })

    it('should throw ForbiddenException if trying to modify self', async () => {
      const mockUser = createMockUser()
      // findFirst is called twice even for self-modify (both current and target)
      mockPrisma.user.findFirst
        .mockResolvedValueOnce(mockUser) // Current user
        .mockResolvedValueOnce(mockUser) // Target user (same as current)

      await expect(
        service.updateRole(mockStoreId, mockUserId, mockUserId, {
          role: 'ADMIN',
        })
      ).rejects.toThrow(ForbiddenException)
    })
  })

  describe('deactivate', () => {
    it('should deactivate a user', async () => {
      const mockUser = createMockUser()
      const mockTargetUser = createMockTargetUser()
      mockPrisma.user.findFirst
        .mockResolvedValueOnce(mockUser) // Current user (OWNER)
        .mockResolvedValueOnce(mockTargetUser) // Target user (EDITOR)

      const deactivatedUser = { ...mockTargetUser, status: 'INACTIVE' }
      mockPrisma.user.update.mockResolvedValue(deactivatedUser)

      const result = await service.deactivate(mockStoreId, mockUserId, mockTargetUserId)

      expect(result.status).toBe('INACTIVE')
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockTargetUserId },
          data: expect.objectContaining({ status: 'INACTIVE' }),
        })
      )
    })

    it('should throw BadRequestException when deactivating last owner', async () => {
      // Current user is OWNER, target is also OWNER
      const mockUser = createMockUser()
      const targetOwner = createMockTargetUser({ role: 'OWNER' })
      mockPrisma.user.findFirst
        .mockResolvedValueOnce(mockUser) // Current user (OWNER)
        .mockResolvedValueOnce(targetOwner) // Target is also OWNER
      mockPrisma.user.count.mockResolvedValue(0) // No other active owners

      await expect(
        service.deactivate(mockStoreId, mockUserId, mockTargetUserId)
      ).rejects.toThrow(BadRequestException)
    })

    it('should throw ForbiddenException if target has higher role', async () => {
      const adminUser = createMockUser({ role: 'ADMIN' })
      const ownerTarget = createMockTargetUser({ role: 'OWNER' })
      mockPrisma.user.findFirst
        .mockResolvedValueOnce(adminUser) // Current user is ADMIN
        .mockResolvedValueOnce(ownerTarget) // Target is OWNER

      await expect(
        service.deactivate(mockStoreId, mockUserId, mockTargetUserId)
      ).rejects.toThrow(ForbiddenException)
    })

    it('should throw ForbiddenException if trying to deactivate self', async () => {
      const mockUser = createMockUser()
      // findFirst is called twice even for self-deactivate (both current and target)
      mockPrisma.user.findFirst
        .mockResolvedValueOnce(mockUser) // Current user
        .mockResolvedValueOnce(mockUser) // Target user (same as current)

      await expect(
        service.deactivate(mockStoreId, mockUserId, mockUserId)
      ).rejects.toThrow(ForbiddenException)
    })
  })
})
