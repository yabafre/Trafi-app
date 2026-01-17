import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { StoreSettingsResponseDto, UpdateStoreSettingsDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@trafi/types';

/**
 * Store Settings management controller
 *
 * All endpoints require authentication and appropriate permissions.
 * Uses multi-tenancy - settings are scoped to the authenticated user's store.
 *
 * Permissions:
 * - settings:read: View store settings
 * - settings:update: Modify store settings
 *
 * @see epic-02-admin-auth.md#Story-2.7
 */
@ApiTags('store-settings')
@Controller('store-settings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  /**
   * Get store settings for the authenticated user's store
   */
  @Get()
  @RequirePermissions('settings:read')
  @ApiOperation({
    summary: 'Get store settings',
    description:
      'Retrieve all settings for the authenticated store. Returns default values if no settings have been configured.',
  })
  @ApiResponse({
    status: 200,
    description: 'Settings retrieved successfully',
    type: StoreSettingsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not found - store does not exist' })
  async get(@CurrentUser() user: AuthenticatedUser): Promise<StoreSettingsResponseDto> {
    return this.settingsService.get(user.storeId);
  }

  /**
   * Update store settings
   */
  @Patch()
  @RequirePermissions('settings:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update store settings',
    description:
      'Update settings for the authenticated store. Creates settings if they do not exist (upsert behavior). All fields are optional - only provided fields are updated.',
  })
  @ApiBody({ type: UpdateStoreSettingsDto })
  @ApiResponse({
    status: 200,
    description: 'Settings updated successfully',
    type: StoreSettingsResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Not found - store does not exist' })
  async update(
    @Body() input: UpdateStoreSettingsDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<StoreSettingsResponseDto> {
    return this.settingsService.update(user.storeId, input);
  }
}
