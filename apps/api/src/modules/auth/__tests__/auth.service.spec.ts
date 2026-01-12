import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../auth.service';
import { PrismaService } from '@database';
import type { User } from '@generated/prisma/client';

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
  const mockFindUnique = jest.fn();
  const mockUpdate = jest.fn();
  const mockSignAsync = jest.fn();
  const mockVerifyAsync = jest.fn();
  const mockGet = jest.fn();
  const mockGetOrThrow = jest.fn();

  const mockUser: User = {
    id: 'user_test123',
    email: 'test@trafi.dev',
    name: 'Test User',
    passwordHash: '$2b$10$hashedpassword',
    role: 'ADMIN',
    status: 'ACTIVE',
    storeId: 'store_test123',
    lastLoginAt: null,
    refreshTokenHash: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
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
              findUnique: mockFindUnique,
              update: mockUpdate,
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
      mockFindUnique.mockResolvedValue(mockUser);
      mockUpdate.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.login('test@trafi.dev', 'ValidPassword123!');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('test@trafi.dev');
      expect(result.user.id).toBe(mockUser.id);
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      mockFindUnique.mockResolvedValue(null);

      await expect(authService.login('nonexistent@trafi.dev', 'password')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      mockFindUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login('test@trafi.dev', 'WrongPassword')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      const inactiveUser = { ...mockUser, status: 'INACTIVE' as const };
      mockFindUnique.mockResolvedValue(inactiveUser);

      await expect(authService.login('test@trafi.dev', 'ValidPassword123!')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for invited user', async () => {
      const invitedUser = { ...mockUser, status: 'INVITED' as const };
      mockFindUnique.mockResolvedValue(invitedUser);

      await expect(authService.login('test@trafi.dev', 'ValidPassword123!')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should update lastLoginAt on successful login', async () => {
      mockFindUnique.mockResolvedValue(mockUser);
      mockUpdate.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await authService.login('test@trafi.dev', 'ValidPassword123!');

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockUser.id },
          data: expect.objectContaining({
            lastLoginAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should store hashed refresh token on successful login', async () => {
      mockFindUnique.mockResolvedValue(mockUser);
      mockUpdate.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await authService.login('test@trafi.dev', 'ValidPassword123!');

      // Check that refresh token hash is stored
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockUser.id },
          data: expect.objectContaining({
            refreshTokenHash: expect.any(String),
          }),
        }),
      );
    });

    it('should return correct user permissions based on role', async () => {
      mockFindUnique.mockResolvedValue(mockUser);
      mockUpdate.mockResolvedValue(mockUser);
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

      mockVerifyAsync.mockResolvedValue({ sub: mockUser.id, type: 'refresh' });
      mockFindUnique.mockResolvedValue(userWithRefreshHash);
      mockUpdate.mockResolvedValue(userWithRefreshHash);
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
      mockVerifyAsync.mockResolvedValue({ sub: 'nonexistent', type: 'refresh' });
      mockFindUnique.mockResolvedValue(null);

      await expect(authService.refreshAccessToken('valid.token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if refresh token hash does not match', async () => {
      const userWithRefreshHash = {
        ...mockUser,
        refreshTokenHash: '$2b$10$differenthash',
      };

      mockVerifyAsync.mockResolvedValue({ sub: mockUser.id, type: 'refresh' });
      mockFindUnique.mockResolvedValue(userWithRefreshHash);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.refreshAccessToken('mismatched.token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should implement token rotation (invalidate old token)', async () => {
      const userWithRefreshHash = {
        ...mockUser,
        refreshTokenHash: '$2b$10$oldhash',
      };

      mockVerifyAsync.mockResolvedValue({ sub: mockUser.id, type: 'refresh' });
      mockFindUnique.mockResolvedValue(userWithRefreshHash);
      mockUpdate.mockResolvedValue(userWithRefreshHash);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-refresh');
      mockSignAsync
        .mockResolvedValueOnce('new.access.token')
        .mockResolvedValueOnce('new.refresh.token');

      await authService.refreshAccessToken('old.refresh.token');

      // Verify new refresh token hash is stored
      expect(mockUpdate).toHaveBeenCalledWith(
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
      mockUpdate.mockResolvedValue(mockUser);

      await authService.logout(mockUser.id);

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { refreshTokenHash: null },
      });
    });
  });

  describe('validateJwtPayload', () => {
    it('should return user for valid payload', async () => {
      mockFindUnique.mockResolvedValue(mockUser);

      const payload = {
        sub: mockUser.id,
        tenantId: mockUser.storeId,
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
      mockFindUnique.mockResolvedValue(null);

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
      mockFindUnique.mockResolvedValue(inactiveUser);

      const payload = {
        sub: mockUser.id,
        tenantId: mockUser.storeId,
        role: 'ADMIN' as const,
        permissions: [],
        type: 'session' as const,
        iat: Date.now(),
        exp: Date.now() + 900000,
      };

      const result = await authService.validateJwtPayload(payload);

      expect(result).toBeNull();
    });

    it('should return null for tenant mismatch', async () => {
      mockFindUnique.mockResolvedValue(mockUser);

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
      mockFindUnique.mockResolvedValue(mockUser);
      mockUpdate.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      mockGetOrThrow.mockReturnValue('jwt-secret');
      mockGet.mockReturnValue('15m');
      mockSignAsync
        .mockResolvedValueOnce('access.token')
        .mockResolvedValueOnce('refresh.token');

      await authService.login('test@trafi.dev', 'password');

      // Verify access token payload structure
      expect(mockSignAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockUser.id,
          tenantId: mockUser.storeId,
          role: mockUser.role,
          permissions: expect.any(Array),
          type: 'session',
        }),
      );
    });

    it('should generate refresh token with correct payload structure', async () => {
      mockFindUnique.mockResolvedValue(mockUser);
      mockUpdate.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      mockGetOrThrow.mockReturnValue('jwt-refresh-secret');
      mockGet.mockReturnValue('15m');
      mockSignAsync
        .mockResolvedValueOnce('access.token')
        .mockResolvedValueOnce('refresh.token');

      await authService.login('test@trafi.dev', 'password');

      // Verify refresh token is generated with different settings
      expect(mockSignAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockUser.id,
          tenantId: mockUser.storeId,
          type: 'refresh',
        }),
        expect.objectContaining({
          secret: expect.any(String),
          expiresIn: '7d',
        }),
      );
    });
  });
});
