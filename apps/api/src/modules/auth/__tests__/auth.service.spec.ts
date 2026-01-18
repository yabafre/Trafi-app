import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../auth.service';
import { PrismaService } from '@database';
import type { User, StoreMembership } from '@generated/prisma/client';

// Suppress unused import warnings - these are needed for dependency injection
void JwtService;
void ConfigService;

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let authService: AuthService;

  // Create mock functions directly
  const mockUserFindUnique = jest.fn();
  const mockUserUpdate = jest.fn();
  const mockMembershipFindFirst = jest.fn();
  const mockSignAsync = jest.fn();
  const mockVerifyAsync = jest.fn();
  const mockGet = jest.fn();
  const mockGetOrThrow = jest.fn();

  const mockUser: User = {
    id: 'user_test123',
    email: 'test@trafi.dev',
    name: 'Test User',
    passwordHash: '$2b$10$hashedpassword',
    status: 'ACTIVE',
    lastLoginAt: null,
    refreshTokenHash: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockMembership: StoreMembership = {
    id: 'smem_test123',
    storeId: 'store_test123',
    userId: 'user_test123',
    role: 'ADMIN',
    status: 'ACTIVE',
    invitedAt: new Date('2024-01-01'),
    acceptedAt: new Date('2024-01-01'),
  };

  const mockTokens = {
    accessToken: 'mock.access.token',
    refreshToken: 'mock.refresh.token',
  };

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: mockUserFindUnique,
              update: mockUserUpdate,
            },
            $client: {
              storeMembership: {
                findFirst: mockMembershipFindFirst,
              },
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: mockSignAsync,
            verifyAsync: mockVerifyAsync,
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: mockGet,
            getOrThrow: mockGetOrThrow,
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('hashPassword', () => {
    it('should hash password with bcrypt', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = '$2b$10$hashedpassword';

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const result = await authService.hashPassword(password);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(result).toBe(hashedPassword);
    });

    it('should use 10 rounds for bcrypt', async () => {
      const password = 'AnyPassword';

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

      await authService.hashPassword(password);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
    });
  });

  describe('login', () => {
    beforeEach(() => {
      // Setup common mocks for login tests
      mockGetOrThrow.mockReturnValue('jwt-secret');
      mockGet.mockReturnValue('15m');
      mockSignAsync
        .mockResolvedValueOnce(mockTokens.accessToken)
        .mockResolvedValueOnce(mockTokens.refreshToken);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh-token');
    });

    it('should return tokens and user on valid credentials', async () => {
      mockUserFindUnique.mockResolvedValue(mockUser);
      mockMembershipFindFirst.mockResolvedValue(mockMembership);
      mockUserUpdate.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.login('test@trafi.dev', 'ValidPassword123!');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('test@trafi.dev');
      expect(result.user.id).toBe(mockUser.id);
      expect(result.user.storeId).toBe(mockMembership.storeId);
      expect(result.user.role).toBe(mockMembership.role);
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      mockUserFindUnique.mockResolvedValue(null);

      await expect(authService.login('nonexistent@trafi.dev', 'password')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      mockUserFindUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login('test@trafi.dev', 'WrongPassword')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      const inactiveUser = { ...mockUser, status: 'INACTIVE' as const };
      mockUserFindUnique.mockResolvedValue(inactiveUser);

      await expect(authService.login('test@trafi.dev', 'ValidPassword123!')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for invited user', async () => {
      const invitedUser = { ...mockUser, status: 'INVITED' as const };
      mockUserFindUnique.mockResolvedValue(invitedUser);

      await expect(authService.login('test@trafi.dev', 'ValidPassword123!')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for user without active membership', async () => {
      mockUserFindUnique.mockResolvedValue(mockUser);
      mockMembershipFindFirst.mockResolvedValue(null); // No active membership
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(authService.login('test@trafi.dev', 'ValidPassword123!')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should update lastLoginAt on successful login', async () => {
      mockUserFindUnique.mockResolvedValue(mockUser);
      mockMembershipFindFirst.mockResolvedValue(mockMembership);
      mockUserUpdate.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await authService.login('test@trafi.dev', 'ValidPassword123!');

      expect(mockUserUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockUser.id },
          data: expect.objectContaining({
            lastLoginAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should store hashed refresh token on successful login', async () => {
      mockUserFindUnique.mockResolvedValue(mockUser);
      mockMembershipFindFirst.mockResolvedValue(mockMembership);
      mockUserUpdate.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await authService.login('test@trafi.dev', 'ValidPassword123!');

      // Check that refresh token hash is stored
      expect(mockUserUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockUser.id },
          data: expect.objectContaining({
            refreshTokenHash: expect.any(String),
          }),
        }),
      );
    });

    it('should return correct user permissions based on role', async () => {
      mockUserFindUnique.mockResolvedValue(mockUser);
      mockMembershipFindFirst.mockResolvedValue(mockMembership);
      mockUserUpdate.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.login('test@trafi.dev', 'ValidPassword123!');

      expect(result.user.permissions).toBeDefined();
      expect(Array.isArray(result.user.permissions)).toBe(true);
    });
  });

  describe('refreshAccessToken', () => {
    beforeEach(() => {
      mockGetOrThrow.mockReturnValue('jwt-refresh-secret');
      mockGet.mockReturnValue('15m');
    });

    it('should return new tokens for valid refresh token', async () => {
      // Reset signAsync mock to clear any previous mock implementations
      mockSignAsync.mockReset();

      const userWithRefreshHash = {
        ...mockUser,
        refreshTokenHash: '$2b$10$validrefreshhash',
      };

      mockVerifyAsync.mockResolvedValue({ sub: mockUser.id, tenantId: mockMembership.storeId, type: 'refresh' });
      mockUserFindUnique.mockResolvedValue(userWithRefreshHash);
      mockMembershipFindFirst.mockResolvedValue(mockMembership);
      mockUserUpdate.mockResolvedValue(userWithRefreshHash);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-refresh');
      mockSignAsync
        .mockResolvedValueOnce('new.access.token')
        .mockResolvedValueOnce('new.refresh.token');

      const result = await authService.refreshAccessToken('valid.refresh.token');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.accessToken).toBe('new.access.token');
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      mockVerifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(authService.refreshAccessToken('invalid.token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockVerifyAsync.mockResolvedValue({ sub: 'nonexistent', tenantId: 'store_test123', type: 'refresh' });
      mockUserFindUnique.mockResolvedValue(null);

      await expect(authService.refreshAccessToken('valid.token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if refresh token hash does not match', async () => {
      const userWithRefreshHash = {
        ...mockUser,
        refreshTokenHash: '$2b$10$differenthash',
      };

      mockVerifyAsync.mockResolvedValue({ sub: mockUser.id, tenantId: mockMembership.storeId, type: 'refresh' });
      mockUserFindUnique.mockResolvedValue(userWithRefreshHash);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.refreshAccessToken('mismatched.token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if no active membership for the store', async () => {
      const userWithRefreshHash = {
        ...mockUser,
        refreshTokenHash: '$2b$10$validrefreshhash',
      };

      mockVerifyAsync.mockResolvedValue({ sub: mockUser.id, tenantId: mockMembership.storeId, type: 'refresh' });
      mockUserFindUnique.mockResolvedValue(userWithRefreshHash);
      mockMembershipFindFirst.mockResolvedValue(null); // No active membership
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(authService.refreshAccessToken('valid.refresh.token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should implement token rotation (invalidate old token)', async () => {
      const userWithRefreshHash = {
        ...mockUser,
        refreshTokenHash: '$2b$10$oldhash',
      };

      mockVerifyAsync.mockResolvedValue({ sub: mockUser.id, tenantId: mockMembership.storeId, type: 'refresh' });
      mockUserFindUnique.mockResolvedValue(userWithRefreshHash);
      mockMembershipFindFirst.mockResolvedValue(mockMembership);
      mockUserUpdate.mockResolvedValue(userWithRefreshHash);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-refresh');
      mockSignAsync
        .mockResolvedValueOnce('new.access.token')
        .mockResolvedValueOnce('new.refresh.token');

      await authService.refreshAccessToken('old.refresh.token');

      // Verify new refresh token hash is stored
      expect(mockUserUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockUser.id },
          data: expect.objectContaining({
            refreshTokenHash: 'new-hashed-refresh',
          }),
        }),
      );
    });
  });

  describe('logout', () => {
    it('should clear refresh token hash', async () => {
      mockUserUpdate.mockResolvedValue(mockUser);

      await authService.logout(mockUser.id);

      expect(mockUserUpdate).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { refreshTokenHash: null },
      });
    });
  });

  describe('validateJwtPayload', () => {
    it('should return user for valid payload', async () => {
      mockUserFindUnique.mockResolvedValue(mockUser);
      mockMembershipFindFirst.mockResolvedValue(mockMembership);

      const payload = {
        sub: mockUser.id,
        tenantId: mockMembership.storeId,
        role: 'ADMIN' as const,
        permissions: ['products:read'],
        type: 'session' as const,
        iat: Date.now(),
        exp: Date.now() + 900000,
      };

      const result = await authService.validateJwtPayload(payload);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(mockUser.id);
      expect(result?.email).toBe(mockUser.email);
    });

    it('should return null for non-existent user', async () => {
      mockUserFindUnique.mockResolvedValue(null);

      const payload = {
        sub: 'nonexistent',
        tenantId: 'store123',
        role: 'ADMIN' as const,
        permissions: [],
        type: 'session' as const,
        iat: Date.now(),
        exp: Date.now() + 900000,
      };

      const result = await authService.validateJwtPayload(payload);

      expect(result).toBeNull();
    });

    it('should return null for inactive user', async () => {
      const inactiveUser = { ...mockUser, status: 'INACTIVE' as const };
      mockUserFindUnique.mockResolvedValue(inactiveUser);

      const payload = {
        sub: mockUser.id,
        tenantId: mockMembership.storeId,
        role: 'ADMIN' as const,
        permissions: [],
        type: 'session' as const,
        iat: Date.now(),
        exp: Date.now() + 900000,
      };

      const result = await authService.validateJwtPayload(payload);

      expect(result).toBeNull();
    });

    it('should return null for tenant mismatch (no active membership)', async () => {
      mockUserFindUnique.mockResolvedValue(mockUser);
      mockMembershipFindFirst.mockResolvedValue(null); // No membership for the store in token

      const payload = {
        sub: mockUser.id,
        tenantId: 'different_store_id',
        role: 'ADMIN' as const,
        permissions: [],
        type: 'session' as const,
        iat: Date.now(),
        exp: Date.now() + 900000,
      };

      const result = await authService.validateJwtPayload(payload);

      expect(result).toBeNull();
    });
  });

  describe('JWT Token Generation', () => {
    it('should generate access token with correct payload structure', async () => {
      mockUserFindUnique.mockResolvedValue(mockUser);
      mockMembershipFindFirst.mockResolvedValue(mockMembership);
      mockUserUpdate.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      mockGetOrThrow.mockReturnValue('jwt-secret');
      mockGet.mockReturnValue('15m');
      mockSignAsync
        .mockResolvedValueOnce('access.token')
        .mockResolvedValueOnce('refresh.token');

      await authService.login('test@trafi.dev', 'password');

      // Verify access token payload structure (uses membership's storeId and role)
      expect(mockSignAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockUser.id,
          tenantId: mockMembership.storeId,
          role: mockMembership.role,
          permissions: expect.any(Array),
          type: 'session',
        }),
      );
    });

    it('should generate refresh token with correct payload structure', async () => {
      mockUserFindUnique.mockResolvedValue(mockUser);
      mockMembershipFindFirst.mockResolvedValue(mockMembership);
      mockUserUpdate.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      mockGetOrThrow.mockReturnValue('jwt-refresh-secret');
      mockGet.mockReturnValue('15m');
      mockSignAsync
        .mockResolvedValueOnce('access.token')
        .mockResolvedValueOnce('refresh.token');

      await authService.login('test@trafi.dev', 'password');

      // Verify refresh token is generated with store context from membership
      expect(mockSignAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockUser.id,
          tenantId: mockMembership.storeId,
          type: 'refresh',
        }),
        expect.objectContaining({
          secret: expect.any(String),
          expiresIn: '7d',
        }),
      );
    });
  });

  describe('switchStore', () => {
    it('should return new tokens for valid store switch', async () => {
      const newMembership: StoreMembership = {
        ...mockMembership,
        id: 'smem_new123',
        storeId: 'store_new123',
        role: 'EDITOR',
      };

      mockUserFindUnique.mockResolvedValue(mockUser);
      mockMembershipFindFirst.mockResolvedValue(newMembership);
      mockUserUpdate.mockResolvedValue(mockUser);
      mockGetOrThrow.mockReturnValue('jwt-secret');
      mockGet.mockReturnValue('15m');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      mockSignAsync
        .mockResolvedValueOnce('new.access.token')
        .mockResolvedValueOnce('new.refresh.token');

      const result = await authService.switchStore(mockUser.id, 'store_new123');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.storeId).toBe('store_new123');
      expect(result.user.role).toBe('EDITOR');
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      const inactiveUser = { ...mockUser, status: 'INACTIVE' as const };
      mockUserFindUnique.mockResolvedValue(inactiveUser);

      await expect(authService.switchStore(mockUser.id, 'store_new123')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if no membership for target store', async () => {
      mockUserFindUnique.mockResolvedValue(mockUser);
      mockMembershipFindFirst.mockResolvedValue(null);

      await expect(authService.switchStore(mockUser.id, 'store_no_access')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
