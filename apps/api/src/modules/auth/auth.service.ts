import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@database/prisma.service';
import type { User } from '@generated/prisma/client';
import type { AuthenticatedUser, AuthResponse, UserRole, JwtPayload } from '@trafi/types';
import { DEFAULT_ROLE_PERMISSIONS } from '@trafi/types';

/**
 * Authentication service for admin dashboard access
 *
 * IMPORTANT: Use `protected` methods (not `private`) to support
 * merchant overrides in @trafi/core distribution model.
 *
 * @see epic-1-retrospective.md#Trafi-Core-Override-Pattern
 */
@Injectable()
export class AuthService {
  protected readonly BCRYPT_ROUNDS = 10;

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly jwtService: JwtService,
    protected readonly configService: ConfigService
  ) {}

  /**
   * Authenticate user with email and password
   * @returns AuthResponse with tokens and user info
   * @throws UnauthorizedException if credentials are invalid
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    const user = await this.validateUser(email, password);

    if (!user) {
      // Generic error message - don't reveal if email exists
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login timestamp
    await this.updateLastLogin(user.id);

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Store hashed refresh token
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.toAuthenticatedUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: this.getAccessTokenExpiration(),
    };
  }

  /**
   * Validate user credentials
   * Protected for merchant override (e.g., add 2FA)
   */
  protected async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      return null;
    }

    const isPasswordValid = await this.comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  /**
   * Generate JWT access and refresh tokens
   * Protected for merchant override (e.g., custom claims)
   */
  protected async generateTokens(
    user: User
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const permissions = this.getPermissionsForRole(user.role as UserRole);

    const payload = {
      sub: user.id,
      tenantId: user.storeId,
      role: user.role,
      permissions,
      type: 'session' as const,
    };

    const refreshPayload = {
      sub: user.id,
      tenantId: user.storeId,
      type: 'refresh' as const,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  /**
   * Hash a password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.BCRYPT_ROUNDS);
  }

  /**
   * Compare plaintext password with hash
   * Uses timing-safe comparison via bcrypt
   */
  protected async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Get permissions array for a given role
   */
  protected getPermissionsForRole(role: UserRole): string[] {
    const permissions = DEFAULT_ROLE_PERMISSIONS[role];
    return permissions ?? [];
  }

  /**
   * Update user's last login timestamp
   */
  protected async updateLastLogin(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  /**
   * Store hashed refresh token for user
   */
  protected async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const hashedToken = await bcrypt.hash(refreshToken, this.BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: hashedToken },
    });
  }

  /**
   * Convert User entity to AuthenticatedUser response
   */
  protected toAuthenticatedUser(user: User): AuthenticatedUser {
    const role = user.role as UserRole;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role,
      storeId: user.storeId,
      permissions: this.getPermissionsForRole(role),
    };
  }

  /**
   * Get access token expiration in seconds
   */
  protected getAccessTokenExpiration(): number {
    const expiration = this.configService.get<string>('JWT_EXPIRATION', '15m');
    // Parse expiration string (e.g., '15m', '1h', '7d')
    const match = expiration.match(/^(\d+)([smhd])$/);
    if (!match) return 900; // Default 15 minutes

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 900;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.status !== 'ACTIVE') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Verify refresh token hash matches
      if (!user.refreshTokenHash) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const isValidRefreshToken = await bcrypt.compare(refreshToken, user.refreshTokenHash);
      if (!isValidRefreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new tokens (rotation)
      const tokens = await this.generateTokens(user);

      // Store new refresh token hash
      await this.storeRefreshToken(user.id, tokens.refreshToken);

      return {
        user: this.toAuthenticatedUser(user),
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: this.getAccessTokenExpiration(),
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Invalidate user's refresh token (logout)
   */
  async logout(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
  }

  /**
   * Validate JWT payload and return user
   * Used by JwtStrategy
   */
  async validateJwtPayload(payload: JwtPayload): Promise<AuthenticatedUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || user.status !== 'ACTIVE') {
      return null;
    }

    // Verify tenant matches
    if (user.storeId !== payload.tenantId) {
      return null;
    }

    return this.toAuthenticatedUser(user);
  }
}
