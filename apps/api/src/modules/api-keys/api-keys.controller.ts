import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { ApiKeysService } from './api-keys.service';
import {
  CreateApiKeyDto,
  ListApiKeysDto,
  ApiKeyResponseDto,
  ApiKeyCreatedResponseDto,
  ApiKeysListResponseDto,
} from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@trafi/types';

/**
 * API Key management controller for SDK authentication
 *
 * All endpoints require authentication and appropriate permissions.
 * Uses multi-tenancy - API keys are scoped to the authenticated user's store.
 *
 * IMPORTANT: The full API key is returned ONLY on creation.
 * All subsequent requests return only the masked key (prefix + last 4 chars).
 *
 * @see epic-02-admin-auth.md#Story-2.5
 */
@ApiTags('api-keys')
@Controller('api-keys')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  /**
   * List all API keys for the authenticated user's store
   */
  @Get()
  @RequirePermissions('api-keys:read')
  @ApiOperation({
    summary: 'List API keys',
    description:
      'Returns a paginated list of API keys for the authenticated store. Keys are masked (showing only prefix and last 4 characters).',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (1-indexed)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (max 100)',
    example: 20,
  })
  @ApiQuery({
    name: 'includeRevoked',
    required: false,
    type: Boolean,
    description: 'Include revoked keys in the list',
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'API keys list retrieved successfully',
    type: ApiKeysListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async list(
    @Query() query: ListApiKeysDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ApiKeysListResponseDto> {
    return this.apiKeysService.list(user.storeId, query);
  }

  /**
   * Create a new API key
   */
  @Post()
  @RequirePermissions('api-keys:manage')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create API key',
    description:
      'Creates a new API key with the specified scopes. IMPORTANT: The full key is returned ONLY in this response and will NEVER be shown again.',
  })
  @ApiBody({ type: CreateApiKeyDto })
  @ApiResponse({
    status: 201,
    description: 'API key created successfully. Copy the key NOW - it will not be shown again.',
    type: ApiKeyCreatedResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async create(
    @Body() input: CreateApiKeyDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ApiKeyCreatedResponseDto> {
    return this.apiKeysService.create(user.storeId, user.id, input);
  }

  /**
   * Get a single API key by ID
   */
  @Get(':id')
  @RequirePermissions('api-keys:read')
  @ApiOperation({
    summary: 'Get API key',
    description: 'Returns details of a single API key (masked).',
  })
  @ApiParam({
    name: 'id',
    description: 'API key ID',
    example: 'clw123abc456',
  })
  @ApiResponse({
    status: 200,
    description: 'API key retrieved successfully',
    type: ApiKeyResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not found - API key does not exist' })
  async findOne(
    @Param('id') keyId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ApiKeyResponseDto> {
    return this.apiKeysService.findOne(user.storeId, keyId);
  }

  /**
   * Revoke an API key
   */
  @Delete(':id')
  @RequirePermissions('api-keys:manage')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Revoke API key',
    description:
      'Immediately revokes an API key. Any requests using this key will receive 401 Unauthorized. This action is irreversible.',
  })
  @ApiParam({
    name: 'id',
    description: 'API key ID to revoke',
    example: 'clw123abc456',
  })
  @ApiResponse({
    status: 200,
    description: 'API key revoked successfully',
    type: ApiKeyResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not found - API key does not exist' })
  async revoke(
    @Param('id') keyId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ApiKeyResponseDto> {
    return this.apiKeysService.revoke(user.storeId, keyId);
  }
}
