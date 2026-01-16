import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Public } from '@common/decorators/public.decorator';
import { LoginSchema, RefreshTokenRequestSchema } from '@trafi/validators';
import type { AuthenticatedUser, AuthResponse } from '@trafi/types';
import {
  LoginDto,
  RefreshTokenDto,
  AuthResponseDto,
  AuthenticatedUserDto,
  ErrorResponseDto,
} from './dto';
import { RequirePermissions, Roles, CurrentUser } from './decorators';
import { PermissionsGuard, RolesGuard } from './guards';

/**
 * Authentication controller for admin dashboard
 *
 * Handles login, logout, and token refresh endpoints
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Login with email and password
   * Returns JWT access and refresh tokens
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login with email and password',
    description:
      'Authenticates an admin user and returns JWT access and refresh tokens. ' +
      'Access tokens expire in 15 minutes, refresh tokens in 7 days.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Successfully authenticated. Returns user info and tokens.',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials (generic message for security)',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error (invalid email format or password length)',
    type: ErrorResponseDto,
  })
  async login(@Body() body: unknown): Promise<AuthResponse> {
    // Validate input with Zod schema
    const credentials = LoginSchema.parse(body);
    return this.authService.login(credentials.email, credentials.password);
  }

  /**
   * Refresh access token using refresh token
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Exchanges a valid refresh token for a new access token and refresh token pair. ' +
      'Implements token rotation - the old refresh token is invalidated.',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Tokens refreshed successfully.',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token',
    type: ErrorResponseDto,
  })
  async refresh(@Body() body: unknown): Promise<AuthResponse> {
    // Validate input with Zod schema
    const { refreshToken } = RefreshTokenRequestSchema.parse(body);
    return this.authService.refreshAccessToken(refreshToken);
  }

  /**
   * Logout - invalidate refresh token
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Logout and invalidate refresh token',
    description:
      'Invalidates the user\'s refresh token, effectively logging them out. ' +
      'The access token will still be valid until it expires.',
  })
  @ApiResponse({
    status: 204,
    description: 'Successfully logged out',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing access token',
    type: ErrorResponseDto,
  })
  async logout(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.authService.logout(user.id);
  }

  /**
   * Get current authenticated user info
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get current user info',
    description: 'Returns the authenticated user\'s profile information including role and permissions.',
  })
  @ApiResponse({
    status: 200,
    description: 'Current user information',
    type: AuthenticatedUserDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing access token',
    type: ErrorResponseDto,
  })
  me(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }

  /**
   * Test endpoint: requires products:read permission
   * Used for verifying RBAC implementation
   */
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('products:read')
  @Get('test/products-read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Test products:read permission',
    description:
      'Test endpoint that requires products:read permission. Used for RBAC verification.',
  })
  @ApiResponse({
    status: 200,
    description: 'User has products:read permission',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Access granted' },
        permission: { type: 'string', example: 'products:read' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions',
    type: ErrorResponseDto,
  })
  testProductsRead(): { message: string; permission: string } {
    return {
      message: 'Access granted',
      permission: 'products:read',
    };
  }

  /**
   * Test endpoint: requires OWNER or ADMIN role
   * Used for verifying RBAC implementation
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @Get('test/admin-only')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Test OWNER/ADMIN role requirement',
    description:
      'Test endpoint that requires OWNER or ADMIN role. Used for RBAC verification.',
  })
  @ApiResponse({
    status: 200,
    description: 'User has required role',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Access granted' },
        requiredRoles: {
          type: 'array',
          items: { type: 'string' },
          example: ['OWNER', 'ADMIN'],
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient role privileges',
    type: ErrorResponseDto,
  })
  testAdminOnly(): { message: string; requiredRoles: string[] } {
    return {
      message: 'Access granted',
      requiredRoles: ['OWNER', 'ADMIN'],
    };
  }
}
